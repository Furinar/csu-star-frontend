"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { UserBrief } from "@/types/detail";
import { formatDateTimeZh } from "@/lib/date";
import { avatarOptions } from "@/data/avatar";
import ItemActionMenu, { ItemActionMenuItem } from "./ItemActionMenu";

const DEFAULT_AVATAR = avatarOptions[0]?.url ?? "";

export interface BilibiliReplyItemProps {
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
  shouldFlash?: boolean;
}

export default function BilibiliReplyItem({
  user,
  replyToUser,
  content,
  createdAt,
  likes = 0,
  isLiked = false,
  onLike,
  onReplyClick,
  actions = [],
  avatarActions = [],
  shouldFlash = false,
}: BilibiliReplyItemProps) {
  const displayUser = user || { nickname: "匿名用户", avatar_url: DEFAULT_AVATAR };
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (!shouldFlash) {
      const resetTimer = window.setTimeout(() => setIsFlashing(false), 0);
      return () => window.clearTimeout(resetTimer);
    }

    const timers = [
      window.setTimeout(() => setIsFlashing(true), 0),
      window.setTimeout(() => setIsFlashing(false), 220),
      window.setTimeout(() => setIsFlashing(true), 440),
      window.setTimeout(() => setIsFlashing(false), 660),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setIsFlashing(false);
    };
  }, [shouldFlash]);

  return (
    <div
      className="group/reply flex gap-2 rounded-xl px-1.5 py-1.5 transition-colors duration-200 md:gap-3 md:px-2 md:py-2"
      style={{ backgroundColor: isFlashing ? "var(--page-accent-soft-strong)" : "transparent" }}
    >
      {/* Avatar */}
      <div className="shrink-0 flex-none self-start mt-0.5">
        {avatarActions.length > 0 ? (
          <ItemActionMenu
            items={avatarActions}
            align="left"
            triggerClassName="block rounded-full"
            trigger={
              <div className="relative h-5 w-5 cursor-pointer overflow-hidden rounded-full border border-gray-100 bg-gray-50 md:h-6 md:w-6">
                <Image
                  src={displayUser.avatar_url || DEFAULT_AVATAR}
                  alt={displayUser.nickname}
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) 20px, 24px"
                  unoptimized
                />
              </div>
            }
          />
        ) : (
          <div className="relative h-5 w-5 overflow-hidden rounded-full border border-gray-100 bg-gray-50 md:h-6 md:w-6">
            <Image
              src={displayUser.avatar_url || DEFAULT_AVATAR}
              alt={displayUser.nickname}
              fill
              className="object-cover"
              sizes="(max-width: 767px) 20px, 24px"
              unoptimized
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 text-[12px] leading-5 md:text-[13.5px] md:leading-relaxed">
        <div className="flex flex-col gap-0.5">
          <div className="mb-0.5 flex flex-wrap items-center text-[11px] leading-normal md:text-[12.5px]">
            <span className="mr-1 cursor-pointer font-medium text-gray-500 transition-colors hover:text-[var(--page-accent-text)] md:mr-1.5">
              {displayUser.nickname}
            </span>
            {replyToUser && (
              <span className="mr-1 text-[10px] text-gray-400 md:mr-1.5 md:text-[12px]">
                回复{" "}
                <span className="cursor-pointer text-[var(--page-at-color)] hover:underline">
                  @{replyToUser.nickname}
                </span>{" "}
                :
              </span>
            )}
          </div>
          <span className="break-words text-[12px] text-gray-800 md:text-[13.5px]">{content}</span>
        </div>

        {/* Footer Actions */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400 md:gap-4 md:text-[12px]">
          <span>{formatDateTimeZh(createdAt)}</span>

          <button
            type="button"
            className={`flex items-center gap-1 transition-colors hover:text-[var(--page-like-color)] ${isLiked ? "text-[var(--page-like-color)]" : ""}`}
            onClick={() => onLike?.(Boolean(isLiked))}
          >
            <i className="uil uil-thumbs-up text-[12px] md:text-[14px]"></i>
            <span>{likes || ""}</span>
          </button>

          <button
            type="button"
            className="transition-colors hover:text-[var(--page-accent-text)]"
            onClick={onReplyClick}
          >
            回复
          </button>
          {actions.length > 0 ? <ItemActionMenu items={actions} /> : null}
        </div>
      </div>
    </div>
  );
}
