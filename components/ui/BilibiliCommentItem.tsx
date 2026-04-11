"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {UserBrief} from "@/types/detail";
import {formatDateTimeZh} from "@/lib/date";
import BilibiliReplyItem from "./BilibiliReplyItem";
import {avatarOptions} from "@/data/avatar";
import type {ItemActionMenuItem} from "./ItemActionMenu";
import ItemActionMenu from "./ItemActionMenu";

const DEFAULT_AVATAR = avatarOptions[0]?.url ?? "";

export interface BilibiliCommentItemProps {
  id: string | number;
  user?: UserBrief | null;
  content: string;
  createdAt: string;
  likes?: number | null;
  isLiked?: boolean | null;
  isAnonymous?: boolean;
  replyCount?: number;

  // Custom slot for injecting the 6-dimension bar chart or course/teacher info
  headerSlot?: React.ReactNode;
  afterContentSlot?: React.ReactNode;

  replies?: Array<{
    id: string | number;
    user?: UserBrief | null;
    replyToUser?: UserBrief | null;
    content: string;
    createdAt: string;
    likes?: number | null;
    isLiked?: boolean | null;
    onLike?: (isLiked: boolean) => void;
    onReplyClick?: () => void;
    actions?: ItemActionMenuItem[];
    avatarActions?: ItemActionMenuItem[];
  }>;

  // Actions
  onLike?: (isLiked: boolean) => void;
  onReplyClick?: () => void;
  actions?: ItemActionMenuItem[];
  avatarActions?: ItemActionMenuItem[];

  // Reply Composer
  isReplying?: boolean;
  replyComposer?: React.ReactNode;
  forceShowAllReplies?: boolean;
  highlightedReplyId?: string | number | null;
  shouldFlash?: boolean;
}

