"use client";

import { useEffect, useRef, useState } from "react";
import { addLike, removeLike } from "@/api/detail";
import { submitReport } from "@/api/me";
import { feedback } from "@/store/useFeedbackStore";
import type {
  CourseEvaluation,
  CourseEvaluationInput,
  EvaluationReply,
  EvaluationReplyInput,
  PaginatedData,
  TeacherEvaluation,
  TeacherEvaluationInput,
} from "@/types/detail";
import EvaluationModal from "./EvaluationModal";
import StarRating from "@/components/ui/StarRating";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDateTime } from "@/lib/utils"; // Assuming you have a formatting utility, else I'll define it inline later if needed.

type ThreadEvaluation = TeacherEvaluation | CourseEvaluation;
type EvaluationType = "teacher" | "course";

interface RelatedItem {
  id: number;
  name: string;
}

interface ReplyTarget {
  replyId?: number | null;
  userId?: string | null;
  userName?: string | null;
}

export interface DetailEvaluationSectionProps {
  title: string;
  description: string;
  evaluationType: EvaluationType;
  initialItems: ThreadEvaluation[];
  initialTotal: number;
  initialPage?: number;
  relatedItems?: RelatedItem[];
  listEvaluations: (page: number, size: number) => Promise<PaginatedData<ThreadEvaluation>>;
  onCreateEvaluation?: (payload: Record<string, unknown>) => Promise<ThreadEvaluation | null>;
  onReply: (evaluationId: number, payload: EvaluationReplyInput) => Promise<EvaluationReply | null>;
}

