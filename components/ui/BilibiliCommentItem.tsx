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
}

export default function BilibiliCommentItem({
                                              id,
                                              user,
                                              content,
                                              createdAt,
                                              likes = 0,
                                              isLiked = false,
                                              isAnonymous,
                                              replyCount = 0,
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
                                            }: BilibiliCommentItemProps) {
  const [showAllReplies, setShowAllReplies] = useState(false);
  const replyComposerRef = useRef<HTMLDivElement | null>(null);

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

  return (
      <div
          className="flex gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors px-2 rounded-xl">
        {/* Avatar */}
        <div className="shrink-0 flex-none">
          {avatarActions.length > 0 ? (
            <ItemActionMenu
              items={avatarActions}
              align="left"
              triggerClassName="block rounded-full"
              trigger={
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-gray-200 bg-gray-50 transition hover:border-gray-300">
                  <Image
                    src={displayUser.avatar_url || DEFAULT_AVATAR}
                    alt={displayUser.nickname}
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                  />
                </div>
              }
            />
          ) : (
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
              <Image
                src={displayUser.avatar_url || DEFAULT_AVATAR}
                alt={displayUser.nickname}
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pb-1">
          {/* User Info & Date */}
          <div className="flex items-center gap-2 mb-1">
          <span
              className="font-medium text-[15px] text-gray-800 cursor-pointer transition-colors hover:text-[var(--page-accent-text)]">
            {displayUser.nickname}
          </span>
            {/* Optional Level or Badge could go here */}
          </div>

          {/* Content Box */}
          <div
              className="text-[15px] text-gray-800 leading-relaxed mb-2"
              style={{wordBreak: "break-word"}}
          >
            {headerSlot && <div className="mb-3">{headerSlot}</div>}
            {content}
            {afterContentSlot && <div className="mt-3">{afterContentSlot}</div>}
          </div>

          {/* Actions Footer */}
          <div className="flex items-center gap-6 mt-2 text-[13px] text-gray-400">
            <span className="text-gray-400">{formatDateTimeZh(createdAt)}</span>

            <button
                className={`flex items-center gap-1 transition-colors hover:text-[var(--page-like-color)] ${isLiked ? "text-[var(--page-like-color)]" : ""}`}
                onClick={() => onLike?.(Boolean(isLiked))}
            >
              <i
                  className={isLiked ? "uil uil-thumbs-up" : "uil uil-thumbs-up"}
              ></i>
              <span>{likes || ""}</span>
            </button>

            <button
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
              <div className="mt-3 rounded-xl bg-gray-50 p-3 text-[14px] sm:p-4">
                <div className="flex flex-col gap-2">
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
                    <div className="mt-2 text-[13px]">
                      <span className="text-gray-500">
                        共 {replies.length} 条回复，
                      </span>
                      <button
                        className="font-medium text-[var(--page-accent-text)] transition hover:opacity-80"
                        onClick={() => setShowAllReplies((prev) => !prev)}
                      >
                        {shouldShowAllReplies ? "收起回复" : "点击查看"}
                      </button>
                    </div>
                )}

                {isReplying && (
                  <div ref={replyComposerRef} className="mt-3">
                    {replyComposer}
                  </div>
                )}
              </div>
          )}
        </div>
      </div>
  );
}
