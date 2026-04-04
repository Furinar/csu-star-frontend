"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addLike, removeLike } from "@/api/detail";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import EvaluationBarChart from "@/components/detail/EvaluationBarChart";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import BilibiliCommentThread from "@/components/ui/BilibiliCommentThread";
import type { ItemActionMenuItem } from "@/components/ui/ItemActionMenu";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import { DetailSection } from "./DetailScaffold";
import { Role } from "@/types/auth";
import type {
  CourseEvaluation,
  CourseEvaluationInput,
  EvaluationReply,
  EvaluationReplyInput,
  EvaluationSort,
  PaginatedData,
  TeacherEvaluation,
  TeacherEvaluationInput,
} from "@/types/detail";
import { submitReport } from "@/api/me";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";

type ThreadEvaluation = TeacherEvaluation | CourseEvaluation;
type EvaluationType = "teacher" | "course";
type LikeItemType =
  | "teacher_evaluation"
  | "course_evaluation"
  | "teacher_evaluation_reply"
  | "course_evaluation_reply";
type ReportItemType =
  | "teacher_evaluation"
  | "course_evaluation"
  | "teacher_evaluation_reply"
  | "course_evaluation_reply";

interface ReplyTarget {
  replyId?: string | null;
  userId?: string | null;
  userName?: string | null;
}

interface RelatedItem {
  id: number;
  name: string;
}

export interface DetailEvaluationSectionProps {
  title: React.ReactNode;
  description: React.ReactNode;
  sectionAction?: ReactNode;
  evaluationType: EvaluationType;
  relatedItems?: RelatedItem[];
  initialItems: ThreadEvaluation[];
  initialTotal: number;
  initialPage?: number;
  listEvaluations: (
    page: number,
    size: number,
    sort: EvaluationSort,
  ) => Promise<PaginatedData<ThreadEvaluation>>;
  onReply: (evaluationId: string, payload: EvaluationReplyInput) => Promise<EvaluationReply | null>;
  onUpdateEvaluation: (
    evaluationId: string,
    payload: TeacherEvaluationInput | CourseEvaluationInput,
  ) => Promise<ThreadEvaluation | null>;
  onDeleteEvaluation: (evaluationId: string) => Promise<void>;
  onUpdateReply: (
    replyId: string,
    payload: Pick<EvaluationReplyInput, "content" | "is_anonymous">,
  ) => Promise<EvaluationReply | null>;
  onDeleteReply: (replyId: string) => Promise<void>;
}

function sortLabel(sort: EvaluationSort) {
  return sort === "likes" ? "按热度" : "按时间";
}

function buildEvaluationInitialValues(evaluation: ThreadEvaluation) {
  const relatedId =
    "teacher_id" in evaluation
      ? evaluation.teacher_id
        ? Number(evaluation.teacher_id)
        : null
      : evaluation.course_id
        ? Number(evaluation.course_id)
        : null;

  return {
    relatedId,
    comment: evaluation.comment ?? "",
    anonymous: evaluation.is_anonymous ?? false,
    ratings:
      "teacher_id" in evaluation
        ? {
            rating_homework: evaluation.rating_homework,
            rating_gain: evaluation.rating_gain,
            rating_exam_difficulty: evaluation.rating_exam_difficulty,
            rating_quality: evaluation.rating_quality,
            rating_grading: evaluation.rating_grading,
            rating_attendance: evaluation.rating_attendance,
          }
        : {
            rating_quality: evaluation.rating_quality,
            rating_grading: evaluation.rating_grading,
            rating_attendance: evaluation.rating_attendance,
            rating_homework: evaluation.rating_homework,
            rating_gain: evaluation.rating_gain,
            rating_exam_difficulty: evaluation.rating_exam_difficulty,
          },
  };
}