export default function DetailEvaluationSection({
  title,
  description,
  evaluationType,
  initialItems,
  initialTotal,
  initialPage = 1,
  relatedItems = [],
  listEvaluations,
  onCreateEvaluation,
  onReply,
}: DetailEvaluationSectionProps) {
  const [items, setItems] = useState<ThreadEvaluation[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasFetchedMore, setHasFetchedMore] = useState(false);
  
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [draftMap, setDraftMap] = useState<Record<number, string>>({});
  const [targetMap, setTargetMap] = useState<Record<number, ReplyTarget>>({});
  
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [likeLoadingKey, setLikeLoadingKey] = useState<string | null>(null);
  const [reportingKey, setReportingKey] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);

  // Sync initials on mount if needed
  useEffect(() => {
    if (!initialized.current) {
        setItems(initialItems);
        setTotal(initialTotal);
        setPage(initialPage);
        initialized.current = true;
    }
  }, [initialItems, initialTotal, initialPage]);

  const hasMore = items.length < total || (!hasFetchedMore && total === 0 && items.length === 0);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || isLoadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, page]);

  const fetchMore = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const res = await listEvaluations(nextPage, 10);
      setItems((prev) => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = res.items.filter(i => !existingIds.has(i.id));
        return [...prev, ...newItems];
      });
      setTotal(res.total);
      setPage(nextPage);
      setHasFetchedMore(true);
    } catch (err) {
      feedback.showToast({
        title: "加载失败",
        description: "未能加载更多评价",
        type: "error"
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleExpand = (id: number) => {
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!expandedMap[id]) {
      setTargetMap((prev) => ({ ...prev, [id]: {} }));
    }
  };

  const handleReplySubmit = async (evaluationId: number) => {
    const content = draftMap[evaluationId]?.trim();
    if (!content) {
      feedback.showToast({ title: "评论不能为空", type: "warning" });
      return;
    }

    try {
      setSubmittingId(evaluationId);
      const target = targetMap[evaluationId] || {};
      
      const reply = await onReply(evaluationId, {
        content,
        reply_to_reply_id: target.replyId ?? null,
        reply_to_user_id: target.userId ?? null,
      });

      if (!reply) return;

      setItems((prev) =>
        prev.map((item) => {
          if (item.id === evaluationId) {
            return {
              ...item,
              replies: [...(item.replies || []), reply],
              reply_count: (item.reply_count || 0) + 1,
            };
          }
          return item;
        })
      );
      setDraftMap((prev) => ({ ...prev, [evaluationId]: "" }));
      setTargetMap((prev) => ({ ...prev, [evaluationId]: {} }));
      
      feedback.showToast({ title: "回复成功", type: "success" });
    } catch {
      feedback.showToast({ title: "回复失败", description: "网络错误", type: "error" });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleToggleLike = async (itemType: "teacher_evaluation" | "course_evaluation" | "comment", id: number, currentLiked: boolean) => {
    const key = `${itemType}-${id}`;
    if (likeLoadingKey) return;
    setLikeLoadingKey(key);

    try {
      if (currentLiked) {
        await removeLike(itemType, id);
      } else {
        await addLike(itemType, id);
      }

      setItems((prev) => {
        return prev.map((item) => {
           if (itemType !== "comment" && item.id === id) {
               return { ...item, is_liked: !currentLiked, likes: (item.likes || 0) + (currentLiked ? -1 : 1) };
           }
           if (itemType === "comment" && item.replies) {
               return {
                   ...item,
                   replies: item.replies.map(r => r.id === id ? { ...r, is_liked: !currentLiked, likes: (r.likes || 0) + (currentLiked ? -1 : 1) } : r)
               };
           }
           return item;
        });
      });
    } catch {
        feedback.showToast({ title: "操作失败", type: "error"});
    } finally {
        setLikeLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        {onCreateEvaluation && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            发表评价
          </button>
        )}
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                   {item.user?.avatar_url ? (
                     <img src={item.user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                   ) : (
                     <div className="flex h-full items-center justify-center text-gray-400">?</div>
                   )}
                 </div>
                 <div>
                   <div className="font-medium text-gray-900">
                     {item.is_anonymous ? "匿名用户" : item.user?.nickname || "未知用户"}
                   </div>
                   <div className="text-xs text-gray-500">
                     {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                   </div>
                 </div>
               </div>
               
               <div className="flex items-center gap-1 opacity-70">
                 <StarRating rating={item.avg_rating || 0} />
                 <span className="text-sm font-medium ml-2">{item.avg_rating?.toFixed(1) || "5.0"}</span>
               </div>
            </div>
            
            {(item.rating_quality || item.rating_homework || item.course_name || ('teacher_name' in item && item.teacher_name)) && (
               <div className="mt-3 flex flex-wrap gap-2 text-xs">
                 {('course_name' in item && item.course_name) && (
                   <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">相关课程: {item.course_name}</span>
                 )}
                 {('teacher_name' in item && item.teacher_name) && (
                   <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">相关教师: {item.teacher_name}</span>
                 )}
               </div>
            )}

            <div className="mt-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {item.comment || "该用户没有留下文字评价。"}
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <button 
                onClick={() => handleToggleLike(evaluationType === "teacher" ? "teacher_evaluation" : "course_evaluation", item.id, !!item.is_liked)}
                className={`flex items-center gap-1.5 transition ${item.is_liked ? "text-red-500" : "hover:text-gray-900"}`}
              >
                <svg className="h-4 w-4" fill={item.is_liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {item.likes || 0}
              </button>
              
              <button 
                onClick={() => handleToggleExpand(item.id)}
                className="flex items-center gap-1.5 transition hover:text-gray-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {item.replies?.length ? `${item.replies.length} 条回复` : "回复"}
              </button>
            </div>

            {/* Replies Section */}
            {expandedMap[item.id] && (
              <div className="mt-4 rounded-xl bg-gray-50/80 p-4">
                {item.replies?.length ? (
                  <div className="space-y-4 mb-4">
                    {item.replies.map(reply => (
                      <div key={reply.id} className="text-sm">
                        <div className="flex items-center gap-2">
                           <span className="font-medium text-gray-900">{reply.user?.nickname}</span>
                           {reply.reply_to_user && (
                               <span className="text-gray-400">回复 <span className="text-gray-700">@{reply.reply_to_user.nickname}</span></span>
                           )}
                           <span className="text-xs text-gray-400 ml-auto">{reply.created_at ? new Date(reply.created_at).toLocaleDateString() : ""}</span>
                        </div>
                        <div className="mt-1 text-gray-700">{reply.content}</div>
                        <div className="mt-1.5 flex gap-3 text-xs text-gray-500">
                           <button onClick={() => setTargetMap(prev => ({ ...prev, [item.id]: { replyId: reply.id, userId: reply.user.id, userName: reply.user.nickname } }))} className="hover:text-blue-600">回复</button>
                           <button onClick={() => handleToggleLike("comment", reply.id, !!reply.is_liked)} className={`hover:text-red-500 ${reply.is_liked ? 'text-red-500':''}`}>点赞 ({reply.likes || 0})</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  {targetMap[item.id]?.userName && (
                    <div className="flex items-center justify-between text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-max">
                      <span>回复 @{targetMap[item.id].userName}</span>
                      <button onClick={() => setTargetMap(prev => ({ ...prev, [item.id]: {} }))} className="ml-2 hover:text-blue-800">×</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                      placeholder="写下你的回复..."
                      value={draftMap[item.id] || ""}
                      onChange={(e) => setDraftMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReplySubmit(item.id);
                          }
                      }}
                    />
                    <button
                      disabled={submittingId === item.id}
                      onClick={() => handleReplySubmit(item.id)}
                      className="whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {submittingId === item.id ? "发送中" : "发送"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {!isLoadingMore && items.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            暂时还没有评价哦，来做第一个评价的人吧！
          </div>
        )}

        <div ref={loadMoreRef} className="py-4 text-center text-sm text-gray-500">
          {isLoadingMore && "努力加载中..."}
          {!hasMore && items.length > 0 && "没有更多评价了"}
        </div>
      </div>

      {onCreateEvaluation && (
          <EvaluationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            evaluationType={evaluationType}
            relatedItems={relatedItems}
            onSubmit={async (payload) => {
              const res = await onCreateEvaluation(payload);
              if (res) {
                 setItems(prev => [res, ...prev]);
                 setTotal(t => t + 1);
                 feedback.showToast({ title: "发布成功", type: "success" });
              }
            }}
          />
      )}
    </div>
  );
}
