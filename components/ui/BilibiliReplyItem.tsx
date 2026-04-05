"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { UserBrief } from "@/types/detail";
import { formatDateTimeZh } from "@/lib/date";
import { avatarOptions } from "@/data/avatar";
import ItemActionMenu, { ItemActionMenuItem } from "./ItemActionMenu";

const DEFAULT_AVATAR = avatarOptions[0].url;

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
  shouldFlash?: boolean;
}

export default function BilibiliReplyItem({
  id,
  user,
  replyToUser,
  content,
  createdAt,
  likes = 0,
  isLiked = false,
  onLike,
  onReplyClick,
  actions = [],
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
      className="group/reply flex gap-3 rounded-xl px-2 py-2 transition-colors duration-200"
      style={{ backgroundColor: isFlashing ? "var(--page-accent-soft-strong)" : "transparent" }}
    >
      {/* Avatar */}
      <div className="shrink-0 flex-none self-start mt-0.5">
        <div className="relative h-6 w-6 rounded-full overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer">
          <Image
            src={displayUser.avatar_url || DEFAULT_AVATAR}
            alt={displayUser.nickname}
            fill
            className="object-cover"
            sizes="24px"
            unoptimized
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-[13.5px] leading-relaxed">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center text-[12.5px] leading-normal mb-0.5">
            <span className="mr-1.5 cursor-pointer font-medium text-gray-500 transition-colors hover:text-[var(--page-accent-text)]">
              {displayUser.nickname}
            </span>
            {replyToUser && (
              <span className="text-gray-400 text-[12px] mr-1.5">
                回复{" "}
                <span className="cursor-pointer text-[var(--page-at-color)] hover:underline">
                  @{replyToUser.nickname}
                </span>{" "}
                :
              </span>
            )}
          </div>
          <span className="text-gray-800 break-words text-[13.5px]">{content}</span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-4 mt-1 text-[12px] text-gray-400">
          <span>{formatDateTimeZh(createdAt)}</span>

          <button
            className={`flex items-center gap-1 transition-colors hover:text-[var(--page-like-color)] ${isLiked ? "text-[var(--page-like-color)]" : ""}`}
            onClick={() => onLike?.(Boolean(isLiked))}
          >
            <i className="uil uil-thumbs-up text-[14px]"></i>
            <span>{likes || ""}</span>
          </button>

          <button
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
