"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addLike,
  createResourceComment,
  deleteResourceComment,
  getResourceDetail,
  listResourceComments,
  removeLike,
  updateResource,
  updateResourceComment,
} from "@/api/detail";
import { deleteResource, downloadResourceFile } from "@/api/resource";
import type {
  EvaluationSort,
  ResourceComment,
  ResourceDetail,
} from "@/types/detail";
import type { ReportTargetType } from "@/types/me";
import { Role } from "@/types/auth";
import { feedback } from "@/store/useFeedbackStore";
import CommentComposerForm from "@/components/detail/CommentComposerForm";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import ReportDialog from "@/components/report/ReportDialog";
import ResourceEditModal from "@/components/detail/ResourceEditModal";
import CollectButton from "@/components/ui/CollectButton";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import ItemActionMenu, {
  ItemActionMenuItem,
} from "@/components/ui/ItemActionMenu";
import {
  DetailHero,
  DetailPageShell,
  DetailRibbonTag,
  DetailSection,
  EntityPillLink,
} from "@/components/detail/DetailScaffold";
import { buildCoursePath } from "@/lib/paths";
import { formatDateTimeZh } from "@/lib/date";
import { getPageTheme } from "@/lib/pageTheme";
import { requireAuthAction } from "@/lib/requireAuthAction";
import { useHasMounted } from "@/hooks/useHasMounted";
import { getFileIcon } from "./fileIcons";
import BilibiliCommentThread from "@/components/ui/BilibiliCommentThread";
import { useAuthStore } from "@/store/useAuthStore";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import DownloadButton from "@/components/ui/DownloadButton";
import type { EntityId } from "@/types/entity";

