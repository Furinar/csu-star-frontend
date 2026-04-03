"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

const toneMap = {
  course: {
    glow: "from-sky-100/90 via-white to-cyan-50/90",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    ring: "shadow-[0_32px_120px_rgba(14,116,144,0.14)]",
  },
  teacher: {
    glow: "from-rose-100/90 via-white to-orange-50/80",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    ring: "shadow-[0_32px_120px_rgba(190,24,93,0.14)]",
  },
  resource: {
    glow: "from-emerald-100/90 via-white to-teal-50/90",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    ring: "shadow-[0_32px_120px_rgba(5,150,105,0.14)]",
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
        className={`relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/70 bg-gradient-to-br ${tone.glow} p-6 md:p-8 ${tone.ring}`}
      >
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
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

          <div className="mt-8 rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
