"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CollectButton from "@/components/ui/CollectButton";
import {
  addFavorite,
  addLike,
  createResourceComment,
  createResourceCommentReply,
  getResourceDetail,
  listResourceComments,
  removeFavorite,
  removeLike,
} from "@/api/detail";
import { submitReport } from "@/api/me";
import { feedback } from "@/store/useFeedbackStore";
import type { ResourceComment, ResourceDetail } from "@/types/detail";
import {
  buildCourseEvaluationAnchor,
  buildCoursePath,
  buildResourceCollectionPath,
} from "@/lib/paths";

function formatBytes(value?: number | null) {
  if (typeof value !== "number" || value <= 0) return "--";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

interface ReplyTarget {
  rootId: number;
  commentId?: number | null;
  userId?: string | null;
  userName?: string | null;
}

function appendReplyToTree(
  comments: ResourceComment[],
  rootId: number,
  reply: ResourceComment,
) {
  return comments.map((comment) => {
    if (comment.id !== rootId) return comment;

    return {
      ...comment,
      children: [...(comment.children ?? []), reply],
    };
  });
}

function updateCommentInTree(
  comments: ResourceComment[],
  targetId: number,
  updater: (comment: ResourceComment) => ResourceComment,
): ResourceComment[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return updater(comment);
    }

    if (!comment.children?.length) {
      return comment;
    }

    return {
      ...comment,
      children: updateCommentInTree(comment.children, targetId, updater),
    };
  });
}

