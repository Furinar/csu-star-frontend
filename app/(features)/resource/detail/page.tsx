"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addLike,
  createResourceComment,
  createResourceCommentReply,
  getResourceDetail,
  listResourceComments,
  removeLike,
} from "@/api/detail";
import type { ResourceComment, ResourceDetail } from "@/types/detail";
import { feedback } from "@/store/useFeedbackStore";
import CommentComposerForm from "@/components/detail/CommentComposerForm";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import CollectButton from "@/components/ui/CollectButton";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import {
  DetailHero,
  DetailPageShell,
  DetailRibbonTag,
  DetailSection,
  EntityPillLink,
} from "@/components/detail/DetailScaffold";
import {
  buildCoursePath,
  buildResourceCollectionPath,
} from "@/lib/paths";

interface ReplyTarget {
  replyId?: number | null;
  userId?: string | null;
  userName?: string | null;
}

function formatDate(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "未知大小";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ResourceDetailPage() {
  const searchParams = useSearchParams();
  const idStr = searchParams.get("id");
  const resourceId = idStr ? parseInt(idStr, 10) : null;

  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [draftMap, setDraftMap] = useState<Record<number, string>>({});
  const [targetMap, setTargetMap] = useState<Record<number, ReplyTarget>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [likeLoadingKey, setLikeLoadingKey] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!resourceId) return;
    let mounted = true;
    setIsLoading(true);

    Promise.all([getResourceDetail(resourceId), listResourceComments(resourceId, 1, 10)])
      .then(([resourceData, commentData]) => {
        if (!mounted) return;
        setResource(resourceData);
        setComments(commentData.items);
        setTotalComments(commentData.total);
        setPage(1);
        setDraftMap({});
        setTargetMap({});
      })
      .catch((error) => {
        console.error("加载资源详情失败", error);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [resourceId]);

  const hasMore = comments.length < totalComments;

  const fetchMore = useCallback(async () => {
    if (!resourceId) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const result = await listResourceComments(resourceId, nextPage, 10);
      setComments((prev) => {
        const existing = new Set(prev.map((comment) => comment.id));
        return [...prev, ...result.items.filter((comment) => !existing.has(comment.id))];
      });
      setTotalComments(result.total);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
      feedback.error({ title: "加载评论失败", description: "请稍后重试。" });
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, resourceId]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || isLoadingMore || !hasMore || !resourceId) return;

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
  }, [fetchMore, hasMore, isLoadingMore, resourceId]);

  const handleReplySubmit = async (parentId: number) => {
    const content = draftMap[parentId]?.trim();
    if (!content) {
      feedback.warning({ title: "回复内容不能为空" });
      return;
    }

    try {
      setSubmittingId(parentId);
      const target = targetMap[parentId] || {};
      const result = await createResourceCommentReply(parentId, {
        content,
        reply_to_comment_id: target.replyId ?? null,
        reply_to_user_id: target.userId ?? null,
      });

      if (!result) {
        return;
      }

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                children: [...(comment.children || []), result],
              }
            : comment,
        ),
      );
      setDraftMap((prev) => ({ ...prev, [parentId]: "" }));
      setTargetMap((prev) => ({ ...prev, [parentId]: {} }));
      feedback.success({ title: "回复成功" });
    } catch (error) {
      console.error(error);
      feedback.error({ title: "回复失败", description: "请稍后重试。" });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleToggleLike = async (id: number, currentLiked: boolean, parentId?: number) => {
    const key = parentId ? `reply-${id}` : `comment-${id}`;
    if (likeLoadingKey) return;

    try {
      setLikeLoadingKey(key);
      if (currentLiked) {
        await removeLike("comment", id);
      } else {
        await addLike("comment", id);
      }

      setComments((prev) =>
        prev.map((comment) => {
          if (!parentId && comment.id === id) {
            return {
              ...comment,
              is_liked: !currentLiked,
              likes: Math.max(0, (comment.likes || 0) + (currentLiked ? -1 : 1)),
            };
          }

          if (parentId && comment.id === parentId && comment.children) {
            return {
              ...comment,
              children: comment.children.map((child) =>
                child.id === id
                  ? {
                      ...child,
                      is_liked: !currentLiked,
                      likes: Math.max(0, (child.likes || 0) + (currentLiked ? -1 : 1)),
                    }
                  : child,
              ),
            };
          }

          return comment;
        }),
      );
    } catch (error) {
      console.error(error);
      feedback.error({ title: "操作失败", description: "请稍后重试。" });
    } finally {
      setLikeLoadingKey(null);
    }
  };

  if (!resourceId) {
    return <div className="p-8 text-center text-slate-500">请提供资源 ID</div>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
      </div>
    );
  }

  if (!resource) {
    return <div className="p-8 text-center text-slate-500">资源不存在</div>;
  }

  return (
    <>
      <DetailPageShell>
        <DetailHero
          accent="resource"
          eyebrow={
            <>
              <DetailRibbonTag text={resource.resource_type || "资料"} tone="resource" />
            </>
          }
          title={resource.title}
          description="查看文件信息、课程归属和使用反馈。"
          aside={
            <div className="space-y-4 rounded-[30px] border border-white/80 bg-white/82 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <div>
                <div className="text-sm font-medium text-slate-500">快速动作</div>
                <div className="mt-4">
                  <CollectButton
                    size="md"
                    targetId={resource.id}
                    targetType="resource"
                    initialStatus={resource.is_favorited ?? false}
                  />
                </div>
              </div>
              <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-7 text-slate-600">
                收藏后可以稍后再看。
              </div>
            </div>
          }
        />

        <DetailSection
          title="文件列表"
          description="下载并查看这份资源包含的文件。"
          action={
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                {resource.files?.length || 0} 个文件
              </div>
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                下载 {resource.downloads || 0}
              </div>
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                浏览 {resource.views || 0}
              </div>
            </div>
          }
        >
          {resource.files && resource.files.length > 0 ? (
            <div className="grid gap-4">
              {resource.files.map((file, index) => (
                <div
                  key={file.id}
                  className="flex flex-col gap-4 rounded-[30px] border border-emerald-100 bg-gradient-to-r from-white to-emerald-50/50 p-5 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-emerald-100 text-emerald-700 shadow-sm">
                      <i className="uil uil-file-download-alt text-2xl" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">
                        文件 {index + 1}
                      </div>
                      <div className="mt-2 break-all text-lg font-semibold text-slate-950">{file.filename}</div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span>{formatFileSize(file.size_bytes)}</span>
                        <span>{file.mime || "未知格式"}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/resources/files/${file.id}/download`,
                        "_blank",
                      )
                    }
                    className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    下载文件
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 py-16 text-center text-slate-500">
              该资源暂未包含任何文件
            </div>
          )}
        </DetailSection>

        <DetailSection
          title="补充信息"
          description="资源的课程信息、标签和补充说明。"
          action={
            <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              点赞 {resource.likes || 0}
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <div className="text-sm font-medium text-slate-700">所属课程</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {resource.course ? (
                  <>
                    <EntityPillLink href={buildCoursePath(resource.course.id)} tone="resource">
                      {resource.course.name}
                    </EntityPillLink>
                    <EntityPillLink href={buildResourceCollectionPath(resource.course.id)} tone="resource">
                      课程资源合集
                    </EntityPillLink>
                  </>
                ) : (
                  <div className="text-sm text-slate-400">暂无所属课程信息</div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <div className="text-sm font-medium text-slate-700">标签</div>
              <div className="mt-4 text-sm leading-7 text-slate-600">
                {resource.tags && resource.tags.length > 0 ? resource.tags.join(" / ") : "暂无标签"}
              </div>
            </div>
          </div>

          {resource.description ? (
            <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-700">资源说明</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{resource.description}</div>
            </div>
          ) : null}
        </DetailSection>

        <div id="comments">
          <DetailSection
            title="资源评论"
            description="看看大家的使用反馈，也可以留下你的评论。"
            action={
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                {totalComments} 条评论
              </div>
            }
          >
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>点击回复可继续讨论</span>
            </div>

            <div className="space-y-5">
              {comments.map((comment) => {
                const children = comment.children || [];
                const activeReplyTarget = targetMap[comment.id];

                return (
                  <article
                    key={comment.id}
                    className="rounded-[32px] border border-slate-200 bg-gradient-to-b from-white to-slate-50/75 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-400">
                        {comment.user?.avatar_url ? (
                          <img src={comment.user.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{(comment.user?.nickname || "?").slice(0, 1)}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-slate-900">{comment.user?.nickname || "未知用户"}</div>
                            <div className="mt-1 text-xs text-slate-400">{formatDate(comment.created_at)}</div>
                          </div>
                          <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                            点赞 {comment.likes || 0}
                          </div>
                        </div>

                        <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{comment.content}</div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(comment.id, !!comment.is_liked)}
                            disabled={likeLoadingKey === `comment-${comment.id}`}
                            className={`inline-flex items-center gap-2 transition ${
                              comment.is_liked ? "text-emerald-700" : "hover:text-slate-700"
                            }`}
                          >
                            <i className="uil uil-thumbs-up text-base" />
                            <span>赞 {comment.likes || 0}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTargetMap((prev) => ({ ...prev, [comment.id]: {} }))}
                            className="inline-flex items-center gap-2 transition hover:text-slate-700"
                          >
                            <i className="uil uil-comment-message text-base" />
                            <span>回复 {children.length}</span>
                          </button>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4">
                          {children.length > 0 ? (
                            <div className="space-y-3 border-l-2 border-slate-100 pl-4">
                              {children.map((child) => {
                                const isTarget = activeReplyTarget?.replyId === child.id;

                                return (
                                  <div
                                    key={child.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                      setTargetMap((prev) => ({
                                        ...prev,
                                        [comment.id]: {
                                          replyId: child.id,
                                          userId: child.user?.id || null,
                                          userName: child.user?.nickname || null,
                                        },
                                      }))
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setTargetMap((prev) => ({
                                          ...prev,
                                          [comment.id]: {
                                            replyId: child.id,
                                            userId: child.user?.id || null,
                                            userName: child.user?.nickname || null,
                                          },
                                        }));
                                      }
                                    }}
                                    className={`rounded-[22px] border p-4 text-left shadow-sm transition ${
                                      isTarget
                                        ? "border-emerald-200 bg-emerald-50/80"
                                        : "border-white bg-slate-50/80 hover:border-slate-200 hover:bg-white"
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="text-sm text-slate-700">
                                        <span className="font-medium text-slate-900">{child.user?.nickname || "未知用户"}</span>
                                        {child.reply_to_user ? (
                                          <span className="ml-2 text-slate-400">回复 @{child.reply_to_user.nickname}</span>
                                        ) : null}
                                      </div>
                                      <div className="text-xs text-slate-400">{formatDate(child.created_at)}</div>
                                    </div>
                                    <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                                      {child.content}
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void handleToggleLike(child.id, !!child.is_liked, comment.id);
                                        }}
                                        disabled={likeLoadingKey === `reply-${child.id}`}
                                        className={`inline-flex items-center gap-2 transition ${
                                          child.is_liked ? "text-emerald-700" : "hover:text-slate-600"
                                        }`}
                                      >
                                        <i className="uil uil-thumbs-up text-sm" />
                                        <span>{child.likes || 0}</span>
                                      </button>
                                      <span>点击继续回复</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="rounded-[22px] bg-slate-50 px-4 py-5 text-sm text-slate-400">
                              还没有回复，来留下第一句吧。
                            </div>
                          )}

                          <div className="mt-4 rounded-[24px] border border-dashed border-emerald-200 bg-slate-50/90 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-sm text-slate-500">
                                {activeReplyTarget?.userName ? (
                                  <span>
                                    当前回复 <span className="text-emerald-700">@{activeReplyTarget.userName}</span>
                                  </span>
                                ) : (
                                  "当前回复主贴"
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setTargetMap((prev) => ({ ...prev, [comment.id]: {} }))}
                                className="text-sm text-slate-400 transition hover:text-slate-600"
                              >
                                切回回复主贴
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={draftMap[comment.id] || ""}
                              onChange={(event) =>
                                setDraftMap((prev) => ({
                                  ...prev,
                                  [comment.id]: event.target.value,
                                }))
                              }
                              placeholder="写下你的回复..."
                              className="mt-3 w-full resize-none rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-emerald-300"
                            />
                            <div className="mt-3 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleReplySubmit(comment.id)}
                                disabled={submittingId === comment.id}
                                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {submittingId === comment.id ? "发送中..." : "发送回复"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!isLoadingMore && comments.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center text-slate-500">
                  还没有人发表资源评论，欢迎留下第一条反馈。
                </div>
              ) : null}

              <div ref={loadMoreRef} className="py-4 text-center text-sm text-slate-500">
                {isLoadingMore ? "正在加载更多评论..." : null}
                {!hasMore && comments.length > 0 ? "没有更多评论了" : null}
              </div>
            </div>
          </DetailSection>
        </div>
      </DetailPageShell>

      <DetailFloatingActionButton onClick={() => setIsComposerOpen(true)} label="写评论" tone="resource" />

      <DetailComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        accent="resource"
        badge="资源评论"
        title={`聊聊 ${resource.title}`}
        description="不用跳页，直接在当前详情里补一句使用反馈、问题说明或适用场景。"
      >
        <CommentComposerForm
          placeholder="这份资源适合考前速刷、平时补笔记还是查漏补缺？文件是否完整、清晰、好下载？"
          onSubmit={async (content) => {
            try {
              const result = await createResourceComment(resource.id, { content });
              if (!result) return;
              setComments((prev) => [result, ...prev]);
              setTotalComments((prev) => prev + 1);
              setIsComposerOpen(false);
              feedback.success({ title: "评论已发布" });
            } catch (error) {
              console.error(error);
              feedback.error({ title: "发布失败", description: "请稍后重试。" });
              throw error;
            }
          }}
        />
      </DetailComposerModal>
    </>
  );
}
