"use client";

import React from "react";
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
}: BilibiliReplyItemProps) {
  const displayUser = user || { nickname: "匿名用户", avatar_url: DEFAULT_AVATAR };
  return (
    <div className="flex gap-3 py-2 group/reply">
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
            <span className="font-medium text-gray-500 cursor-pointer hover:text-emerald-600 transition-colors mr-1.5">
              {displayUser.nickname}
            </span>
            {replyToUser && (
              <span className="text-gray-400 text-[12px] mr-1.5">
                回复{" "}
                <span className="text-emerald-600 cursor-pointer hover:underline">
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
            className={`flex items-center gap-1 hover:text-emerald-600 transition-colors ${isLiked ? "text-emerald-600" : ""}`}
            onClick={() => onLike?.(!isLiked)}
          >
            <i className="uil uil-thumbs-up text-[14px]"></i>
            <span>{likes || ""}</span>
          </button>

          <button
            className="hover:text-emerald-600 transition-colors"
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