function CommentCard({
  comment,
  rootId,
  onReply,
  onToggleLike,
  onReport,
  pendingLikeId,
  pendingReportId,
}: {
  comment: ResourceComment;
  rootId: number;
  onReply: (target: ReplyTarget) => void;
  onToggleLike: (comment: ResourceComment) => void;
  onReport: (comment: ResourceComment) => void;
  pendingLikeId: number | null;
  pendingReportId: number | null;
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/92 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-gray-700">
            {comment.user?.nickname ?? "匿名用户"}
          </span>
          {comment.reply_to_user ? (
            <span className="text-xs text-gray-400">
              回复 @{comment.reply_to_user.nickname}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-gray-400">{formatDateTime(comment.created_at)}</span>
      </div>

      <p className="mt-3 text-sm leading-7 text-gray-600">{comment.content}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onReply({
              rootId,
              commentId: comment.id,
              userId: comment.user?.id ?? null,
              userName: comment.user?.nickname ?? null,
            })
          }
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-[var(--first-color)]/30 hover:text-[var(--first-color)]"
        >
          回复
        </button>
        <button
          type="button"
          onClick={() => onToggleLike(comment)}
          disabled={pendingLikeId === comment.id}
          className={`rounded-full px-3 py-1.5 text-xs transition ${
            comment.is_liked
              ? "bg-[var(--first-color)] text-white"
              : "border border-gray-200 bg-white text-gray-600 hover:border-[var(--first-color)]/30 hover:text-[var(--first-color)]"
          }`}
        >
          {pendingLikeId === comment.id
            ? "处理中..."
            : `${comment.is_liked ? "已点赞" : "点赞"} ${comment.likes ?? 0}`}
        </button>
        <button
          type="button"
          onClick={() => onReport(comment)}
          disabled={pendingReportId === comment.id}
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-rose-200 hover:text-rose-600"
        >
          {pendingReportId === comment.id ? "提交中..." : "举报"}
        </button>
      </div>

      {comment.children?.length ? (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {comment.children.map((child) => (
            <div
              key={child.id}
              onClick={() =>
                onReply({
                  rootId,
                  commentId: child.id,
                  userId: child.user?.id ?? null,
                  userName: child.user?.nickname ?? null,
                })
              }
              className="cursor-pointer rounded-[20px] border border-gray-100 bg-slate-50/80 p-4 transition hover:border-[var(--first-color)]/20 hover:bg-[var(--first-color)]/3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    {child.user?.nickname ?? "匿名用户"}
                  </span>
                  {child.reply_to_user ? (
                    <span className="text-xs text-gray-400">
                      回复 @{child.reply_to_user.nickname}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-gray-400">
                  {formatDateTime(child.created_at)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-7 text-gray-600">{child.content}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleLike(child);
                  }}
                  disabled={pendingLikeId === child.id}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    child.is_liked
                      ? "bg-[var(--first-color)] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-[var(--first-color)]/30 hover:text-[var(--first-color)]"
                  }`}
                >
                  {pendingLikeId === child.id
                    ? "处理中..."
                    : `${child.is_liked ? "已点赞" : "点赞"} ${child.likes ?? 0}`}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReport(child);
                  }}
                  disabled={pendingReportId === child.id}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-rose-200 hover:text-rose-600"
                >
                  {pendingReportId === child.id ? "提交中..." : "举报"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FileBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm text-gray-500 shadow-sm">
      {label}
      <span className="ml-2 font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function ResourceDetailPage() {
  const searchParams = useSearchParams();
  const resourceId = Number(searchParams.get("id"));
  const isInvalidResourceId = !Number.isFinite(resourceId);
  const [detail, setDetail] = useState<ResourceDetail | null>(null);
  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [pendingLikeId, setPendingLikeId] = useState<number | null>(null);
  const [pendingReportId, setPendingReportId] = useState<number | null>(null);

  useEffect(() => {
    if (isInvalidResourceId) return;

    let active = true;

    Promise.all([getResourceDetail(resourceId), listResourceComments(resourceId, 1, 20)])
      .then(([resource, commentData]) => {
        if (!active) return;
        setDetail(resource);
        setIsFavorited(Boolean(resource.is_favorited));
        setComments(commentData.items);
      })
      .catch((err) => {
        console.error(err);
        if (!active) return;
        setError("资源详情加载失败，请稍后重试。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isInvalidResourceId, resourceId]);

  const toggleCommentLike = async (comment: ResourceComment) => {
    setPendingLikeId(comment.id);

    try {
      if (comment.is_liked) {
        await removeLike("comment", comment.id);
      } else {
        await addLike("comment", comment.id);
      }

      setComments((prev) =>
        updateCommentInTree(prev, comment.id, (current) => ({
          ...current,
          is_liked: !current.is_liked,
          likes: Math.max(0, (current.likes ?? 0) + (current.is_liked ? -1 : 1)),
        })),
      );
    } catch (err) {
      console.error(err);
      feedback.error({
        title: "点赞失败",
        description: "请稍后重试。",
      });
    } finally {
      setPendingLikeId(null);
    }
  };

  const reportComment = async (comment: ResourceComment) => {
    setPendingReportId(comment.id);

    try {
      await submitReport({
        target_type: "comment",
        target_id: String(comment.id),
        reason: "other",
        description: "资源评论举报",
      });
      feedback.success({
        title: "举报已提交",
        description: "感谢反馈，管理员会尽快处理。",
      });
    } catch (err) {
      console.error(err);
      feedback.error({
        title: "举报失败",
        description: "请稍后重试。",
      });
    } finally {
      setPendingReportId(null);
    }
  };

  if (isInvalidResourceId) {
    return (
      <div className="container mt-10 mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          资源 ID 无效。
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-10 mb-20 flex min-h-[60vh] items-center justify-center text-gray-500">
        资源详情加载中...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container mt-10 mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          {error || "资源不存在。"}
        </div>
      </div>
    );
  }

  const courseId = detail.course?.id ?? detail.course_id;

  return (
    <div className="container mt-10 mb-20 space-y-8">
      <section className="relative overflow-hidden rounded-[40px] border border-white/60 bg-[linear-gradient(140deg,rgba(255,255,255,0.94)_0%,rgba(250,248,240,0.92)_48%,rgba(239,247,255,0.9)_100%)] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-9">
        <div className="absolute -right-10 top-2 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl animate-blob"></div>
        <div className="absolute -left-6 bottom-0 h-48 w-48 rounded-full bg-sky-200/28 blur-3xl animate-blob animation-delay-2000"></div>

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-4 py-2 text-sm font-medium text-[var(--first-color)] shadow-sm">
              <i className="uil uil-file-alt"></i>
              资源详情
            </div>

            <div className="mt-5 flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
                    {detail.title}
                  </h1>
                  <CollectButton
                    isCollected={isFavorited}
                    onClick={async () => {
                      try {
                        if (isFavorited) {
                          await removeFavorite("resource", detail.id);
                        } else {
                          await addFavorite("resource", detail.id);
                        }
                        setIsFavorited(!isFavorited);
                      } catch {
                        // ignore
                      }
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.resource_type ? (
                    <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                      {detail.resource_type}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                    所属课程 {detail.course?.name || `#${courseId}`}
                  </span>
                </div>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-600 md:text-base">
                  {detail.description || "当前页面聚焦展示资源文件、关联课程入口与评论互动。"}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <FileBadge label="下载" value={`${detail.downloads ?? 0}`} />
                  <FileBadge label="浏览" value={`${detail.views ?? 0}`} />
                  <FileBadge label="点赞" value={`${detail.likes ?? 0}`} />
                  <FileBadge label="大小" value={formatBytes(detail.size_bytes)} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/82 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.07)] backdrop-blur-md">
            <div className="text-sm text-gray-400">资源操作</div>
            <div className="mt-4 space-y-3">
              <Link
                href={buildResourceCollectionPath(courseId)}
                className="flex w-full items-center justify-center rounded-full bg-[var(--first-color)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                查看资源合集
              </Link>
              <Link
                href={buildCoursePath(courseId)}
                className="flex w-full items-center justify-center rounded-full border border-[var(--first-color)]/20 bg-white px-4 py-3 text-sm font-medium text-[var(--first-color)] transition hover:bg-[var(--first-color)]/5"
              >
                进入课程详情
              </Link>
              <Link
                href={buildCourseEvaluationAnchor(courseId)}
                className="flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-[var(--first-color)]/20 hover:text-[var(--first-color)]"
              >
                跳转课程评价
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8">
        <div>
          <div className="inline-flex rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-[var(--first-color)] shadow-sm">
            文件列表
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900">资源文件</h2>
          <p className="mt-1 text-sm text-gray-500">
            当前资源以文件为主展示，评论和讨论会在下方继续展开。
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3">
            {(detail.files ?? []).length > 0 ? (
              (detail.files ?? []).map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-[24px] border border-white/70 bg-white/92 px-5 py-4 shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-[0.24em] text-gray-400">
                      File {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-1 truncate text-sm font-medium text-gray-900">
                      {file.filename}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{formatBytes(file.size_bytes)}</div>
                    <div className="text-xs text-gray-400">{file.mime || "未知格式"}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-gray-200 bg-slate-50 p-6 text-center text-sm text-gray-500">
                暂无文件信息。
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
            <div className="text-sm text-gray-400">关联课程</div>
            <div className="mt-2 text-xl font-semibold text-gray-900">
              {detail.course?.name || `课程 ${courseId}`}
            </div>
            <div className="mt-3 text-sm leading-6 text-gray-500">
              上传时间：{formatDateTime(detail.created_at)}
            </div>
            {detail.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8">
        <div>
          <div className="inline-flex rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-[var(--first-color)] shadow-sm">
            资源评论
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900">围绕资源的讨论</h2>
          <p className="mt-1 text-sm text-gray-500">
            评论只在资源详情页展示。点击一级评论的回复按钮，或直接点击二级评论，都可以继续回复。
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-[24px] border border-dashed border-[var(--first-color)]/20 bg-white p-4">
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              rows={3}
              placeholder="写下你的评论..."
              className="w-full resize-none rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[var(--first-color)] focus:bg-white"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={isSubmittingComment || !commentDraft.trim()}
                onClick={async () => {
                  const content = commentDraft.trim();
                  if (!content) return;
                  setIsSubmittingComment(true);
                  try {
                    const newComment = await createResourceComment(resourceId, { content });
                    if (newComment) {
                      setComments((prev) => [newComment, ...prev]);
                      setCommentDraft("");
                    }
                  } finally {
                    setIsSubmittingComment(false);
                  }
                }}
                className="rounded-full bg-[var(--first-color)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingComment ? "提交中..." : "发表评论"}
              </button>
            </div>
          </div>

          {replyTarget ? (
            <div className="rounded-[24px] border border-[var(--first-color)]/20 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-gray-700">
                  {replyTarget.userName ? `回复 @${replyTarget.userName}` : "回复该评论"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTarget(null);
                    setReplyDraft("");
                  }}
                  className="text-xs text-gray-400 transition hover:text-gray-600"
                >
                  取消目标
                </button>
              </div>
              <textarea
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                rows={3}
                placeholder="写下你的回复..."
                className="w-full resize-none rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[var(--first-color)] focus:bg-white"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={isSubmittingReply || !replyDraft.trim()}
                  onClick={async () => {
                    if (!replyTarget) return;
                    const content = replyDraft.trim();
                    if (!content) return;

                    setIsSubmittingReply(true);
                    try {
                      const reply = await createResourceCommentReply(replyTarget.rootId, {
                        content,
                        reply_to_comment_id:
                          replyTarget.commentId &&
                          replyTarget.commentId !== replyTarget.rootId
                            ? replyTarget.commentId
                            : null,
                        reply_to_user_id: replyTarget.userId ?? null,
                      });

                      if (reply) {
                        setComments((prev) => appendReplyToTree(prev, replyTarget.rootId, reply));
                        setReplyTarget(null);
                        setReplyDraft("");
                      }
                    } finally {
                      setIsSubmittingReply(false);
                    }
                  }}
                  className="rounded-full bg-[var(--first-color)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingReply ? "提交中..." : "发送回复"}
                </button>
              </div>
            </div>
          ) : null}

          {comments.length ? (
            comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                rootId={comment.id}
                onReply={setReplyTarget}
                onToggleLike={toggleCommentLike}
                onReport={reportComment}
                pendingLikeId={pendingLikeId}
                pendingReportId={pendingReportId}
              />
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-gray-200 bg-slate-50 p-6 text-center text-sm text-gray-500">
              暂无评论内容。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
