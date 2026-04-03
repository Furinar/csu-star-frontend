"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { addLike, removeLike } from "@/api/detail";
import { submitReport } from "@/api/me";
import { feedback } from "@/store/useFeedbackStore";
import type {
  CourseEvaluation,
  EvaluationReply,
  EvaluationReplyInput,
  PaginatedData,
  TeacherEvaluation,
} from "@/types/detail";
import { DetailSection } from "./DetailScaffold";
import BilibiliCommentThread from "@/components/ui/BilibiliCommentThread";
import EvaluationBarChart from "./EvaluationBarChart";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";

type ThreadEvaluation = TeacherEvaluation | CourseEvaluation;
type EvaluationType = "teacher" | "course";
type LikeItemType =
  | "teacher_evaluation"
  | "course_evaluation"
  | "teacher_evaluation_reply"
  | "course_evaluation_reply";
type ReportItemType =
  | "teacher_evaluation"
  | "course_evaluation";

interface ReplyTarget {
  replyId?: string | null;
  userId?: string | null;
  userName?: string | null;
}

export interface DetailEvaluationSectionProps {
  title: React.ReactNode;
  description: React.ReactNode;
  sectionAction?: ReactNode;
  evaluationType: EvaluationType;
  initialItems: ThreadEvaluation[];
  initialTotal: number;
  initialPage?: number;
  listEvaluations: (page: number, size: number) => Promise<PaginatedData<ThreadEvaluation>>;
  onReply: (evaluationId: string, payload: EvaluationReplyInput) => Promise<EvaluationReply | null>;
}

export default function DetailEvaluationSection({
  title,
  description,
  sectionAction,
  evaluationType,
  initialItems,
  initialTotal,
  initialPage = 1,
  listEvaluations,
  onReply,
}: DetailEvaluationSectionProps) {
  const [items, setItems] = useState<ThreadEvaluation[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [draftMap, setDraftMap] = useState<Record<string, string>>({});
  const [targetMap, setTargetMap] = useState<Record<string, ReplyTarget>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [likeLoadingKey, setLikeLoadingKey] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setTotal(initialTotal);
    setPage(initialPage);
  }, [initialItems, initialPage, initialTotal]);

  const hasMore = items.length < total;
  const evaluationLikeType = evaluationType === "teacher" ? "teacher_evaluation" : "course_evaluation";
  const replyLikeType = evaluationType === "teacher" ? "teacher_evaluation_reply" : "course_evaluation_reply";
  const evaluationReportType: ReportItemType =
    evaluationType === "teacher" ? "teacher_evaluation" : "course_evaluation";

  const fetchMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const result = await listEvaluations(nextPage, 10);
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
  }, [listEvaluations, page, hasMore, isLoadingMore]);

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
        setTargetMap(prev => ({ ...prev, [id]: {} }));
      },
      onReport: () => reportTarget(evaluationReportType, id, "评价"),
      isReplying: replyingToId === id,
      replyComposer: replyingToId === id ? (
        <div className="mt-3 flex flex-col gap-3">
          <textarea
            value={draftMap[id] || ""}
            onChange={(e) => setDraftMap(prev => ({ ...prev, [id]: e.target.value }))}
            placeholder={targetMap[id]?.userName ? `回复 @${targetMap[id].userName}...` : "写下你的回复..."}
            className="w-full min-h-[100px] rounded-2xl border border-slate-200 p-4 text-sm focus:border-rose-300 focus:outline-none focus:ring-4 focus:ring-rose-50 transition-all resize-none"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => {
                  setReplyingToId(null);
                  setTargetMap(prev => ({ ...prev, [id]: {} }));
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
      replies: replies.map((r) => ({
        id: String(r.id),
        user: r.user,
        replyToUser: r.reply_to_user,
        content: r.content,
        createdAt: r.created_at,
        likes: r.likes,
        isLiked: r.is_liked,
        onLike: (liked: boolean) => handleToggleLike(replyLikeType, String(r.id), liked),
        onReplyClick: () => {
          setReplyingToId(id);
          setTargetMap(prev => ({ 
            ...prev, 
            [id]: { 
              replyId: String(r.id), 
              userId: r.user?.id, 
              userName: r.user?.nickname 
            } 
          }));
        },
      })),
    };
  });

  return (

    <DetailSection
       title={
         <div className="flex items-center gap-2">
           <span>{title}</span>
           <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{total}</span>
         </div>
       }
       description={description}
       action={sectionAction}
    >
      <div className="mt-6 flex flex-col gap-6">
         <BilibiliCommentThread 
            comments={bilibiliComments} 
         />
      </div>
      
      {hasMore && (
        <div ref={loadMoreRef} className="py-10 flex justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
                <span className="text-sm">加载更多评价中...</span>
              </div>
            )}
        </div>
      )}
    </DetailSection>
  );
}
