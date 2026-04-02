"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

const toneMap = {
  course: {
    shell: "border-slate-200 bg-white",
    badge: "border-sky-200 bg-white/90 text-sky-700",
  },
  teacher: {
    shell: "border-slate-200 bg-white",
    badge: "border-rose-200 bg-white/90 text-rose-700",
  },
  resource: {
    shell: "border-slate-200 bg-white",
    badge: "border-emerald-200 bg-white/90 text-emerald-700",
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
    <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div
        className={`relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[36px] border bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.18)] md:p-7 ${tone.shell}`}
      >
        <div className="absolute inset-[1px] rounded-[35px] border border-white/70" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4">
              <div className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${tone.badge}`}>
                {badge}
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h3>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/85 text-lg text-slate-500 shadow-sm transition hover:text-slate-800"
            >
              ×
            </button>
          </div>

          <div className="mt-6 rounded-[32px] border border-white/75 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
