"use client";

import { useEffect, useState } from "react";
import { Button, Textarea } from "tdesign-react";
import TDesignFloatingShell from "@/components/ui/TDesignFloatingShell";

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
    <TDesignFloatingShell
      open={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={title}
      description={description}
      preventClose={isSubmitting}
      zIndex={1100}
      maxWidth="42rem"
      className="td-comment-composer-modal"
    >
      <div className="space-y-4">
        <div className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          资源评论
        </div>

        <Textarea
          value={content}
          onChange={(value) => setContent(String(value ?? ""))}
          placeholder={placeholder}
          autosize={{ minRows: 7, maxRows: 14 }}
          disabled={isSubmitting}
          className="w-full"
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="outline"
            theme="default"
            onClick={onClose}
            disabled={isSubmitting}
            block
            className="sm:!w-auto"
          >
            取消
          </Button>
          <Button
            theme="primary"
            onClick={() => void handleSubmit()}
            disabled={!content.trim() || isSubmitting}
            loading={isSubmitting}
            block
            className="sm:!w-auto"
          >
            {isSubmitting ? "提交中..." : submitLabel}
          </Button>
        </div>
      </div>
    </TDesignFloatingShell>
  );
}