export default function BilibiliCommentItem({
                                              user,
                                              content,
                                              createdAt,
                                              likes = 0,
                                              isLiked = false,
                                              isAnonymous,
                                              headerSlot,
                                              afterContentSlot,
                                              replies = [],
                                              onLike,
                                              onReplyClick,
                                              actions = [],
                                              avatarActions = [],
                                              isReplying,
                                              replyComposer,
                                              forceShowAllReplies = false,
                                              highlightedReplyId = null,
                                              shouldFlash = false,
                                            }: BilibiliCommentItemProps) {
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const replyComposerRef = useRef<HTMLDivElement | null>(null);
  const commentRef = useRef<HTMLDivElement | null>(null);

  const displayUser = isAnonymous
      ? {nickname: "匿名用户", avatar_url: DEFAULT_AVATAR}
      : user || {nickname: "未知用户", avatar_url: DEFAULT_AVATAR};

  const shouldShowAllReplies = forceShowAllReplies || showAllReplies;
  const displayedReplies = shouldShowAllReplies ? replies : replies.slice(0, 2);
  const hasMoreReplies = replies.length > 2;

  useEffect(() => {
    if (!isReplying || !replyComposerRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      replyComposerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isReplying, replyComposer]);

  useEffect(() => {
    if (!shouldFlash) {
      const resetTimer = window.setTimeout(() => setIsFlashing(false), 0);
      return () => window.clearTimeout(resetTimer);
    }

    const frame = window.requestAnimationFrame(() => {
      commentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    const timers = [
      window.setTimeout(() => setIsFlashing(true), 0),
      window.setTimeout(() => setIsFlashing(false), 220),
      window.setTimeout(() => setIsFlashing(true), 440),
      window.setTimeout(() => setIsFlashing(false), 660),
    ];

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      setIsFlashing(false);
    };
  }, [shouldFlash]);

  return (
      <div
          ref={commentRef}
          className="flex gap-2 rounded-xl border-b border-gray-100 px-1 py-3 transition-colors last:border-0 hover:bg-gray-50/50 md:gap-4 md:px-2 md:py-4"
          style={{ backgroundColor: isFlashing ? "var(--page-accent-soft-strong)" : "transparent" }}>
        {/* Avatar */}
        <div className="shrink-0 flex-none">
          {avatarActions.length > 0 ? (
            <ItemActionMenu
              items={avatarActions}
              align="left"
              triggerClassName="block rounded-full"
              trigger={
                <div className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gray-50 transition hover:border-gray-300 md:h-12 md:w-12">
                  <Image
                    src={displayUser.avatar_url || DEFAULT_AVATAR}
                    alt={displayUser.nickname}
                    fill
                    className="object-cover"
                    sizes="(max-width: 767px) 36px, 48px"
                    unoptimized
                  />
                </div>
              }
            />
          ) : (
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-200 bg-gray-50 md:h-12 md:w-12">
              <Image
                src={displayUser.avatar_url || DEFAULT_AVATAR}
                alt={displayUser.nickname}
                fill
                className="object-cover"
                sizes="(max-width: 767px) 36px, 48px"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pb-1">
          {/* User Info & Date */}
          <div className="mb-1 flex items-center gap-1.5 md:gap-2">
          <span
              className="cursor-pointer text-[13px] font-medium text-gray-800 transition-colors hover:text-[var(--page-accent-text)] md:text-[15px]">
            {displayUser.nickname}
          </span>
            {/* Optional Level or Badge could go here */}
          </div>

          {/* Content Box */}
          <div
              className="mb-2 text-[13px] leading-6 text-gray-800 md:text-[15px] md:leading-relaxed"
              style={{wordBreak: "break-word"}}
          >
            {headerSlot && <div className="mb-2 md:mb-3">{headerSlot}</div>}
            {content}
            {afterContentSlot && <div className="mt-2 md:mt-3">{afterContentSlot}</div>}
          </div>

          {/* Actions Footer */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-400 md:mt-2 md:gap-6 md:text-[13px]">
            <span className="text-gray-400">{formatDateTimeZh(createdAt)}</span>

            <button
                type="button"
                className={`flex items-center gap-1 transition-colors hover:text-[var(--page-like-color)] ${isLiked ? "text-[var(--page-like-color)]" : ""}`}
                onClick={() => onLike?.(Boolean(isLiked))}
            >
              <i
                  className={isLiked ? "uil uil-thumbs-up" : "uil uil-thumbs-up"}
              ></i>
              <span>{likes || ""}</span>
            </button>

            <button
                type="button"
                className="flex items-center gap-1 transition-colors hover:text-[var(--page-accent-text)]"
                onClick={onReplyClick}
            >
              <i className="uil uil-comment-alt-lines"></i>
              <span>回复</span>
            </button>

            {actions.length > 0 ? <div className="ml-auto"><ItemActionMenu items={actions}/></div> : null}
          </div>

          {/* Replies Section - Bilibili Style Box */}
          {(replies.length > 0 || isReplying) && (
              <div className="mt-2.5 rounded-xl bg-gray-50 p-2 text-[13px] sm:p-4 md:mt-3 md:text-[14px]">
                <div className="flex flex-col gap-1.5 md:gap-2">
                  {displayedReplies.map((reply) => (
                      <BilibiliReplyItem
                          key={reply.id}
                          id={reply.id}
                          user={reply.user}
                          replyToUser={reply.replyToUser}
                          content={reply.content}
                          createdAt={reply.createdAt}
                          likes={reply.likes}
                          isLiked={reply.isLiked}
                          onLike={reply.onLike}
                          onReplyClick={reply.onReplyClick}
                          actions={reply.actions}
                          avatarActions={reply.avatarActions}
                          shouldFlash={highlightedReplyId != null && String(highlightedReplyId) === String(reply.id)}
                      />
                  ))}
                </div>

                {hasMoreReplies && (
                    <div className="mt-2 text-[11px] md:text-[13px]">
                      <span className="text-gray-500">
                        共 {replies.length} 条回复，
                      </span>
                      <button
                        type="button"
                        className="font-medium text-[var(--page-accent-text)] transition hover:opacity-80"
                        onClick={() => setShowAllReplies((prev) => !prev)}
                      >
                        {shouldShowAllReplies ? "收起回复" : "点击查看"}
                      </button>
                    </div>
                )}

                {isReplying && (
                  <div ref={replyComposerRef} className="mt-2.5 md:mt-3">
                    {replyComposer}
                  </div>
                )}
              </div>
          )}
        </div>
      </div>
  );
}
