"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

const toneMap = {
  course: {
    badge: "border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[var(--page-accent-text)]",
    ring: "shadow-[0_32px_120px_var(--page-accent-soft-strong)]",
  },
  teacher: {
    badge: "border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[var(--page-accent-text)]",
    ring: "shadow-[0_32px_120px_var(--page-accent-soft-strong)]",
  },
  resource: {
    badge: "border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] text-[var(--page-accent-text)]",
    ring: "shadow-[0_32px_120px_var(--page-accent-soft-strong)]",
  },
} as const;

export default function DetailComposerModal({
  isOpen,
  onClose,
  accent,
  badge,
  title,
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
    <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md">
      <div
        className={`relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white ${tone.ring}`}
      >
        <div className="modal-scrollbar max-h-[90vh] overflow-y-auto p-6 md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-4">
              <div
                className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${tone.badge}`}
              >
                {badge}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 md:text-3xl">
                  {title}
                </h3>
                <p className="max-w-xl text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/75 text-lg text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800"
            >
              ×
            </button>
          </div>

          <div className="relative z-10 mt-8 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.05)] md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
