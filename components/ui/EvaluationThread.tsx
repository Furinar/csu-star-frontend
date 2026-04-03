"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addLike,
  removeLike,
} from "@/api/detail";
import { submitReport } from "@/api/me";
import { formatDateTimeZh } from "@/lib/date";
import { feedback } from "@/store/useFeedbackStore";
import type {
  CourseEvaluation,
  EvaluationReply,
  EvaluationReplyInput,
  TeacherEvaluation,
} from "@/types/detail";

type ThreadEvaluation = TeacherEvaluation | CourseEvaluation;
type EvaluationType = "teacher" | "course";
type ReportItemType =
  | "teacher_evaluation"
  | "course_evaluation"
  | "teacher_evaluation_reply"
  | "course_evaluation_reply";

interface RelatedItem {
  id: number;
  name: string;
}

interface EvaluationThreadProps {
  title: string;
  description: string;
  evaluations: ThreadEvaluation[];
  onReply: (evaluationId: string, payload: EvaluationReplyInput) => Promise<EvaluationReply | undefined>;
  evaluationType?: EvaluationType;
  relatedItems?: RelatedItem[];
  onCreateEvaluation?: (payload: Record<string, unknown>) => Promise<ThreadEvaluation | undefined>;
}

interface ReplyTarget {
  replyId?: string | null;
  userId?: string | null;
  userName?: string | null;
}

interface RatingDimension {
  key: string;
  label: string;
}

const TEACHER_DIMENSIONS: RatingDimension[] = [
  { key: "rating_quality", label: "教学质量" },
  { key: "rating_grading", label: "给分宽松" },
  { key: "rating_attendance", label: "考勤要求" },
];

const COURSE_DIMENSIONS: RatingDimension[] = [
  { key: "rating_homework", label: "作业量" },
  { key: "rating_gain", label: "收获感" },
  { key: "rating_exam_difficulty", label: "考试难度" },
];

function formatDateTime(value?: string) {
  return formatDateTimeZh(value);
}

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(2);
}

function getPrimaryDimensions(type: EvaluationType) {
  return type === "course" ? COURSE_DIMENSIONS : TEACHER_DIMENSIONS;
}

function getRelatedDimensions(type: EvaluationType) {
  return type === "course" ? TEACHER_DIMENSIONS : COURSE_DIMENSIONS;
}

function getRelatedLabel(type: EvaluationType) {
  return type === "teacher" ? "关联课程" : "关联教师";
}

function isLinkedEvaluation(evaluation: ThreadEvaluation) {
  return evaluation.mode === "linked" || Boolean(("course_id" in evaluation ? evaluation.course_id : evaluation.teacher_id));
}

function getDimensionValue(evaluation: ThreadEvaluation, key: string) {
  return evaluation[key as keyof ThreadEvaluation] as number | null | undefined;
}

function RatingInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-lg transition ${star <= value ? "text-amber-400" : "text-gray-300"} hover:text-amber-400`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-400">{value}/5</span>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600">
      <span className="mr-2 text-gray-400">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function EvaluationThread({
  title,
  description,
  evaluations,
  onReply,
  evaluationType = "teacher",
  relatedItems,
  onCreateEvaluation,
}: EvaluationThreadProps) {
  const [items, setItems] = useState<ThreadEvaluation[]>(evaluations);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [draftMap, setDraftMap] = useState<Record<string, string>>({});
  const [targetMap, setTargetMap] = useState<Record<string, ReplyTarget>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [likeLoadingKey, setLikeLoadingKey] = useState<string | null>(null);
  const [reportingKey, setReportingKey] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createRatings, setCreateRatings] = useState<Record<string, number>>({});
  const [createComment, setCreateComment] = useState("");
  const [createRelatedId, setCreateRelatedId] = useState<number | null>(null);
  const [createAnonymous, setCreateAnonymous] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setItems(evaluations);
  }, [evaluations]);

  const hasItems = useMemo(() => items.length > 0, [items]);
  const primaryDimensions = getPrimaryDimensions(evaluationType);
  const relatedDimensions = getRelatedDimensions(evaluationType);
  const currentCreateDimensions = createRelatedId ? [...primaryDimensions, ...relatedDimensions] : primaryDimensions;
  const evaluationLikeType = evaluationType === "teacher" ? "teacher_evaluation" : "course_evaluation";
  const replyLikeType = evaluationType === "teacher" ? "teacher_evaluation_reply" : "course_evaluation_reply";
  const evaluationReportType: ReportItemType =
    evaluationType === "teacher" ? "teacher_evaluation" : "course_evaluation";
  const replyReportType: ReportItemType =
    evaluationType === "teacher" ? "teacher_evaluation_reply" : "course_evaluation_reply";

  const toggleExpanded = (evaluationId: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [evaluationId]: !prev[evaluationId],
    }));
  };

  const updateEvaluationLike = async (evaluationId: string, targetType: "teacher_evaluation" | "course_evaluation") => {
    const evaluation = items.find((item) => item.id === evaluationId);
    if (!evaluation) return;

    const loadingKey = `evaluation-${evaluationId}`;
    setLikeLoadingKey(loadingKey);

    try {
      if (evaluation.is_liked) {
        await removeLike(targetType, evaluationId);
      } else {
        await addLike(targetType, evaluationId);
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === evaluationId
            ? {
              ...item,
              is_liked: !item.is_liked,
              likes: Math.max(0, (item.likes ?? 0) + (item.is_liked ? -1 : 1)),
            }
            : item,
        ),
      );
    } catch (error) {
      console.error(error);
      feedback.error({
        title: "点赞失败",
        description: "请稍后重试。",
      });
    } finally {
      setLikeLoadingKey(null);
    }
  };

  const updateReplyLike = async (evaluationId: string, replyId: string) => {
    const evaluation = items.find((item) => item.id === evaluationId);
    const reply = evaluation?.replies?.find((item) => item.id === replyId);
    if (!reply) return;

    const loadingKey = `reply-${replyId}`;
    setLikeLoadingKey(loadingKey);

    try {
      if (reply.is_liked) {
        await removeLike(replyLikeType, replyId);
      } else {
        await addLike(replyLikeType, replyId);
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== evaluationId) return item;

          return {
            ...item,
            replies: (item.replies ?? []).map((entry) =>
              entry.id === replyId
                ? {
                  ...entry,
                  is_liked: !entry.is_liked,
                  likes: Math.max(0, (entry.likes ?? 0) + (entry.is_liked ? -1 : 1)),
                }
                : entry,
            ),
          };
        }),
      );
    } catch (error) {
      console.error(error);
      feedback.error({
        title: "点赞失败",
        description: "请稍后重试。",
      });
    } finally {
      setLikeLoadingKey(null);
    }
  };

  const reportTarget = async (
      key: string,
      target_type: ReportItemType,
      target_id: string,
      label: string,
  ) => {
    setReportingKey(key);

    try {
      await submitReport({
        target_type,
        target_id: String(target_id),
        reason: "other",
        description: `${label}内容举报`,
      });
      feedback.success({
        title: "举报已提交",
        description: "感谢反馈，管理员会尽快处理。",
      });
    } catch (error) {
      console.error(error);
      feedback.error({
        title: "举报失败",
        description: "请稍后重试。",
      });
    } finally {
      setReportingKey(null);
    }
  };

  const handleSubmit = async (evaluationId: string) => {
    const content = draftMap[evaluationId]?.trim();
    if (!content) return;

    const target = targetMap[evaluationId] ?? {};
    setSubmittingId(evaluationId);

    try {
      const reply = await onReply(evaluationId, {
        content,
        reply_to_reply_id: target.replyId != null ? String(target.replyId) : null,
        reply_to_user_id: target.userId != null ? String(target.userId) : null,
      });

      if (!reply) return;

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== evaluationId) return item;

          return {
            ...item,
            reply_count: (item.reply_count ?? item.replies?.length ?? 0) + 1,
            replies: [...(item.replies ?? []), reply],
          };
        }),
      );
      setExpandedMap((prev) => ({ ...prev, [evaluationId]: true }));
      setDraftMap((prev) => ({ ...prev, [evaluationId]: "" }));
      setTargetMap((prev) => ({ ...prev, [evaluationId]: {} }));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCreateEvaluation = async () => {
    if (!onCreateEvaluation) return;

    const allRated = currentCreateDimensions.every((d) => (createRatings[d.key] ?? 0) > 0);
    if (!allRated) return;

    setIsCreating(true);
    try {
      const payload: Record<string, unknown> = {
        ...createRatings,
        comment: createComment.trim() || undefined,
        is_anonymous: createAnonymous,
      };

      if (evaluationType === "teacher" && createRelatedId) {
        payload.course_id = createRelatedId;
      } else if (evaluationType === "course" && createRelatedId) {
        payload.teacher_id = createRelatedId;
      }

      const result = await onCreateEvaluation(payload);
      if (result) {
        setItems((prev) => [result, ...prev]);
        setShowCreateForm(false);
        setCreateRatings({});
        setCreateComment("");
        setCreateRelatedId(null);
        setCreateAnonymous(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/50 bg-white/85 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        {onCreateEvaluation ? (
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="rounded-full bg-[var(--first-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            {showCreateForm ? "取消" : "发表评价"}
          </button>
        ) : null}
      </div>

      {showCreateForm && onCreateEvaluation ? (
        <div className="mt-5 rounded-3xl border border-[var(--first-color)]/20 bg-gradient-to-br from-white to-gray-50 p-5">
          <h3 className="text-lg font-semibold text-gray-900">发表新评价</h3>
          <div className="mt-4 space-y-3">
            {primaryDimensions.map((dim) => (
              <RatingInput
                key={dim.key}
                label={dim.label}
                value={createRatings[dim.key] ?? 0}
                onChange={(v) => setCreateRatings((prev) => ({ ...prev, [dim.key]: v }))}
              />
            ))}
          </div>

          {relatedItems && relatedItems.length > 0 ? (
            <div className="mt-4">
              <label className="text-sm text-gray-600">{getRelatedLabel(evaluationType)}（可选）</label>
              <select
                value={createRelatedId ?? ""}
                onChange={(e) => setCreateRelatedId(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-12 text-sm text-gray-800 outline-none transition focus:border-[var(--first-color)]"
                style={{
                  backgroundImage:
                    'url(\'data:image/svg+xml;utf8,<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 6.75L9 11.25L13.5 6.75" fill="none" stroke="%236b7280" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>\')',
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1rem 1rem",
                }}
              >
                <option value="">不关联</option>
                {relatedItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {createRelatedId ? (
            <div className="mt-4 rounded-2xl border border-[var(--first-color)]/15 bg-white p-4">
              <div className="mb-3 text-sm font-medium text-gray-700">已开启关联评价，需要补充另外 3 个维度</div>
              <div className="space-y-3">
                {relatedDimensions.map((dim) => (
                  <RatingInput
                    key={dim.key}
                    label={dim.label}
                    value={createRatings[dim.key] ?? 0}
                    onChange={(v) => setCreateRatings((prev) => ({ ...prev, [dim.key]: v }))}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <textarea
            value={createComment}
            onChange={(e) => setCreateComment(e.target.value)}
            rows={4}
            placeholder="写下你的评价内容（可选）..."
            className="mt-4 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[var(--first-color)] focus:bg-white"
          />

          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={createAnonymous}
                onChange={(e) => setCreateAnonymous(e.target.checked)}
                className="rounded"
              />
              匿名发表
            </label>
            <button
              type="button"
              onClick={handleCreateEvaluation}
              disabled={isCreating || !currentCreateDimensions.every((d) => (createRatings[d.key] ?? 0) > 0)}
              className="rounded-full bg-[var(--first-color)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "提交中..." : "提交评价"}
            </button>
          </div>
        </div>
      ) : null}

      {!hasItems && !showCreateForm ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center text-gray-500">
          <div className="text-5xl text-gray-300">
            <i className="uil uil-comment-alt-lines"></i>
          </div>
          <div>还没有内容，等第一条评价出现。</div>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {items.map((evaluation) => {
            const replies = evaluation.replies ?? [];
            const expanded = expandedMap[evaluation.id] ?? replies.length <= 2;
            const target = targetMap[evaluation.id];
            const linked = isLinkedEvaluation(evaluation);
            const visibleDimensions = linked ? [...primaryDimensions, ...relatedDimensions] : primaryDimensions;

            return (
              <article
                key={evaluation.id}
                className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--first-color)]/10 px-3 py-1 text-xs font-semibold text-[var(--first-color)]">
                        {evaluation.user?.nickname ?? "匿名用户"}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        {linked ? "关联评价" : "单独评价"}
                      </span>
                      {linked ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                          {evaluationType === "teacher"
                            ? `关联课程 ${(evaluation as TeacherEvaluation).course_name ?? (evaluation as TeacherEvaluation).course_id ?? ""}`
                            : `关联教师 ${(evaluation as CourseEvaluation).teacher_name ?? (evaluation as CourseEvaluation).teacher_id ?? ""}`}
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-400">{formatDateTime(evaluation.created_at)}</span>
                    </div>
                    <p className="text-sm leading-7 text-gray-700">
                      {evaluation.comment || "该评价未填写文字内容。"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <StatPill label="综合评分" value={formatScore(evaluation.avg_rating)} />
                      {visibleDimensions.map((dimension) => (
                        <StatPill
                          key={`${evaluation.id}-${dimension.key}`}
                          label={dimension.label}
                          value={formatScore(getDimensionValue(evaluation, dimension.key))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid min-w-44 grid-cols-2 gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">点赞数</div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {evaluation.likes ?? 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">回复数</div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {evaluation.reply_count ?? replies.length}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateEvaluationLike(evaluation.id, evaluationLikeType)}
                    disabled={likeLoadingKey === `evaluation-${evaluation.id}`}
                    className={`rounded-full px-3 py-1.5 text-xs transition ${
                      evaluation.is_liked
                        ? "bg-[var(--first-color)] text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-[var(--first-color)]/30 hover:text-[var(--first-color)]"
                    }`}
                  >
                    {likeLoadingKey === `evaluation-${evaluation.id}` ? "处理中..." : evaluation.is_liked ? "已点赞" : "点赞"}
                  </button>
                  <button
                    type="button"
                    onClick={() => reportTarget(`evaluation-${evaluation.id}`, evaluationReportType, evaluation.id, "评价")}
                    disabled={reportingKey === `evaluation-${evaluation.id}`}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-rose-200 hover:text-rose-600"
                  >
                    {reportingKey === `evaluation-${evaluation.id}` ? "提交中..." : "举报"}
                  </button>
                </div>

                <div className="mt-4 rounded-2xl bg-gray-50/80 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">
                      回复 {evaluation.reply_count ?? replies.length}
                    </div>
                    {replies.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(evaluation.id)}
                        className="text-sm text-[var(--first-color)] transition hover:opacity-80"
                      >
                        {expanded ? "收起回复" : "展开回复"}
                      </button>
                    ) : null}
                  </div>

                  {expanded && replies.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="rounded-2xl border border-gray-100 bg-white px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-medium text-gray-800">
                                {reply.user.nickname}
                              </span>
                              {reply.reply_to_user ? (
                                <span className="text-gray-400">
                                  回复 @{reply.reply_to_user.nickname}
                                </span>
                              ) : null}
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDateTime(reply.created_at)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-gray-600">{reply.content}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setTargetMap((prev) => ({
                                  ...prev,
                                  [evaluation.id]: {
                                    replyId: reply.id,
                                    userId: reply.user.id,
                                    userName: reply.user.nickname,
                                  },
                                }))
                              }
                              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-[var(--first-color)]/30 hover:text-[var(--first-color)]"
                            >
                              回复这条
                            </button>
                            <button
                              type="button"
                              onClick={() => updateReplyLike(evaluation.id, reply.id)}
                              disabled={likeLoadingKey === `reply-${reply.id}`}
                              className={`rounded-full px-3 py-1.5 text-xs transition ${
                                reply.is_liked
                                  ? "bg-[var(--first-color)] text-white"
                                  : "border border-gray-200 bg-white text-gray-600 hover:border-[var(--first-color)]/30 hover:text-[var(--first-color)]"
                              }`}
                            >
                              {likeLoadingKey === `reply-${reply.id}` ? "处理中..." : `${reply.is_liked ? "已点赞" : "点赞"} ${reply.likes ?? 0}`}
                            </button>
                            <button
                              type="button"
                              onClick={() => reportTarget(`reply-${reply.id}`, replyReportType, reply.id, "回复")}
                              disabled={reportingKey === `reply-${reply.id}`}
                              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-rose-200 hover:text-rose-600"
                            >
                              {reportingKey === `reply-${reply.id}` ? "提交中..." : "举报"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--first-color)]/20 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-gray-700">
                        {target?.userName ? `回复 @${target.userName}` : "回复该评价"}
                      </div>
                      {target?.userName ? (
                        <button
                          type="button"
                          onClick={() =>
                            setTargetMap((prev) => ({
                              ...prev,
                              [evaluation.id]: {},
                            }))
                          }
                          className="text-xs text-gray-400 transition hover:text-gray-600"
                        >
                          取消目标
                        </button>
                      ) : null}
                    </div>
                    <textarea
                      value={draftMap[evaluation.id] ?? ""}
                      onChange={(event) =>
                        setDraftMap((prev) => ({
                          ...prev,
                          [evaluation.id]: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="写下你的回复，支持回复某条二级回复，但显示时仍保持平级。"
                      className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[var(--first-color)] focus:bg-white"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSubmit(evaluation.id)}
                        disabled={submittingId === evaluation.id}
                        className="rounded-full bg-[var(--first-color)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingId === evaluation.id ? "提交中..." : "发送回复"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
