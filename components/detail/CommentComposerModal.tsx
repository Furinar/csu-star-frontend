"use client";

import { useEffect, useState } from "react";

interface CommentComposerModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  submitLabel?: string;
  placeholder?: string;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
}

export default function CommentComposerModal({
  isOpen,
  title,
  description,
  submitLabel = "发布评论",
  placeholder = "写下你的评论...",
  onClose,
  onSubmit,
}: CommentComposerModalProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
              资源评论
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-lg text-slate-500 shadow-sm transition hover:text-slate-800"
          >
            ×
          </button>
        </div>

        <textarea
          rows={7}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={placeholder}
          className="mt-6 w-full resize-none rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-emerald-300"
        />

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {isSubmitting ? "提交中..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
