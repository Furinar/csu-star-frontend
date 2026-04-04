"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

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
    <div className="fixed inset-0 z-[1150] overflow-y-auto bg-slate-950/30 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center p-4 md:p-6 pb-safe">
        <div
          className={`relative w-full max-w-4xl flex flex-col rounded-[24px] border border-slate-200/80 bg-white p-6 md:p-8 ${tone.ring}`}
        >
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-white blur-3xl opacity-50" />

        
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/75 text-lg text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
        >
          ×
        </button>

        <div className="relative z-10 w-full pt-4">
          {children}
        </div>
      </div>
     </div>
    </div>
  );
}
