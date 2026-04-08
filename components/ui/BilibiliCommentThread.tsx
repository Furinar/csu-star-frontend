"use client";

import React from "react";
import BilibiliCommentItem, {BilibiliCommentItemProps,} from "./BilibiliCommentItem";

export interface BilibiliCommentThreadProps {
  comments: BilibiliCommentItemProps[];
  totalCount?: number;
  title?: string;
}

export default function BilibiliCommentThread({
                                                comments,
                                                totalCount,
                                                title = "评论",
                                              }: BilibiliCommentThreadProps) {
  return (
      <div className="w-full">
        {totalCount !== undefined && (
            <div className="mb-6 flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {totalCount}
          </span>
            </div>
        )}

        <div className="flex flex-col">
          {comments.map((comment) => (
              <BilibiliCommentItem key={comment.id} {...comment} />
          ))}

          {comments.length === 0 && (
              <div className="py-20 text-center text-gray-400">
                <i className="uil uil-comment-dots text-4xl mb-2 block"></i>
                <p>暂无评论，快来抢沙发吧~</p>
              </div>
          )}
        </div>
      </div>
  );
}
