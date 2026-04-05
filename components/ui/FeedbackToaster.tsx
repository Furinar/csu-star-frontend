"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { feedback, useFeedbackStore } from "@/store/useFeedbackStore";
import type { FeedbackToast, FeedbackTone } from "@/types/feedback";

type ToneConfig = {
  backgroundClass: string;
  iconClass: string;
  progressBarClass: string;
};

const TONE_CONFIG: Record<FeedbackTone, ToneConfig> = {
  success: {
    backgroundClass:
      "bg-gradient-to-r from-white to-emerald-50 text-emerald-900",
    iconClass: "text-emerald-500",
    progressBarClass: "bg-emerald-500",
  },
  error: {
    backgroundClass: "bg-gradient-to-r from-white to-rose-50 text-rose-900",
    iconClass: "text-rose-500",
    progressBarClass: "bg-rose-500",
  },
  info: {
    backgroundClass: "bg-gradient-to-r from-white to-blue-50 text-blue-900",
    iconClass: "text-blue-500",
    progressBarClass: "bg-blue-500",
  },
  warning: {
    backgroundClass: "bg-gradient-to-r from-white to-amber-50 text-amber-900",
    iconClass: "text-amber-500",
    progressBarClass: "bg-amber-500",
  },
};

export default function FeedbackToaster() {
  const toasts = useFeedbackStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-[1100] flex flex-col justify-start gap-3 p-0 w-full sm:w-80 md:w-96 pt-4 mt-17">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast }: { toast: FeedbackToast }) {
  const tone = TONE_CONFIG[toast.type];

  useEffect(() => {
    if (toast.duration <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      feedback.dismiss(toast.id);
    }, toast.duration);

    return () => window.clearTimeout(timer);
  }, [toast.duration, toast.id]);

  return (
    <motion.section
      layout
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{
        type: "tween",
        ease: [0.25, 1, 0.5, 1],
        duration: 0.4,
      }}
      className={`pointer-events-auto relative w-full overflow-hidden shadow-lg ${
        toast.onAction ? "cursor-pointer" : ""
      } ${tone.backgroundClass}`}
    >
      <div className="flex gap-4 p-5">
        <div className="flex shrink-0 items-start mt-0.5">
          <ToastIcon
            type={toast.type}
            className={`h-6 w-6 ${tone.iconClass}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-medium leading-tight">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-1.5 text-sm opacity-80 leading-snug">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              type="button"
              className="shrink-0 rounded-sm p-1 -m-1 opacity-50 hover:opacity-100 transition-opacity"
              onClick={() => feedback.dismiss(toast.id)}
            >
              <CloseIcon />
            </button>
          </div>

          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              className="mt-3 cursor-pointer text-sm font-medium underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
              onClick={() => {
                toast.onAction?.();
                feedback.dismiss(toast.id);
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      </div>

      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: toast.duration / 1000, ease: "linear" }}
            className={`h-full origin-left ${tone.progressBarClass}`}
          />
        </div>
      )}
    </motion.section>
  );
}

function ToastIcon({
  type,
  className,
}: {
  type: FeedbackTone;
  className?: string;
}) {
  if (type === "success") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`h-5 w-5 ${className ?? ""}`}
      >
        <path
          d="M5 12.5L9.5 17L19 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "error") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`h-5 w-5 ${className ?? ""}`}
      >
        <path
          d="M15 9L9 15M9 9L15 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "warning") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`h-5 w-5 ${className ?? ""}`}
      >
        <path
          d="M12 8V12.5M12 16H12.01M10.615 4.891L2.39 18.5A1 1 0 0 0 3.245 20H20.755A1 1 0 0 0 21.61 18.5L13.385 4.891A1 1 0 0 0 11.615 4.891Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-5 w-5 ${className ?? ""}`}
    >
      <path
        d="M12 8.5V12.5M12 16H12.01M12 21C16.971 21 21 16.971 21 12S16.971 3 12 3 3 7.029 3 12 7.029 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M6 6L14 14M14 6L6 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
