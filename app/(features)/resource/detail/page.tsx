"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addLike,
  createResourceComment,
  getResourceDetail,
  listResourceComments,
  removeLike,
} from "@/api/detail";
import { downloadResourceFile } from "@/api/resource";
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
import { buildCoursePath, buildResourceCollectionPath } from "@/lib/paths";
import { formatDateTimeZh } from "@/lib/date";
import { useHasMounted } from "@/hooks/useHasMounted";
import { getResourceTypeLabel } from "@/app/(features)/me/components/shared/helpers";
import BilibiliCommentThread from "@/components/ui/BilibiliCommentThread";

interface ReplyTarget {
  replyId?: number | null;
  userId?: string | null;
  userName?: string | null;
}

function formatDate(value?: string) {
  return formatDateTimeZh(value);
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "未知大小";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ResourceDetailPage() {
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const idStr = hasMounted ? searchParams.get("id") : null;
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
  const isDeleted = resource?.status === "deleted";

  const handleDownload = async (fileId: string, filename: string) => {
    if (!resourceId) return;
    if (isDeleted) {
      feedback.warning({
        title: "资源已删除",
        description: "已删除资源仅保留记录，不支持下载。",
      });
      return;
    }
    try {
      feedback.info({ title: "正在获取下载链接..." });
      const { url } = await downloadResourceFile(resourceId, fileId);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      feedback.success({ title: "开始下载" });
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "无法获取下载链接";
      feedback.error({ title: "下载失败", description: msg });
    }
  };

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMounted) return;
    if (!resourceId) return;
    let mounted = true;
    setIsLoading(true);

    Promise.all([
      getResourceDetail(resourceId),
      listResourceComments(resourceId, 1, 10),
    ])
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
  }, [hasMounted, resourceId]);

  const hasMore = comments.length < totalComments;

  const fetchMore = useCallback(async () => {
    if (!resourceId) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const result = await listResourceComments(resourceId, nextPage, 10);
      setComments((prev) => {
        const existing = new Set(prev.map((comment) => comment.id));
        return [
          ...prev,
          ...result.items.filter((comment) => !existing.has(comment.id)),
        ];
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
    if (!resourceId) {
      feedback.error({
        title: "资源信息缺失",
        description: "请刷新页面后重试。",
      });
      return;
    }
    if (isDeleted) {
      feedback.warning({
        title: "资源已删除",
        description: "已删除资源不支持继续评论。",
      });
      return;
    }

    const content = draftMap[parentId]?.trim();
    if (!content) {
      feedback.warning({ title: "回复内容不能为空" });
      return;
    }

    try {
      setSubmittingId(parentId);
      const target = targetMap[parentId] || {};
      const result = await createResourceComment(resourceId, {
        content,
        parent_id: parentId,
        reply_to_comment_id: target.replyId ?? null,
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

  const handleToggleLike = async (
    id: number,
    currentLiked: boolean,
    parentId?: number,
  ) => {
    if (isDeleted) {
      feedback.warning({
        title: "资源已删除",
        description: "已删除资源不支持点赞互动。",
      });
      return;
    }
    const key = parentId ? `reply-${id}` : `comment-${id}`;
    if (likeLoadingKey) return;

    try {
      setLikeLoadingKey(key);
      if (currentLiked) {
        await removeLike("comment", String(id));
      } else {
        await addLike("comment", String(id));
      }

      setComments((prev) =>
        prev.map((comment) => {
          if (!parentId && comment.id === id) {
            return {
              ...comment,
              is_liked: !currentLiked,
              likes: Math.max(
                0,
                (comment.likes || 0) + (currentLiked ? -1 : 1),
              ),
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
                      likes: Math.max(
                        0,
                        (child.likes || 0) + (currentLiked ? -1 : 1),
                      ),
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

  if (!hasMounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
      </div>
    );
  }

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
              <DetailRibbonTag
                text={getResourceTypeLabel(resource.resource_type || undefined)}
                tone="resource"
              />
              {isDeleted ? (
                <DetailRibbonTag text="已删除" tone="resource" />
              ) : null}
            </>
          }
          title={resource.title}
          description="查看文件信息、课程归属和使用反馈。"
          aside={
            <div className="space-y-4 rounded-[30px] border border-white/80 bg-white/82 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <div>
                <div className="text-sm font-medium text-slate-500">
                  快速动作
                </div>
                <div className="mt-4">
                  {isDeleted ? (
                    <div className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                      已删除资源禁止收藏
                    </div>
                  ) : (
                    <CollectButton
                      size="md"
                      targetId={resource.id}
                      targetType="resource"
                      initialStatus={resource.is_favorited ?? false}
                    />
                  )}
                </div>
              </div>
              <div
                className={`rounded-[24px] p-4 text-sm leading-7 ${
                  isDeleted
                    ? "border border-rose-100 bg-rose-50/80 text-rose-700"
                    : "border border-emerald-100 bg-emerald-50/70 text-slate-600"
                }`}
              >
                {isDeleted
                  ? "该资源已删除，仅上传者或管理员可见，下载与互动能力已关闭。"
                  : "收藏后可以稍后再看。"}
              </div>
            </div>
          }
        />

        {isDeleted ? (
          <div className="mb-8 rounded-[32px] border border-rose-200 bg-rose-50/80 px-6 py-5 text-sm leading-7 text-rose-700 shadow-sm">
            该资源已被删除。当前页面仅用于保留上传记录和基础信息展示，不再提供下载、收藏、评论或点赞。
          </div>
        ) : null}

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
                      <div className="mt-2 break-all text-lg font-semibold text-slate-950">
                        {file.filename}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span>{formatFileSize(file.size_bytes)}</span>
                        <span>{file.mime || "未知格式"}</span>
                      </div>
                    </div>
                  </div>
                  {isDeleted ? (
                    <div className="inline-flex shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700">
                      已删除，禁止下载
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownload(file.id, file.filename)}
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      下载文件
                    </button>
                  )}
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
                    <EntityPillLink
                      href={buildCoursePath(resource.course.id)}
                      tone="resource"
                    >
                      {resource.course.name}
                    </EntityPillLink>
                    <EntityPillLink
                      href={buildResourceCollectionPath(resource.course.id)}
                      tone="resource"
                    >
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
                {resource.tags && resource.tags.length > 0
                  ? resource.tags.join(" / ")
                  : "暂无标签"}
              </div>
            </div>
          </div>

          {resource.description ? (
            <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-700">资源说明</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {resource.description}
              </div>
            </div>
          ) : null}
        </DetailSection>

        <div id="comments">
          <DetailSection
            title={
              <div className="flex items-center gap-2">
                <span>资源评论</span>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{totalComments}</span>
              </div>
            }
            description="看看大家的使用反馈，也可以留下你的评论。"
          >
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>
                {isDeleted
                  ? "已删除资源仅保留历史评论展示"
                  : "点击回复可继续讨论"}
              </span>
            </div>

            <BilibiliCommentThread
              comments={comments.map((comment) => {
                const isActive = !!targetMap[comment.id];
                const activeTarget = targetMap[comment.id] || {};

                return {
                  id: comment.id,
                  user: comment.user,
                  content: comment.content,
                  createdAt: comment.created_at || "",
                  likes: comment.likes,
                  isLiked: comment.is_liked,
                  replies: (comment.children || []).map((reply) => ({
                    id: reply.id,
                    user: reply.user || {
                      id: "",
                      nickname: "未知用户",
                      avatar_url: null,
                    },
                    replyToUser: reply.reply_to_user,
                    content: reply.content,
                    createdAt: reply.created_at || "",
                    likes: reply.likes,
                    isLiked: reply.is_liked,
                    onLike: (liked: boolean) =>
                      handleToggleLike(reply.id, !liked),
                    onReplyClick: () => {
                      setTargetMap((prev) => ({
                        ...prev,
                        [comment.id]: {
                          replyId: reply.id,
                          userId: reply.user?.id,
                          userName: reply.user?.nickname,
                        },
                      }));
                    },
                  })),
                  isReplying: isActive,
                  replyComposer: (
                    <div className="mt-4">
                      <CommentComposerForm
                        onSubmit={async (content) => {
                          const target = targetMap[comment.id] || {};
                          setSubmittingId(comment.id);
                          try {
                            const reply = await createResourceComment(
                              resourceId || 0,
                              {
                                content,
                                parent_id: comment.id,
                                reply_to_comment_id:
                                  target.replyId || undefined,
                              },
                            );
                            setComments((prev) =>
                              prev.map((item) =>
                                item.id === comment.id
                                  ? {
                                      ...item,
                                      children: [
                                        ...(item.children || []),
                                        reply,
                                      ],
                                    }
                                  : item,
                              ),
                            );
                            setTotalComments((prev) => prev + 1);
                            setTargetMap((prev) => {
                              const next = { ...prev };
                              delete next[comment.id];
                              return next;
                            });
                            feedback.success({ title: "回复成功" });
                          } catch (err) {
                            feedback.error({ title: "回复失败" });
                          } finally {
                            setSubmittingId(null);
                          }
                        }}
                        placeholder={
                          activeTarget.userName
                            ? `回复 @${activeTarget.userName}...`
                            : "说点什么吧..."
                        }
                      />
                    </div>
                  ),
                  onLike: (liked) => handleToggleLike(comment.id, !liked),
                  onReplyClick: () =>
                    setTargetMap((prev) => ({ ...prev, [comment.id]: {} })),
                };
              })}
            />

            {hasMore ? (
              <div ref={loadMoreRef} className="mt-8 flex justify-center py-4">
                {isLoadingMore ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
                ) : (
                  <div className="h-6 w-6" />
                )}
              </div>
            ) : comments.length > 0 ? (
              <div className="mt-8 py-8 text-center text-sm text-slate-400">
                已显示全部评论
              </div>
            ) : null}
          </DetailSection>
        </div>
      </DetailPageShell>

      <DetailFloatingActionButton
        onClick={() => (isDeleted ? null : setIsComposerOpen(true))}
        label="发布评价"
        tone="resource"
      />

      <DetailComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        title="发布评价"
        accent="resource"
        badge="评论"
        description="谈谈你的看法"
      >
        <CommentComposerForm
          placeholder="你觉得这份资源怎么样？"
          onSubmit={async (content) => {
            if (!resourceId) return;
            try {
              const res = await createResourceComment(resourceId, { content });
              setComments((prev) => [res, ...prev]);
              setTotalComments((prev) => prev + 1);
              setIsComposerOpen(false);
              feedback.success({ title: "评论成功" });
            } catch (err) {
              console.error(err);
              feedback.error({
                title: "评论失败",
                description: "由于某些原因，评论无法发布。",
              });
            }
          }}
        />
      </DetailComposerModal>
    </>
  );
}
