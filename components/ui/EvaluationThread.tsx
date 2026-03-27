"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CourseEvaluation,
  EvaluationReply,
  EvaluationReplyInput,
  TeacherEvaluation,
} from "@/types/detail";

type ThreadEvaluation = TeacherEvaluation | CourseEvaluation;

interface EvaluationThreadProps {
  title: string;
  description: string;
  evaluations: ThreadEvaluation[];
  onReply: (evaluationId: number, payload: EvaluationReplyInput) => Promise<EvaluationReply | undefined>;
}

interface ReplyTarget {
  replyId?: number | null;
  userId?: string | null;
  userName?: string | null;
}

function formatDateTime(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

export default function EvaluationThread({
  title,
  description,
  evaluations,
  onReply,
}: EvaluationThreadProps) {
  const [items, setItems] = useState<ThreadEvaluation[]>(evaluations);
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [draftMap, setDraftMap] = useState<Record<number, string>>({});
  const [targetMap, setTargetMap] = useState<Record<number, ReplyTarget>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  useEffect(() => {
    setItems(evaluations);
  }, [evaluations]);

  const hasItems = useMemo(() => items.length > 0, [items]);

  const toggleExpanded = (evaluationId: number) => {
    setExpandedMap((prev) => ({
      ...prev,
      [evaluationId]: !prev[evaluationId],
    }));
  };

  const handleSubmit = async (evaluationId: number) => {
    const content = draftMap[evaluationId]?.trim();
    if (!content) return;

    const target = targetMap[evaluationId] ?? {};
    setSubmittingId(evaluationId);

    try {
      const reply = await onReply(evaluationId, {
        content,
        reply_to_reply_id: target.replyId ?? null,
        reply_to_user_id: target.userId ?? null,
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

  return (
    <div className="rounded-[28px] border border-white/50 bg-white/85 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      {!hasItems ? (
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

            return (
              <article
                key={evaluation.id}
                className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--first-color)]/10 px-3 py-1 text-xs font-semibold text-[var(--first-color)]">
                        {evaluation.user?.nickname ?? "匿名用户"}
                      </span>
                      <span className="text-xs text-gray-400">{formatDateTime(evaluation.created_at)}</span>
                    </div>
                    <p className="text-sm leading-7 text-gray-700">
                      {evaluation.comment || "该评价未填写文字内容。"}
                    </p>
                  </div>
                  <div className="grid min-w-44 grid-cols-2 gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">综合评分</div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {formatScore(evaluation.avg_rating)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">点赞数</div>
                      <div className="mt-1 font-semibold text-gray-900">
                        {evaluation.likes ?? 0}
                      </div>
                    </div>
                  </div>
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
                            className="mt-2 text-xs font-medium text-[var(--first-color)] transition hover:opacity-80"
                          >
                            回复这条
                          </button>
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