export default function DetailEvaluationSection({
  title,
  description,
  sectionAction,
  evaluationType,
  relatedItems = [],
  initialItems,
  initialTotal,
  initialPage = 1,
  listEvaluations,
  onReply,
  onUpdateEvaluation,
  onDeleteEvaluation,
  onUpdateReply,
  onDeleteReply,
}: DetailEvaluationSectionProps) {
  const authUser = useAuthStore((state) => state.user);
  const viewerId = authUser?.id ?? null;
  const viewerRole = authUser?.role ?? null;
  const [items, setItems] = useState<ThreadEvaluation[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState<EvaluationSort>("created_at");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [draftMap, setDraftMap] = useState<Record<string, string>>({});
  const [replyAnonymousMap, setReplyAnonymousMap] = useState<Record<string, boolean>>({});
  const [targetMap, setTargetMap] = useState<Record<string, ReplyTarget>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [likeLoadingKey, setLikeLoadingKey] = useState<string | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<ThreadEvaluation | null>(null);
  const [editingReply, setEditingReply] = useState<{ evaluationId: string; reply: EvaluationReply } | null>(null);
  const [editingReplyDraft, setEditingReplyDraft] = useState("");
  const [editingReplyAnonymous, setEditingReplyAnonymous] = useState(false);
  const [isUpdatingReply, setIsUpdatingReply] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const didMountRef = useRef(false);

  useEffect(() => {
    setItems(initialItems);
    setTotal(initialTotal);
    setPage(initialPage);
  }, [initialItems, initialPage, initialTotal]);

  useEffect(() => {
    if (!editingReply) return;
    setEditingReplyDraft(editingReply.reply.content);
    setEditingReplyAnonymous(Boolean(editingReply.reply.is_anonymous));
  }, [editingReply]);

  const hasMore = items.length < total;
  const evaluationLikeType = evaluationType === "teacher" ? "teacher_evaluation" : "course_evaluation";
  const replyLikeType = evaluationType === "teacher" ? "teacher_evaluation_reply" : "course_evaluation_reply";
  const evaluationReportType: ReportItemType =
    evaluationType === "teacher" ? "teacher_evaluation" : "course_evaluation";
  const replyReportType: ReportItemType =
    evaluationType === "teacher" ? "teacher_evaluation_reply" : "course_evaluation_reply";

  const reloadEvaluations = useCallback(
    async (nextSort: EvaluationSort) => {
      try {
        setIsReloading(true);
        const result = await listEvaluations(1, 10, nextSort);
        setItems(result.items);
        setTotal(result.total);
        setPage(1);
      } catch (error) {
        console.error(error);
        feedback.error({ title: "加载评价失败", description: "请稍后重试。" });
      } finally {
        setIsReloading(false);
      }
    },
    [listEvaluations],
  );

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    void reloadEvaluations(sort);
  }, [sort, reloadEvaluations]);

  const fetchMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const result = await listEvaluations(nextPage, 10, sort);
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        return [...prev, ...result.items.filter((item) => !existingIds.has(item.id))];
      });
      setTotal(result.total);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
      feedback.error({
        title: "加载更多评价失败",
        description: "请稍后重试。",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, listEvaluations, page, sort]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || isLoadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchMore();
        }
      },
      { rootMargin: "280px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchMore, hasMore, isLoadingMore]);

  const handleReplySubmit = async (evaluationId: string) => {
    const content = draftMap[evaluationId]?.trim();
    if (!content) {
      feedback.warning({ title: "回复内容不能为空" });
      return;
    }

    try {
      setSubmittingId(evaluationId);
      const target = targetMap[evaluationId] || {};
      const reply = await onReply(evaluationId, {
        content,
        is_anonymous: Boolean(replyAnonymousMap[evaluationId]),
        reply_to_reply_id: target.replyId != null ? String(target.replyId) : null,
        reply_to_user_id: target.userId != null ? String(target.userId) : null,
      });

      if (!reply) return;

      setItems((prev) =>
        prev.map((item) =>
          item.id === evaluationId
            ? {
                ...item,
                replies: [...(item.replies || []), reply],
                reply_count: (item.reply_count || item.replies?.length || 0) + 1,
              }
            : item,
        ),
      );
      setDraftMap((prev) => ({ ...prev, [evaluationId]: "" }));
      setReplyAnonymousMap((prev) => ({ ...prev, [evaluationId]: false }));
      setTargetMap((prev) => ({ ...prev, [evaluationId]: {} }));
      setReplyingToId(null);
      feedback.success({ title: "回复成功" });
    } catch (error) {
      console.error(error);
      feedback.error({
        title: "回复失败",
        description: "网络错误，请稍后重试。",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleToggleLike = async (
    itemType: LikeItemType,
    id: string,
    currentLiked: boolean,
  ) => {
    const key = `${itemType}-${id}`;
    if (likeLoadingKey) return;

    setLikeLoadingKey(key);
    try {
      if (currentLiked) {
        await removeLike(itemType, id);
      } else {
        await addLike(itemType, id);
      }

      setItems((prev) =>
        prev.map((item) => {
          if ((itemType === "teacher_evaluation" || itemType === "course_evaluation") && item.id === id) {
            return {
              ...item,
              is_liked: !currentLiked,
              likes: Math.max(0, (item.likes || 0) + (currentLiked ? -1 : 1)),
            };
          }

          if ((itemType === "teacher_evaluation_reply" || itemType === "course_evaluation_reply") && item.replies) {
            return {
              ...item,
              replies: item.replies.map((reply) =>
                reply.id === id
                  ? {
                      ...reply,
                      is_liked: !currentLiked,
                      likes: Math.max(0, (reply.likes || 0) + (currentLiked ? -1 : 1)),
                    }
                  : reply,
              ),
            };
          }

          return item;
        }),
      );
    } catch (error) {
      console.error(error);
      feedback.error({ title: "操作失败", description: "请稍后重试。" });
    } finally {
      setLikeLoadingKey(null);
    }
  };

  const reportTarget = async (
    targetType: ReportItemType,
    targetId: string,
    label: string,
  ) => {
    try {
      await submitReport({
        target_type: targetType,
        target_id: String(targetId),
        reason: "other",
        description: `${label}举报`,
      });
      feedback.success({
        title: "举报已提交",
        description: "管理员会尽快处理。",
      });
    } catch (error) {
      console.error(error);
      feedback.error({ title: "举报失败", description: "请稍后重试。" });
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (!window.confirm("确认删除这条评价吗？")) return;
    try {
      setDeletingKey(`evaluation-${evaluationId}`);
      await onDeleteEvaluation(evaluationId);
      setItems((prev) => prev.filter((item) => String(item.id) !== evaluationId));
      setTotal((prev) => Math.max(0, prev - 1));
      feedback.success({ title: "评价已删除" });
    } catch (error) {
      console.error(error);
      feedback.error({ title: "删除失败", description: "请稍后重试。" });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleDeleteReply = async (evaluationId: string, replyId: string) => {
    if (!window.confirm("确认删除这条回复吗？")) return;
    try {
      setDeletingKey(`reply-${replyId}`);
      await onDeleteReply(replyId);
      setItems((prev) =>
        prev.map((item) =>
          String(item.id) === evaluationId
            ? {
                ...item,
                replies: (item.replies || []).filter((reply) => String(reply.id) !== replyId),
                reply_count: Math.max(0, (item.reply_count || item.replies?.length || 1) - 1),
              }
            : item,
        ),
      );
      feedback.success({ title: "回复已删除" });
    } catch (error) {
      console.error(error);
      feedback.error({ title: "删除失败", description: "请稍后重试。" });
    } finally {
      setDeletingKey(null);
    }
  };

  const handleUpdateReply = async () => {
    if (!editingReply) return;
    const content = editingReplyDraft.trim();
    if (!content) {
      feedback.warning({ title: "回复内容不能为空" });
      return;
    }
    try {
      setIsUpdatingReply(true);
      const updated = await onUpdateReply(editingReply.reply.id, {
        content,
        is_anonymous: editingReplyAnonymous,
      });
      if (!updated) return;
      setItems((prev) =>
        prev.map((item) =>
          String(item.id) === editingReply.evaluationId
            ? {
                ...item,
                replies: (item.replies || []).map((reply) =>
                  reply.id === editingReply.reply.id ? updated : reply,
                ),
              }
            : item,
        ),
      );
      setEditingReply(null);
      feedback.success({ title: "回复已更新" });
    } catch (error) {
      console.error(error);
      feedback.error({ title: "更新失败", description: "请稍后重试。" });
    } finally {
      setIsUpdatingReply(false);
    }
  };

  const buildEvaluationActions = (evaluation: ThreadEvaluation): ItemActionMenuItem[] => {
    const actions: ItemActionMenuItem[] = [];
    const authorId = evaluation.user?.id ?? null;
    const isAuthor = viewerId != null && authorId === viewerId;
    const isPrivileged = viewerRole === Role.Admin || viewerRole === Role.Auditor;

    if (isAuthor) {
      actions.push({
        key: "edit",
        label: "修改",
        onClick: () => setEditingEvaluation(evaluation),
      });
    }
    if (isAuthor || isPrivileged) {
      actions.push({
        key: "delete",
        label: deletingKey === `evaluation-${evaluation.id}` ? "删除中..." : "删除",
        destructive: true,
        onClick: () => handleDeleteEvaluation(String(evaluation.id)),
      });
    }
    if (!isAuthor) {
      actions.push({
        key: "report",
        label: "举报",
        onClick: () => reportTarget(evaluationReportType, String(evaluation.id), "评价"),
      });
    }
    return actions;
  };

  const buildReplyActions = (evaluationId: string, reply: EvaluationReply): ItemActionMenuItem[] => {
    const actions: ItemActionMenuItem[] = [];
    const isAuthor = viewerId != null && reply.user?.id === viewerId;
    const isPrivileged = viewerRole === Role.Admin || viewerRole === Role.Auditor;

    if (isAuthor) {
      actions.push({
        key: "edit",
        label: "修改",
        onClick: () => setEditingReply({ evaluationId, reply }),
      });
    }
    if (isAuthor || isPrivileged) {
      actions.push({
        key: "delete",
        label: deletingKey === `reply-${reply.id}` ? "删除中..." : "删除",
        destructive: true,
        onClick: () => handleDeleteReply(evaluationId, String(reply.id)),
      });
    }
    if (!isAuthor) {
      actions.push({
        key: "report",
        label: "举报",
        onClick: () => reportTarget(replyReportType, String(reply.id), "回复"),
      });
    }
    return actions;
  };

  const bilibiliComments = items.map((evaluation) => {
    const replies = evaluation.replies ?? [];
    const id = String(evaluation.id);

    return {
      id: evaluation.id,
      user: evaluation.user,
      isAnonymous: evaluation.is_anonymous,
      content: evaluation.comment || "该评价未填写文字内容。",
      createdAt: evaluation.created_at,
      likes: evaluation.likes,
      isLiked: evaluation.is_liked,
      replyCount: evaluation.reply_count ?? replies.length,
      onLike: (liked: boolean) => handleToggleLike(evaluationLikeType, id, liked),
      onReplyClick: () => {
        setReplyingToId(id);
        setReplyAnonymousMap((prev) => ({ ...prev, [id]: false }));
        setTargetMap((prev) => ({
          ...prev,
          [id]: {
            userId: evaluation.user?.id ?? null,
            userName: evaluation.is_anonymous
              ? "匿名用户"
              : evaluation.user?.nickname ?? null,
          },
        }));
      },
      actions: buildEvaluationActions(evaluation),
      isReplying: replyingToId === id,
      replyComposer:
        replyingToId === id ? (
          <div className="mt-3 flex flex-col gap-3">
            <textarea
              value={draftMap[id] || ""}
              onChange={(e) => setDraftMap((prev) => ({ ...prev, [id]: e.target.value }))}
              placeholder={targetMap[id]?.userName ? `回复 @${targetMap[id].userName}...` : "写下你的回复..."}
              className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-200 p-4 text-sm transition-all focus:border-[var(--page-accent-border)] focus:outline-none focus:ring-4 focus:ring-[var(--page-accent-soft)]"
            />
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <input
                type="checkbox"
                checked={Boolean(replyAnonymousMap[id])}
                onChange={(event) =>
                  setReplyAnonymousMap((prev) => ({ ...prev, [id]: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              匿名回复
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setReplyingToId(null);
                  setReplyAnonymousMap((prev) => ({ ...prev, [id]: false }));
                  setTargetMap((prev) => ({ ...prev, [id]: {} }));
                }}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                取消
              </button>
              <ActionSubmitButton
                defaultText="提交回复"
                isSent={submittingId === id}
                onClick={() => handleReplySubmit(id)}
                disabled={submittingId === id || !draftMap[id]?.trim()}
              />
            </div>
          </div>
        ) : null,
      afterContentSlot: (
        <div className="mb-3 space-y-2">
          <EvaluationBarChart evaluation={evaluation} theme={evaluationType} />
        </div>
      ),
      replies: replies.map((reply) => ({
        id: String(reply.id),
        user: reply.user,
        replyToUser: reply.reply_to_user,
        content: reply.content,
        createdAt: reply.created_at,
        likes: reply.likes,
        isLiked: reply.is_liked,
        onLike: (liked: boolean) => handleToggleLike(replyLikeType, String(reply.id), liked),
        onReplyClick: () => {
          setReplyingToId(id);
          setReplyAnonymousMap((prev) => ({ ...prev, [id]: false }));
          setTargetMap((prev) => ({
            ...prev,
            [id]: {
              replyId: String(reply.id),
              userId: reply.user?.id ?? reply.reply_to_user?.id ?? null,
              userName: reply.user?.nickname ?? reply.reply_to_user?.nickname ?? null,
            },
          }));
        },
        actions: buildReplyActions(id, reply),
      })),
    };
  });

  return (
    <>
      <DetailSection
        title={
          <div className="flex items-center gap-2">
            <span>{title}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-500">{total}</span>
          </div>
        }
        description={description}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
              {(["created_at", "likes"] as EvaluationSort[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSort(item)}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    sort === item
                      ? "bg-[image:var(--page-accent-gradient)] text-white"
                      : "text-slate-500 hover:text-[var(--page-accent-text)]"
                  }`}
                >
                  {sortLabel(item)}
                </button>
              ))}
            </div>
            {sectionAction}
          </div>
        }
      >
        {isReloading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--page-accent-text)]" />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            <BilibiliCommentThread comments={bilibiliComments} />
          </div>
        )}

        {hasMore && !isReloading ? (
          <div ref={loadMoreRef} className="py-10 flex justify-center">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--page-accent-text)]" />
                <span className="text-sm">加载更多评价中...</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </DetailSection>

      <DetailComposerModal
        isOpen={editingEvaluation !== null}
        onClose={() => setEditingEvaluation(null)}
        accent={evaluationType}
        badge={evaluationType === "teacher" ? "修改教师评价" : "修改课程评价"}
        title="编辑评价"
        description="修改评分、关联项、文字内容或匿名设置。"
      >
        {editingEvaluation ? (
          <EvaluationComposerForm
            evaluationType={evaluationType}
            relatedItems={relatedItems}
            submitLabel="保存修改"
            initialValues={buildEvaluationInitialValues(editingEvaluation)}
            onSubmit={async (payload) => {
              const updated = await onUpdateEvaluation(
                editingEvaluation.id,
                payload as unknown as TeacherEvaluationInput | CourseEvaluationInput,
              );
              if (!updated) return;
              setItems((prev) => prev.map((item) => (item.id === editingEvaluation.id ? updated : item)));
              setEditingEvaluation(null);
              feedback.success({ title: "评价已更新" });
            }}
          />
        ) : null}
      </DetailComposerModal>

      <DetailComposerModal
        isOpen={editingReply !== null}
        onClose={() => setEditingReply(null)}
        accent={evaluationType}
        badge="修改回复"
        title="编辑回复"
        description="可以修改回复内容，并重新选择是否匿名。"
      >
        {editingReply ? (
          <div className="space-y-4">
            <textarea
              value={editingReplyDraft}
              onChange={(event) => setEditingReplyDraft(event.target.value)}
              className="min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm focus:border-[var(--page-accent-border)] focus:outline-none focus:ring-4 focus:ring-[var(--page-accent-soft)]"
            />
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <input
                type="checkbox"
                checked={editingReplyAnonymous}
                onChange={(event) => setEditingReplyAnonymous(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              匿名回复
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingReply(null)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                取消
              </button>
              <ActionSubmitButton
                defaultText="保存修改"
                isSent={isUpdatingReply}
                onClick={handleUpdateReply}
                disabled={isUpdatingReply || !editingReplyDraft.trim()}
              />
            </div>
          </div>
        ) : null}
      </DetailComposerModal>
    </>
  );
}
