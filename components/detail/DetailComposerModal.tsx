"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

const toneMap = {
  course: {
    shell: "neo-outset",
    badge: "border-sky-200 neo-bg text-sky-700",
  },
  teacher: {
    shell: "neo-outset",
    badge: "border-rose-200 neo-bg text-rose-700",
  },
  resource: {
    shell: "neo-outset",
    badge: "border-emerald-200 neo-bg text-emerald-700",
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
        className={`relative max-h-[90vh] w-full max-w-4xl overflow-y-auto neo-outset p-6 ${tone.shell}`}
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
                <h3 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                  {title}
                </h3>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center neo-outset text-lg text-slate-500 transition hover:text-slate-800"
            >
              ×
            </button>
          </div>

          <div className="mt-8 neo-outset p-5 md:p-6 mb-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
