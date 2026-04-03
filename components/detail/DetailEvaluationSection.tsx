"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addLike, removeLike } from "@/api/detail";
import { submitReport } from "@/api/me";
import { formatDateTimeZh } from "@/lib/date";
import { feedback } from "@/store/useFeedbackStore";
import type {
  CourseEvaluation,
  EvaluationReply,
  EvaluationReplyInput,
  PaginatedData,
  TeacherEvaluation,
} from "@/types/detail";
import { DetailSection } from "./DetailScaffold";

type ThreadEvaluation = TeacherEvaluation | CourseEvaluation;
type EvaluationType = "teacher" | "course";
type LikeItemType =
  | "teacher_evaluation"
  | "course_evaluation"
  | "teacher_evaluation_reply"
  | "course_evaluation_reply";

interface ReplyTarget {
  replyId?: string | null;
  userId?: string | null;
  userName?: string | null;
}

interface Dimension {
  key: string;
  label: string;
}

export interface DetailEvaluationSectionProps {
  title: string;
  description: string;
  sectionAction?: ReactNode;
  evaluationType: EvaluationType;
  initialItems: ThreadEvaluation[];
  initialTotal: number;
  initialPage?: number;
  listEvaluations: (page: number, size: number) => Promise<PaginatedData<ThreadEvaluation>>;
  onReply: (evaluationId: string, payload: EvaluationReplyInput) => Promise<EvaluationReply | null>;
}

const TEACHER_DIMENSIONS: Dimension[] = [
  { key: "rating_quality", label: "教学质量" },
  { key: "rating_grading", label: "给分好坏" },
  { key: "rating_attendance", label: "点名情况" },
];

const COURSE_DIMENSIONS: Dimension[] = [
  { key: "rating_homework", label: "作业量" },
  { key: "rating_gain", label: "收获感" },
  { key: "rating_exam_difficulty", label: "考试难度" },
];

const toneMap = {
  teacher: {
    accentText: "text-rose-700",
    accentSoft: "bg-rose-50 text-rose-700 border-rose-100",
    accentStrong: "bg-rose-600 text-white",
    focus: "focus:border-rose-300",
  },
  course: {
    accentText: "text-sky-700",
    accentSoft: "bg-sky-50 text-sky-700 border-sky-100",
    accentStrong: "bg-sky-600 text-white",
    focus: "focus:border-sky-300",
  },
} as const;

function formatDate(value?: string) {
  return formatDateTimeZh(value);
}

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(2);
}

function getDimensions(type: EvaluationType) {
  return type === "teacher" ? TEACHER_DIMENSIONS : COURSE_DIMENSIONS;
}

function getSecondaryDimensions(type: EvaluationType) {
  return type === "teacher" ? COURSE_DIMENSIONS : TEACHER_DIMENSIONS;
}

function isLinkedEvaluation(evaluation: ThreadEvaluation, evaluationType: EvaluationType) {
  if (evaluation.mode === "linked") return true;
  return evaluationType === "teacher"
    ? Boolean((evaluation as TeacherEvaluation).course_id)
    : Boolean((evaluation as CourseEvaluation).teacher_id);
}

function getDimensionValue(evaluation: ThreadEvaluation, key: string) {
  return evaluation[key as keyof ThreadEvaluation] as number | null | undefined;
}

function getDisplayName(item: ThreadEvaluation) {
  if (item.is_anonymous) return "匿名用户";
  return item.user?.nickname || "未知用户";
}

function isReplyLikeType(type: LikeItemType) {
  return type === "teacher_evaluation_reply" || type === "course_evaluation_reply";
}

function ScoreChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
      <span>{label}</span>
      <span className="ml-2 font-semibold text-slate-900">{value}</span>
    </div>
  );
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
  const [likeLoadingKey, setLikeLoadingKey] = useState<string | null>(null);
  const [reportingKey, setReportingKey] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setTotal(initialTotal);
    setPage(initialPage);
  }, [initialItems, initialPage, initialTotal]);

  const primaryDimensions = useMemo(() => getDimensions(evaluationType), [evaluationType]);
  const secondaryDimensions = useMemo(() => getSecondaryDimensions(evaluationType), [evaluationType]);
  const hasMore = items.length < total;
  const tone = toneMap[evaluationType];
  const evaluationLikeType = evaluationType === "teacher" ? "teacher_evaluation" : "course_evaluation";
  const replyLikeType = evaluationType === "teacher" ? "teacher_evaluation_reply" : "course_evaluation_reply";

  const fetchMore = useCallback(async () => {
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
  }, [listEvaluations, page]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || isLoadingMore || !hasMore) {
      return;
    }

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

      if (!reply) {
        return;
      }

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
          if (!isReplyLikeType(itemType) && item.id === id) {
            return {
              ...item,
              is_liked: !currentLiked,
              likes: Math.max(0, (item.likes || 0) + (currentLiked ? -1 : 1)),
            };
          }

          if (isReplyLikeType(itemType) && item.replies) {
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
    key: string,
    targetType: "evaluation" | "comment",
    targetId: string,
    label: string,
  ) => {
    try {
      setReportingKey(key);
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
    } finally {
      setReportingKey(null);
    }
  };

  return (
    <DetailSection title={title} description={description} action={sectionAction}>
      <div className="space-y-5">
        {items.map((item) => {
          const replies = item.replies || [];
          const isLinked = isLinkedEvaluation(item, evaluationType);
          const visibleDimensions = isLinked ? [...primaryDimensions, ...secondaryDimensions] : primaryDimensions;
          const relatedText =
            evaluationType === "teacher"
              ? (item as TeacherEvaluation).course_name
              : (item as CourseEvaluation).teacher_name;
          const activeReplyTarget = targetMap[item.id];

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-b from-white to-slate-50/75 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-400">
                  {item.user?.avatar_url ? (
                    <img src={item.user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{getDisplayName(item).slice(0, 1)}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{getDisplayName(item)}</span>
                        <span className="text-xs text-slate-400">{formatDate(item.created_at)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs ${tone.accentSoft}`}>
                          {isLinked ? "关联评价" : "独立评价"}
                        </span>
                        {relatedText ? (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                            {evaluationType === "teacher" ? `关联课程 ${relatedText}` : `关联教师 ${relatedText}`}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${tone.accentSoft}`}>
                      综合 {formatScore(item.avg_rating)}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {item.comment || "这条评价没有留下文字内容。"}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {visibleDimensions.map((dimension) => (
                      <ScoreChip
                        key={`${item.id}-${dimension.key}`}
                        label={dimension.label}
                        value={formatScore(getDimensionValue(item, dimension.key))}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleLike(
                          evaluationLikeType,
                          item.id,
                          !!item.is_liked,
                        )
                      }
                      disabled={likeLoadingKey === `${evaluationLikeType}-${item.id}`}
                      className={`inline-flex items-center gap-2 transition ${
                        item.is_liked ? tone.accentText : "hover:text-slate-700"
                      }`}
                    >
                      <i className="uil uil-thumbs-up text-base" />
                      <span>赞 {item.likes || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetMap((prev) => ({ ...prev, [item.id]: {} }))}
                      className="inline-flex items-center gap-2 transition hover:text-slate-700"
                    >
                      <i className="uil uil-comment-message text-base" />
                      <span>回复 {item.reply_count || replies.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => reportTarget(`evaluation-${item.id}`, "evaluation", item.id, "评价")}
                      disabled={reportingKey === `evaluation-${item.id}`}
                      className="inline-flex items-center gap-2 transition hover:text-slate-700"
                    >
                      <i className="uil uil-exclamation-circle text-base" />
                      <span>{reportingKey === `evaluation-${item.id}` ? "提交中..." : "举报"}</span>
                    </button>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-700">回复区</div>
                      <div className="text-xs text-slate-400">点击回复继续交流</div>
                    </div>

                    {replies.length > 0 ? (
                      <div className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
                        {replies.map((reply) => {
                          const isTarget = activeReplyTarget?.replyId === reply.id;

                          return (
                            <div
                              key={reply.id}
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                setTargetMap((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    replyId: reply.id,
                                    userId: reply.user?.id || null,
                                    userName: reply.user?.nickname || null,
                                  },
                                }))
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  setTargetMap((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      replyId: reply.id,
                                      userId: reply.user?.id || null,
                                      userName: reply.user?.nickname || null,
                                    },
                                  }));
                                }
                              }}
                              className={`rounded-[22px] border p-4 text-left shadow-sm transition ${
                                isTarget
                                  ? `border-slate-300 ${tone.accentSoft}`
                                  : "border-white bg-slate-50/80 hover:border-slate-200 hover:bg-white"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="text-sm text-slate-700">
                                  <span className="font-medium text-slate-900">{reply.user?.nickname || "未知用户"}</span>
                                  {reply.reply_to_user ? (
                                    <span className="ml-2 text-slate-400">回复 @{reply.reply_to_user.nickname}</span>
                                  ) : null}
                                </div>
                                <div className="text-xs text-slate-400">{formatDate(reply.created_at)}</div>
                              </div>
                              <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                {reply.content}
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleToggleLike(replyLikeType, reply.id, !!reply.is_liked);
                                  }}
                                  disabled={likeLoadingKey === `${replyLikeType}-${reply.id}`}
                                  className={`inline-flex items-center gap-2 transition ${
                                    reply.is_liked ? tone.accentText : "hover:text-slate-600"
                                  }`}
                                >
                                  <i className="uil uil-thumbs-up text-sm" />
                                  <span>{reply.likes || 0}</span>
                                </button>
                                <span>点击继续回复</span>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void reportTarget(`reply-${reply.id}`, "comment", reply.id, "回复");
                                  }}
                                  disabled={reportingKey === `reply-${reply.id}`}
                                  className="transition hover:text-slate-600"
                                >
                                  {reportingKey === `reply-${reply.id}` ? "提交中..." : "举报"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[22px] bg-slate-50 px-4 py-5 text-sm text-slate-400">
                        还没有回复，来留下第一句吧。
                      </div>
                    )}

                    <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/90 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-slate-500">
                          {activeReplyTarget?.userName ? (
                            <span>
                              当前回复 <span className={tone.accentText}>@{activeReplyTarget.userName}</span>
                            </span>
                          ) : (
                            "当前回复主贴"
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTargetMap((prev) => ({ ...prev, [item.id]: {} }))}
                          className="text-sm text-slate-400 transition hover:text-slate-600"
                        >
                          切回回复主贴
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={draftMap[item.id] || ""}
                        onChange={(event) =>
                          setDraftMap((prev) => ({
                            ...prev,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="写下你的回复..."
                        className={`mt-3 w-full resize-none rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition ${tone.focus}`}
                      />
                      <div className="mt-3 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleReplySubmit(item.id)}
                          disabled={submittingId === item.id}
                          className={`rounded-full px-5 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${tone.accentStrong}`}
                        >
                          {submittingId === item.id ? "发送中..." : "发送回复"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {!isLoadingMore && items.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center text-slate-500">
            暂时还没有评价，欢迎发布第一条内容。
          </div>
        ) : null}

        <div ref={loadMoreRef} className="py-4 text-center text-sm text-slate-500">
          {isLoadingMore ? "正在加载更多评价..." : null}
          {!hasMore && items.length > 0 ? "没有更多评价了" : null}
        </div>
      </div>
    </DetailSection>
  );
}
