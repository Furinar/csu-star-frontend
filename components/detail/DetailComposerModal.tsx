"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import FloatingCloseButton from "@/components/ui/FloatingCloseButton";

const toneMap = {
  course: {
    badge:
      "border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[var(--page-accent-text)]",
    ring: "shadow-[0_32px_120px_var(--page-accent-soft-strong)]",
  },
  teacher: {
    badge:
      "border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[var(--page-accent-text)]",
    ring: "shadow-[0_32px_120px_var(--page-accent-soft-strong)]",
  },
  resource: {
    badge:
      "border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[var(--page-accent-text)]",
    ring: "shadow-[0_32px_120px_var(--page-accent-soft-strong)]",
  },
} as const;

export default function DetailComposerModal({
  isOpen,
  onClose,
  accent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  badge,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  title,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  description,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  accent: keyof typeof toneMap;
  badge: ReactNode;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
}) {
  const tone = toneMap[accent];

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1150] bg-slate-950/30 backdrop-blur-md">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="关闭表单弹层"
      />
      <div className="flex min-h-full items-end justify-center p-2 pb-safe sm:p-3 md:items-center md:p-6">
        <div
          className={`relative flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white sm:max-h-[calc(100dvh-1.5rem)] md:max-h-[calc(100dvh-3rem)] md:rounded-[28px] ${tone.ring}`}
        >
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-white blur-3xl opacity-50" />
          <FloatingCloseButton onClick={onClose} ariaLabel="关闭表单弹层" />
          <div className="modal-scrollbar relative z-10 w-full overflow-y-auto px-4 pb-4 pt-14 sm:px-5 sm:pb-5 sm:pt-16 md:px-8 md:pb-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
