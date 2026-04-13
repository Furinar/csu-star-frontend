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
    <div className="pointer-events-none fixed inset-y-0 right-0 z-[1100] mt-17 flex w-[60vw] max-w-[60vw] flex-col items-end justify-start gap-2 pr-1 pt-3 sm:w-80 sm:max-w-none sm:gap-3 sm:pr-0 sm:pt-4 md:w-96">
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
  const isActionable = Boolean(toast.onAction);

  const handleAction = () => {
    if (!toast.onAction) {
      return;
    }

    toast.onAction();
    if (toast.dismissOnAction !== false) {
      feedback.dismiss(toast.id);
    }
  };

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
      onClick={isActionable ? handleAction : undefined}
      className={`pointer-events-auto relative w-full overflow-hidden shadow-lg ${
        isActionable ? "cursor-pointer" : ""
      } ${tone.backgroundClass}`}
    >
      <div className="flex gap-2.5 p-3 sm:gap-4 sm:p-5">
        <div className="mt-0.5 flex shrink-0 items-start">
          <ToastIcon
            type={toast.type}
            className={`h-4.5 w-4.5 sm:h-6 sm:w-6 ${tone.iconClass}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div>
              <p className="text-[12px] font-medium leading-tight sm:text-[15px]">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-0.5 text-[11px] leading-snug opacity-80 sm:mt-1.5 sm:text-sm">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              type="button"
              className="-m-1 shrink-0 rounded-sm p-0.5 opacity-50 transition-opacity hover:opacity-100 sm:p-1"
              onClick={(event) => {
                event.stopPropagation();
                feedback.dismiss(toast.id);
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              className="mt-1.5 cursor-pointer text-[11px] font-medium underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100 sm:mt-3 sm:text-sm"
              onClick={(event) => {
                event.stopPropagation();
                handleAction();
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
    <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3 sm:h-4 sm:w-4">
      <path
        d="M6 6L14 14M14 6L6 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