interface ReplyTarget {
  replyId?: EntityId | null;
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
  const router = useRouter();
  const resourceTheme = getPageTheme("/resource");
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const resourceId = hasMounted ? searchParams.get("id") : null;

  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.access_token);
  const viewerId = authUser?.id ?? null;
  const viewerRole = authUser?.role ?? null;
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [commentSort, setCommentSort] = useState<EvaluationSort>("created_at");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshingComments, setIsRefreshingComments] = useState(false);
  const [draftMap, setDraftMap] = useState<Record<string, string>>({});
  const [targetMap, setTargetMap] = useState<Record<string, ReplyTarget>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [likeLoadingKey, setLikeLoadingKey] = useState<string | null>(null);
  const [isResourceLikeLoading, setIsResourceLikeLoading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadedFileId, setDownloadedFileId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isEditResourceOpen, setIsEditResourceOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<{
    id: EntityId;
    parentId?: EntityId | null;
    content: string;
  } | null>(null);
  const [editingCommentDraft, setEditingCommentDraft] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [activeReportTarget, setActiveReportTarget] = useState<{
    type: ReportTargetType;
    id: string;
    label: string;
  } | null>(null);
  const isDeleted = resource?.status === "deleted";
  const isPrivileged = viewerRole === Role.Admin || viewerRole === Role.Auditor;
  const isUploader = Boolean(
    resource?.uploader_id && viewerId && resource.uploader_id === viewerId,
  );
  const ensureSignedIn = useCallback(
    (description: string) =>
      requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description,
      }),
    [accessToken, router],
  );

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
      setDownloadingFileId(fileId);
      setDownloadedFileId(null);
      feedback.info({ title: "正在获取下载链接..." });
      const result = await downloadResourceFile(resourceId, fileId);
      const { url } = result;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      feedback.success({
        title: "开始下载",
        description:
          typeof result.remaining_points === "number"
            ? `本次下载消耗 1 积分，剩余 ${result.remaining_points} 积分。`
            : typeof result.free_download_count === "number"
              ? `本次下载未扣积分，剩余免费下载次数 ${result.free_download_count}。`
              : undefined,
      });
      setDownloadedFileId(fileId);
      window.setTimeout(() => {
        setDownloadedFileId((current) => (current === fileId ? null : current));
      }, 1400);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "无法获取下载链接";
      feedback.error({ title: "下载失败", description: msg });
    } finally {
      setDownloadingFileId((current) => (current === fileId ? null : current));
    }
  };

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMounted) return;
    if (!resourceId) return;
    let mounted = true;
    const shouldShowPageLoading = resource == null;
    if (shouldShowPageLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshingComments(true);
    }

    Promise.all([
      getResourceDetail(resourceId),
      listResourceComments(resourceId, 1, 10, commentSort),
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
        if (!mounted) return;
        if (shouldShowPageLoading) {
          setIsLoading(false);
        }
        setIsRefreshingComments(false);
      });

    return () => {
      mounted = false;
    };
  }, [commentSort, hasMounted, resourceId]);

  const hasMore = comments.length < totalComments;

  const fetchMore = useCallback(async () => {
    if (!resourceId) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const result = await listResourceComments(
        resourceId,
        nextPage,
        10,
        commentSort,
      );
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
  }, [commentSort, page, resourceId]);

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

  const handleReplySubmit = async (parentId: EntityId) => {
    if (!ensureSignedIn("登录后才能回复资源评论。")) {
      return;
    }

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
    id: EntityId,
    currentLiked: boolean,
    parentId?: EntityId,
  ) => {
    if (!ensureSignedIn("登录后才能点赞内容。")) {
      return;
    }

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

  const handleToggleResourceLike = async () => {
    if (!resource) return;
    if (!ensureSignedIn("登录后才能点赞资源。")) {
      return;
    }
    if (isDeleted) {
      feedback.warning({
        title: "资源已删除",
        description: "已删除资源不支持点赞互动。",
      });
      return;
    }
    if (isResourceLikeLoading) return;

    const currentLiked = resource.is_liked ?? false;

    try {
      setIsResourceLikeLoading(true);
      if (currentLiked) {
        await removeLike("resource", String(resource.id));
      } else {
        await addLike("resource", String(resource.id));
      }

      setResource((prev) =>
        prev
          ? {
              ...prev,
              is_liked: !currentLiked,
              likes: Math.max(0, (prev.likes ?? 0) + (currentLiked ? -1 : 1)),
            }
          : prev,
      );
    } catch (error) {
      console.error(error);
      feedback.error({ title: "点赞失败", description: "请稍后重试。" });
    } finally {
      setIsResourceLikeLoading(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingComment) return;
    const content = editingCommentDraft.trim();
    if (!content) {
      feedback.warning({ title: "评论内容不能为空" });
      return;
    }
    try {
      setIsUpdatingComment(true);
      const updated = await updateResourceComment(editingComment.id, {
        content,
      });
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === editingComment.id) {
            return updated;
          }
          if (
            editingComment.parentId &&
            comment.id === editingComment.parentId
          ) {
            return {
              ...comment,
              children: (comment.children || []).map((child) =>
                child.id === editingComment.id ? updated : child,
              ),
            };
          }
          return comment;
        }),
      );
      setEditingComment(null);
      feedback.success({ title: "评论已更新" });
    } catch (error) {
      console.error(error);
      feedback.error({ title: "更新失败", description: "请稍后重试。" });
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: EntityId, parentId?: EntityId) => {
    if (!window.confirm("确认删除这条评论吗？")) return;
    try {
      setDeletingKey(`comment-${commentId}`);
      await deleteResourceComment(commentId);
      setComments((prev) =>
        prev
          .filter((comment) => !(!parentId && comment.id === commentId))
          .map((comment) =>
            parentId && comment.id === parentId
              ? {
                  ...comment,
                  children: (comment.children || []).filter(
                    (child) => child.id !== commentId,
                  ),
                }
              : comment,
          ),
      );
      if (!parentId) {
        setTotalComments((prev) => Math.max(0, prev - 1));
      }
      feedback.success({ title: "评论已删除" });
    } catch (error) {
      console.error(error);
      feedback.error({ title: "删除失败", description: "请稍后重试。" });
    } finally {
      setDeletingKey(null);
    }
  };

  const openReportDialog = (
    targetType: ReportTargetType,
    targetId: string,
    label: string,
  ) => {
    if (!ensureSignedIn("登录后才能提交举报。")) {
      return;
    }

    setActiveReportTarget({
      type: targetType,
      id: targetId,
      label,
    });
  };

  const buildUserAvatarActions = (comment: ResourceComment) => {
    const user = comment.user;
    if (!user?.id || user.id === viewerId) {
      return [];
    }

    return [
      {
        key: `report-comment-${comment.id}`,
        label: "举报该评论",
        onClick: () =>
          openReportDialog("comment", String(comment.id), "评论内容"),
      },
    ];
  };

  const buildResourceActions = (): ItemActionMenuItem[] => {
    if (!resource) return [];
    const actions: ItemActionMenuItem[] = [];
    if (isUploader || isPrivileged) {
      if (!isDeleted) {
        actions.push({
          key: "edit",
          label: "修改资源",
          onClick: () => setIsEditResourceOpen(true),
        });
        actions.push({
          key: "delete",
          label: "删除资源",
          destructive: true,
          onClick: async () => {
            const confirmed = window.confirm(
              `确认删除资源《${resource.title}》吗？`,
            );
            if (!confirmed) return;
            await deleteResource(resource.id);
            setResource((prev) =>
              prev ? { ...prev, status: "deleted" } : prev,
            );
            feedback.success({ title: "资源已删除" });
          },
        });
      }
    } else if (!isDeleted) {
      actions.push({
        key: "report",
        label: "举报资源",
        onClick: () => openReportDialog("resource", String(resource.id), "资源内容"),
      });
    }
    return actions;
  };

  const buildCommentActions = (
    comment: ResourceComment,
    parentId?: EntityId,
  ): ItemActionMenuItem[] => {
    const actions: ItemActionMenuItem[] = [];
    const isAuthor = viewerId != null && comment.user?.id === viewerId;
    const canDelete = isAuthor || isPrivileged || isUploader;
    if (isAuthor) {
      actions.push({
        key: "edit",
        label: "修改",
        onClick: () => {
          setEditingComment({
            id: comment.id,
            parentId,
            content: comment.content,
          });
          setEditingCommentDraft(comment.content);
        },
      });
    }
    if (canDelete) {
      actions.push({
        key: "delete",
        label: deletingKey === `comment-${comment.id}` ? "删除中..." : "删除",
        destructive: true,
        onClick: () => handleDeleteComment(comment.id, parentId),
      });
    }
    if (!isAuthor) {
      actions.push({
        key: "report",
        label: "举报",
        onClick: () => openReportDialog("comment", String(comment.id), "评论内容"),
      });
    }
    return actions;
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
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--page-accent-text)] transition hover:opacity-80"
        >
          <i className="uil uil-arrow-left text-base" />
          返回上一页
        </button>

        <DetailHero
          accent="resource"
          title={resource.title}
          description={
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
                资源说明
              </div>
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-600 md:text-base">
                {resource.description?.trim() || "暂无资源说明。"}
              </div>
            </div>
          }
          meta={
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 mt-4">
              <div className="flex items-center gap-1.5 transition-colors">
                <i className="uil uil-file-alt text-lg text-emerald-500"></i>
                <span>{resource.files?.length || 0} 个文件</span>
              </div>
              <div className="flex items-center gap-1.5 transition-colors">
                <i className="uil uil-cloud-download text-lg text-blue-500"></i>
                <span>下载 {resource.downloads || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 transition-colors">
                <i className="uil uil-eye text-lg text-amber-500"></i>
                <span>浏览 {resource.views || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 transition-colors">
                <i className="uil uil-thumbs-up text-lg text-rose-500"></i>
                <span>点赞 {resource.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 transition-colors">
                <i className="uil uil-bookmark text-lg text-emerald-500"></i>
                <span>收藏 {resource.favorite_count || 0}</span>
              </div>
            </div>
          }
          aside={
            <div className="space-y-4 rounded-[20px] border border-white/80 bg-white/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-700">
                    资源互动
                  </div>
                  <ItemActionMenu items={buildResourceActions()} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => void handleToggleResourceLike()}
                    disabled={isDeleted || isResourceLikeLoading}
                    className={`inline-flex items-center justify-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-medium transition ${
                      resource.is_liked
                        ? "border-rose-200 bg-rose-50 text-rose-600"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <i className="uil uil-thumbs-up text-base"></i>
                    <span>
                      {isResourceLikeLoading
                        ? "处理中..."
                        : `${resource.is_liked ? "已点赞" : "点赞"} ${resource.likes ?? 0}`}
                    </span>
                  </button>
                  {isDeleted ? (
                    <div className="rounded-[12px] border border-rose-100 bg-rose-50 px-4 py-2 text-center text-sm font-medium text-rose-700">
                      禁止收藏
                    </div>
                  ) : (
                    <CollectButton
                      size="md"
                      targetId={resource.id}
                      targetType="resource"
                      initialStatus={resource.is_favorited ?? false}
                      className="w-full"
                      onStatusChange={(nextCollected) =>
                        setResource((prev) =>
                          prev
                            ? {
                                ...prev,
                                is_favorited: nextCollected,
                                favorite_count: Math.max(
                                  0,
                                  (prev.favorite_count ?? 0) + (nextCollected ? 1 : -1),
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          }
        >
          <div className="mt-4 flex flex-col gap-3">
            {resource.course ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-400">
                    所属课程:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <EntityPillLink
                      href={buildCoursePath(resource.course.id)}
                      tone="resource"
                    >
                      {resource.course.name}
                    </EntityPillLink>
                  </div>
                </div>
              </div>
            ) : null}

            {resource.tags && resource.tags.length > 0 ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-400">
                  资源标签:
                </span>
                <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-white/60 px-2 py-0.5 shadow-sm border border-slate-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

          </div>
        </DetailHero>

        {isDeleted ? (
          <div className="mb-8 rounded-[20px] border border-rose-200 bg-rose-50/80 px-6 py-5 text-sm leading-7 text-rose-700 shadow-sm">
            该资源已被删除。当前页面仅用于保留上传记录和基础信息展示，不再提供下载、收藏、评论或点赞。
          </div>
        ) : null}

        <DetailSection
          title="文件列表"
          description="下载并查看这份资源包含的文件。"
        >
          {resource.files && resource.files.length > 0 ? (
            <div className="grid gap-3">
              {resource.files.map((file, index) => (
                <div
                  key={file.id}
                  className="flex flex-col gap-4 rounded-[20px] border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition hover:shadow-[0_4px_15px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={getFileIcon(file.filename)}
                      alt={file.filename}
                      className="h-10 w-10 shrink-0 object-contain drop-shadow-sm"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-slate-800">
                        {file.filename}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <i className="uil uil-database text-sky-400"></i>{" "}
                          {formatFileSize(file.size_bytes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="uil uil-tag-alt text-rose-400"></i>{" "}
                          {file.mime || "未知格式"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isDeleted ? (
                    <div className="inline-flex shrink-0 items-center justify-center rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                      已删除，禁止下载
                    </div>
                  ) : (
                    <DownloadButton
                      status={
                        downloadingFileId === file.id
                          ? "loading"
                          : downloadedFileId === file.id
                            ? "success"
                            : "idle"
                      }
                      onClick={() => handleDownload(file.id, file.filename)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 py-16 text-center text-slate-500">
              该资源暂未包含任何文件
            </div>
          )}
        </DetailSection>

        <div id="comments">
          <DetailSection
            title={
              <div className="flex items-center gap-2">
                <span>资源评论</span>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {totalComments}
                </span>
              </div>
            }
            description="看看大家的使用反馈，也可以留下你的评论。"
          >
            <div className="mb-5 flex flex-wrap items-center justify-end gap-3 text-sm text-slate-500">
              <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                {(["created_at", "likes"] as EvaluationSort[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCommentSort(item)}
                    className={`rounded-full px-4 py-1.5 text-sm transition ${
                      commentSort === item
                        ? "text-white"
                        : "text-slate-500 hover:text-[var(--page-accent-text)]"
                    }`}
                    style={
                      commentSort === item
                        ? { backgroundImage: resourceTheme.pageAccentGradient }
                        : undefined
                    }
                  >
                    {item === "likes" ? "按热度" : "按时间"}
                  </button>
                ))}
              </div>
            </div>

            {isRefreshingComments ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
              </div>
            ) : (
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
                    actions: buildCommentActions(comment),
                    avatarActions: buildUserAvatarActions(comment),
                    replies: (comment.children || []).map((reply) => ({
                      id: reply.id,
                      user: reply.user,
                      replyToUser: reply.reply_to_user,
                      content: reply.content,
                      createdAt: reply.created_at || "",
                      likes: reply.likes,
                      isLiked: reply.is_liked,
                      actions: buildCommentActions(reply, comment.id),
                      avatarActions: buildUserAvatarActions(reply),
                      onLike: (liked: boolean) =>
                        handleToggleLike(reply.id, liked, comment.id),
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
                            if (!ensureSignedIn("登录后才能回复资源评论。")) {
                              return;
                            }

                            const target = targetMap[comment.id] || {};
                            setSubmittingId(comment.id);
                            try {
                              const reply = await createResourceComment(
                                resourceId,
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
                              setTargetMap((prev) => ({
                                ...prev,
                                [comment.id]: {},
                              }));
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
                    onLike: (liked) => handleToggleLike(comment.id, liked),
                    onReplyClick: () => {
                      if (!ensureSignedIn("登录后才能回复资源评论。")) {
                        return;
                      }

                      setTargetMap((prev) => ({
                        ...prev,
                        [comment.id]: {
                          replyId: comment.id,
                          userId: comment.user?.id,
                          userName: comment.user?.nickname,
                        },
                      }));
                    },
                  };
                })}
              />
            )}

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
        onClick={() => {
          if (isDeleted) return;
          if (!ensureSignedIn("登录后才能发表评论。")) {
            return;
          }
          setIsComposerOpen(true);
        }}
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
            if (!ensureSignedIn("登录后才能发表评论。")) {
              return;
            }

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

      <DetailComposerModal
        isOpen={editingComment !== null}
        onClose={() => setEditingComment(null)}
        title="编辑评论"
        accent="resource"
        badge="修改评论"
        description="修改评论正文，保存后会立即更新当前列表。"
      >
        {editingComment ? (
          <div className="space-y-4">
            <textarea
              value={editingCommentDraft}
              onChange={(event) => setEditingCommentDraft(event.target.value)}
              className="min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingComment(null)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                取消
              </button>
              <ActionSubmitButton
                defaultText="保存修改"
                isSent={isUpdatingComment}
                disabled={isUpdatingComment || !editingCommentDraft.trim()}
                onClick={handleUpdateComment}
              />
            </div>
          </div>
        ) : null}
      </DetailComposerModal>

      <ResourceEditModal
        resource={resource}
        open={isEditResourceOpen}
        onClose={() => setIsEditResourceOpen(false)}
        onSubmit={async (payload) => {
          if (!resource) return;
          try {
            const next = await updateResource(resource.id, payload);
            setResource(next);
            setIsEditResourceOpen(false);
            feedback.success({ title: "资源已更新" });
          } catch (error) {
            console.error(error);
            feedback.error({ title: "更新失败", description: "请稍后重试。" });
          }
        }}
      />

      <ReportDialog
        open={activeReportTarget !== null}
        target={activeReportTarget}
        onClose={() => setActiveReportTarget(null)}
      />
    </>
  );
}
