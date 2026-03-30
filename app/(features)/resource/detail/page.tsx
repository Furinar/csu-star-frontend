"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SectionCard from "@/components/ui/SectionCard";
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
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {comment.user?.nickname ?? "匿名用户"}
          </span>
          {comment.reply_to_user ? (
            <span className="text-xs text-gray-400">回复 @{comment.reply_to_user.nickname}</span>
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
          {pendingLikeId === comment.id ? "处理中..." : `${comment.is_liked ? "已点赞" : "点赞"} ${comment.likes ?? 0}`}
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
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {comment.children.map((child) => (
            <CommentCard
              key={child.id}
              comment={child}
              rootId={rootId}
              onReply={onReply}
              onToggleLike={onToggleLike}
              onReport={onReport}
              pendingLikeId={pendingLikeId}
              pendingReportId={pendingReportId}
            />
          ))}
        </div>
      ) : null}
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
      <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-gradient-to-br from-white via-[var(--star-50)] to-[var(--ice-50)] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--first-color)]/10 blur-3xl"></div>
        <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl"></div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-[var(--first-color)] shadow-sm">
              <i className="uil uil-file-alt"></i>
              资源详情
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-gray-900">{detail.title}</h1>
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
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                {detail.description || "暂无资源说明，当前页面聚焦附件信息、课程关联和评论区。"}
              </p>
            </div>
          </div>
          <div className="grid min-w-full grid-cols-2 gap-3 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-sm lg:min-w-[420px]">
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">下载次数</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{detail.downloads ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">浏览次数</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{detail.views ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">文件大小</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{formatBytes(detail.size_bytes)}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">点赞数</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{detail.likes ?? 0}</div>
            </div>
          </div>
        </div>
      </section>

      <SectionCard
        title="课程关联"
        subtitle="资源不会单独承担搜索入口，所有资料都归属于课程资源合集与课程评价体系。"
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href={buildCoursePath(courseId)}
              className="rounded-full border border-[var(--first-color)]/20 bg-white px-4 py-2 text-sm font-medium text-[var(--first-color)] transition hover:bg-[var(--first-color)]/5"
            >
              进入课程详情
            </Link>
            <Link
              href={buildResourceCollectionPath(courseId)}
              className="rounded-full bg-[var(--first-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              查看资源合集
            </Link>
            <Link
              href={buildCourseEvaluationAnchor(courseId)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-[var(--first-color)]/20 hover:text-[var(--first-color)]"
            >
              跳转课程评价区
            </Link>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5">
            <div className="text-sm text-gray-400">{"课程信息"}</div>
            <div className="mt-2 text-xl font-semibold text-gray-900">
              {detail.course?.name || `课程 ${courseId}`}
            </div>
            <div className="mt-3 text-sm text-gray-500">
              资源类型：{detail.resource_type || "未分类"} · 上传时间：{formatDateTime(detail.created_at)}
            </div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5">
            <div className="text-sm text-gray-400">附件列表</div>
            <div className="mt-3 space-y-2">
              {(detail.files ?? []).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm"
                >
                  <span className="truncate text-gray-700">{file.filename}</span>
                  <span className="text-gray-400">{formatBytes(file.size_bytes)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="资源评论" subtitle="资源只支持评论；一级评论下的二级评论可以互相回复，但展示时保持平级。">
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-[var(--first-color)]/20 bg-white p-4">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
              placeholder="写下你的评论..."
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[var(--first-color)] focus:bg-white"
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
            <div className="rounded-2xl border border-[var(--first-color)]/20 bg-white p-4">
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
                className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[var(--first-color)] focus:bg-white"
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
                        reply_to_comment_id: replyTarget.commentId && replyTarget.commentId !== replyTarget.rootId
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
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              暂无评论内容。
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
