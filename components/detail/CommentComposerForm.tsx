"use client";

import { useState } from "react";

export default function CommentComposerForm({
  submitLabel = "发布评论",
  placeholder = "写下你的看法、补充或问题。",
  onSubmit,
}: {
  submitLabel?: string;
  placeholder?: string;
  onSubmit: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(trimmed);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] p-5">
        <div className="text-sm font-medium text-[var(--page-accent-text)]">说点有用的</div>
        <p className="mt-1 text-sm text-slate-500">
          推荐写清楚资料质量、适用场景、内容缺失或文件问题。
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <textarea
          rows={12}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={placeholder}
          className="w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-[var(--page-accent-border)] focus:bg-white"
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="rounded-full bg-[image:var(--page-accent-gradient)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "提交中..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
