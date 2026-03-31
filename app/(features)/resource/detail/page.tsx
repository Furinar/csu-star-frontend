"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getResourceDetail,
  listResourceComments,
  createResourceComment,
  createResourceCommentReply,
  addLike,
  removeLike,
} from "@/api/detail";
import type { ResourceDetail, ResourceComment } from "@/types/detail";
import { feedback } from "@/store/useFeedbackStore";
import CollectButton from "@/components/ui/CollectButton";

export default function ResourceDetailPage() {
  const searchParams = useSearchParams();
  const idStr = searchParams.get("id");
  const resourceId = idStr ? parseInt(idStr, 10) : null;

  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination for comments
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasFetchedMore, setHasFetchedMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Comment Replies State
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [draftMap, setDraftMap] = useState<Record<number, string>>({});
  const [targetMap, setTargetMap] = useState<Record<number, {replyId?: number, userId?: string, userName?: string}>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // New Comment Draft
  const [newCommentStr, setNewCommentStr] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  useEffect(() => {
    if (!resourceId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      getResourceDetail(resourceId),
      listResourceComments(resourceId, 1, 10),
    ])
      .then(([resData, commentRes]) => {
        if (!isMounted) return;
        setResource(resData);
        setComments(commentRes.items);
        setTotalComments(commentRes.total);
      })
      .catch((err) => {
        console.error("加载资源详情失败", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resourceId]);

  // Infinite scroll
  const hasMore = comments.length < totalComments || (!hasFetchedMore && totalComments === 0 && comments.length === 0);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || isLoadingMore || !hasMore || !resourceId) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchMore();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, page, resourceId]);

  const fetchMore = async () => {
    if (!resourceId) return;
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const res = await listResourceComments(resourceId, nextPage, 10);
      setComments((prev) => {
        const existing = new Set(prev.map((c) => c.id));
        return [...prev, ...res.items.filter((c) => !existing.has(c.id))];
      });
      setTotalComments(res.total);
      setPage(nextPage);
      setHasFetchedMore(true);
    } catch {
      feedback.showToast({ title: "加载评论失败", type: "error" });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCreateComment = async () => {
    if (!resourceId || !newCommentStr.trim()) return;
    try {
      setIsSubmittingNew(true);
      const res = await createResourceComment(resourceId, {
        content: newCommentStr.trim(),
      });
      if (res) {
        setComments((prev) => [res, ...prev]);
        setTotalComments((t) => t + 1);
        setNewCommentStr("");
        feedback.showToast({ title: "评论成功", type: "success" });
      }
    } catch {
      feedback.showToast({ title: "评论失败", type: "error" });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    const content = draftMap[parentId]?.trim();
    if (!content) return;

    try {
      setSubmittingId(parentId);
      const target = targetMap[parentId] || {};

      const res = await createResourceCommentReply(parentId, {
        content,
        reply_to_comment_id: target.replyId ?? null,
        reply_to_user_id: target.userId ?? null,
      });

      if (res) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              return { ...c, children: [...(c.children || []), res] };
            }
            return c;
          }),
        );
        setDraftMap((p) => ({ ...p, [parentId]: "" }));
        setTargetMap((p) => ({ ...p, [parentId]: {} }));
      }
    } catch {
      feedback.showToast({ title: "回复失败", type: "error" });
    } finally {
      setSubmittingId(null);
    }
  };

    const handleToggleLike = async (id: number, currentLiked: boolean, parentId?: number) => {
      try {
        if (currentLiked) {
          await removeLike("comment", id);
        } else {
          await addLike("comment", id);
        }
  
        setComments((prev) => {
          return prev.map((item) => {
             if (!parentId && item.id === id) {
                 return { ...item, is_liked: !currentLiked, likes: (item.likes || 0) + (currentLiked ? -1 : 1) };
             }
             if (parentId && item.id === parentId && item.children) {
                 return {
                     ...item,
                     children: item.children.map(r => r.id === id ? { ...r, is_liked: !currentLiked, likes: (r.likes || 0) + (currentLiked ? -1 : 1) } : r)
                 };
             }
             return item;
          });
        });
      } catch {
          feedback.showToast({ title: "操作失败", type: "error"});
      }
    };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "未知大小";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!resourceId) {
    return <div className="p-8 text-center text-slate-500">请提供资源ID</div>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />
      </div>
    );
  }

  if (!resource) {
    return <div className="p-8 text-center text-slate-500">资源不存在</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-24">
      {/* Hero Section: Resource Theme (Teal/Emerald) */}
      <section className="relative overflow-hidden rounded-[32px] p-8 md:p-12 border border-teal-100/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-emerald-50/40" />
        <div className="absolute -top-32 -left-20 h-96 w-96 animate-blob rounded-full bg-teal-200/40 mix-blend-multiply blur-3xl filter" />
        <div className="absolute -bottom-24 right-10 h-80 w-80 animate-blob rounded-full bg-emerald-200/40 mix-blend-multiply blur-3xl filter animation-delay-2000" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex rounded-full bg-teal-100/80 px-3 py-1 text-xs font-medium text-teal-800 backdrop-blur-sm shadow-sm ring-1 ring-teal-200/50">
              {resource.resource_type || "未知类型"}
            </span>
            <span className="text-sm font-medium text-emerald-800 bg-emerald-100/50 px-3 py-1 rounded-full ring-1 ring-emerald-200/50">
               ★ {resource.hot_score || 0} 热度
            </span>
            <div className="ml-auto">
               <CollectButton
                  targetId={resource.id}
                  targetType="resource"
                  initialStatus={resource.is_favorited ?? false}
                  className="rounded-full bg-white/60 p-2 shadow-sm backdrop-blur-md transition-colors hover:bg-teal-50"
                  activeColor="text-teal-500"
                />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {resource.title}
          </h1>

          {resource.course && (
             <div className="mt-4 flex items-center gap-2">
                <span className="text-slate-500 text-sm">所属课程：</span>
                <Link
                  href={`/course/detail?id=${resource.course.id}`}
                  className="text-sm font-medium text-teal-700 bg-white/50 px-3 py-1 rounded-full transition-colors hover:bg-teal-100/80"
                >
                  {resource.course.name}
                </Link>
             </div>
          )}

          {resource.description && (
            <p className="mt-6 max-w-2xl text-slate-700 leading-relaxed bg-white/40 p-4 rounded-2xl border border-white/60">
              {resource.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-6 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-xl border border-white/60">
              <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {resource.downloads || 0} 次下载
            </div>
            <div className="flex items-center gap-1.5 bg-white/50 px-3 py-1.5 rounded-xl border border-white/60">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {resource.views || 0} 次浏览
            </div>
          </div>
        </div>
      </section>

      {/* File First Content Area */}
      <section className="space-y-6">
         <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">附件列表</h2>
            <div className="h-px flex-1 bg-slate-100"></div>
         </div>
         
         <div className="grid gap-4">
           {resource.files && resource.files.length > 0 ? (
             resource.files.map((file) => (
               <div key={file.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-teal-200">
                 <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 break-all">{file.filename}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{formatFileSize(file.size_bytes)}</p>
                    </div>
                 </div>
                 <button
                    onClick={() => {
                        window.open(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/resources/files/${file.id}/download`, "_blank");
                    }}
                    className="flex shrink-0 items-center justify-center rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-teal-500/20 transition-all hover:bg-teal-700"
                 >
                    下载
                 </button>
               </div>
             ))
           ) : (
             <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-500">
                该资源尚未包含任何文件
             </div>
           )}
         </div>
      </section>

      {/* Resource Level Comments */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">资源讨论交流</h2>
            <span className="text-sm text-slate-500">共 {totalComments} 条评论</span>
        </div>

        {/* Input for new top-level comment */}
        <div className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">
                 <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                 </svg>
            </div>
            <div className="flex w-full flex-col gap-3">
              <textarea
                placeholder="分享你对这份资料的看法或提出问题..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                rows={2}
                value={newCommentStr}
                onChange={(e) => setNewCommentStr(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleCreateComment}
                  disabled={isSubmittingNew || !newCommentStr.trim()}
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  发表评论
                </button>
              </div>
            </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
           {comments.map((comment) => (
             <div key={comment.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                 <div className="flex items-start gap-3">
                     <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 overflow-hidden">
                        {comment.user?.avatar_url ? (
                           <img src={comment.user.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                           <div className="flex h-full items-center justify-center text-slate-400 text-xs text-center border-none">
                              {comment.user?.nickname?.charAt(0) || "U"}
                           </div>
                        )}
                     </div>
                     <div className="flex-1">
                         <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900 text-sm">{comment.user?.nickname || "未知用户"}</span>
                            <span className="text-xs text-slate-400">{comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ""}</span>
                         </div>
                         <p className="mt-1 text-sm text-slate-700">{comment.content}</p>
                         
                         <div className="mt-3 flex gap-4 text-xs font-medium text-slate-500">
                             <button
                               onClick={() => handleToggleLike(comment.id, !!comment.is_liked)}
                               className={`hover:text-teal-600 transition ${comment.is_liked ? "text-teal-600" : ""}`}
                             >
                                 点赞 ({comment.likes || 0})
                             </button>
                             <button
                               onClick={() => {
                                 setExpandedMap(p => ({ ...p, [comment.id]: !p[comment.id] }));
                                 if (!expandedMap[comment.id]) setTargetMap(p => ({ ...p, [comment.id]: {} }));
                               }}
                               className="hover:text-slate-800 transition"
                             >
                                 展开回复 ({comment.children?.length || 0})
                             </button>
                         </div>

                         {/* Nested Replies */}
                         {expandedMap[comment.id] && (
                             <div className="mt-4 rounded-xl bg-slate-50/80 p-4">
                                {comment.children?.length ? (
                                  <div className="space-y-4 mb-4">
                                      {comment.children.map(child => (
                                          <div key={child.id} className="text-sm">
                                             <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">{child.user?.nickname}</span>
                                                {child.reply_to_user && (
                                                   <span className="text-slate-400">回复 <span className="text-slate-700">@{child.reply_to_user.nickname}</span></span>
                                                )}
                                                <span className="text-xs text-slate-400 ml-auto">{child.created_at ? new Date(child.created_at).toLocaleDateString() : ""}</span>
                                             </div>
                                             <p className="mt-1 text-slate-700">{child.content}</p>
                                             <div className="mt-1.5 gap-3 flex text-xs font-medium text-slate-500">
                                                <button onClick={() => setTargetMap(p => ({...p, [comment.id]: { replyId: child.id, userId: child.user?.id, userName: child.user?.nickname }}))} className="hover:text-teal-600">回复</button>
                                                <button onClick={() => handleToggleLike(child.id, !!child.is_liked, comment.id)} className={`hover:text-teal-600 ${child.is_liked ? "text-teal-600":""}`}>点赞 ({child.likes || 0})</button>
                                             </div>
                                          </div>
                                      ))}
                                  </div>
                                ) : null}

                                <div className="flex flex-col gap-2">
                                  {targetMap[comment.id]?.userName && (
                                     <div className="flex items-center justify-between text-xs text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg w-max">
                                         <span>回复 @{targetMap[comment.id].userName}</span>
                                         <button onClick={() => setTargetMap(p => ({...p, [comment.id]: {}}))} className="ml-2 hover:text-teal-900">×</button>
                                     </div>
                                  )}
                                  <div className="flex gap-2">
                                     <input
                                        type="text"
                                        placeholder="写下你的回复..."
                                        value={draftMap[comment.id] || ""}
                                        onChange={(e) => setDraftMap(p => ({...p, [comment.id]: e.target.value}))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReplySubmit(comment.id);
                                            }
                                        }}
                                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white"
                                     />
                                     <button
                                        disabled={submittingId === comment.id}
                                        onClick={() => handleReplySubmit(comment.id)}
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                                     >
                                        发布
                                     </button>
                                  </div>
                                </div>
                             </div>
                         )}
                     </div>
                 </div>
             </div>
           ))}
        </div>

        <div ref={loadMoreRef} className="py-6 text-center text-sm text-slate-500">
            {isLoadingMore && "加载中..."}
            {!hasMore && comments.length > 0 && "没有更多评论了"}
            {comments.length === 0 && !isLoadingMore && "还没有人发表评论，来抢占沙发吧！"}
        </div>
      </section>
    </div>
  );
}
