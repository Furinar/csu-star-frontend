"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { feedback, useFeedbackStore } from "@/store/useFeedbackStore";
import type { FeedbackToast, FeedbackTone } from "@/types/feedback";

type ToneConfig = {
  label: string;
  badgeClassName: string;
  iconWrapClassName: string;
  iconClassName: string;
  railClassName: string;
  actionClassName: string;
  progressTrackClassName: string;
  progressFillClassName: string;
};

const TONE_CONFIG: Record<FeedbackTone, ToneConfig> = {
  success: {
    label: "SUCCESS",
    badgeClassName:
      "border-emerald-200/80 bg-emerald-50/90 text-emerald-700",
    iconWrapClassName:
      "bg-gradient-to-br from-emerald-400 via-sky-400 to-cyan-500",
    iconClassName: "text-white",
    railClassName: "from-emerald-400 via-sky-400 to-cyan-500",
    actionClassName:
      "bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:from-emerald-600 hover:to-sky-600",
    progressTrackClassName: "bg-emerald-100/90",
    progressFillClassName: "bg-gradient-to-r from-emerald-400 to-sky-500",
  },
  error: {
    label: "ERROR",
    badgeClassName: "border-rose-200/80 bg-rose-50/90 text-rose-700",
    iconWrapClassName:
      "bg-gradient-to-br from-rose-500 via-orange-400 to-amber-400",
    iconClassName: "text-white",
    railClassName: "from-rose-500 via-orange-400 to-amber-400",
    actionClassName:
      "bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600",
    progressTrackClassName: "bg-rose-100/90",
    progressFillClassName: "bg-gradient-to-r from-rose-500 to-orange-400",
  },
  info: {
    label: "INFO",
    badgeClassName:
      "border-sky-200/80 bg-sky-50/90 text-sky-700",
    iconWrapClassName:
      "bg-gradient-to-br from-[var(--ice-500)] via-sky-500 to-[var(--star-500)]",
    iconClassName: "text-white",
    railClassName: "from-[var(--ice-500)] via-sky-500 to-[var(--star-500)]",
    actionClassName:
      "bg-gradient-to-r from-[var(--ice-500)] to-[var(--star-500)] text-white hover:brightness-110",
    progressTrackClassName: "bg-sky-100/90",
    progressFillClassName:
      "bg-gradient-to-r from-[var(--ice-500)] to-[var(--star-500)]",
  },
  warning: {
    label: "WARNING",
    badgeClassName:
      "border-amber-200/80 bg-amber-50/90 text-amber-700",
    iconWrapClassName:
      "bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500",
    iconClassName: "text-white",
    railClassName: "from-amber-400 via-orange-400 to-yellow-500",
    actionClassName:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600",
    progressTrackClassName: "bg-amber-100/90",
    progressFillClassName: "bg-gradient-to-r from-amber-400 to-orange-500",
  },
};

export default function FeedbackToaster() {
  const toasts = useFeedbackStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[1100] sm:left-auto sm:right-5 sm:w-96 md:top-6 md:right-6">
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
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
      initial={{ opacity: 0, x: 120, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 120, scale: 0.94 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 30,
        mass: 0.9,
      }}
      className="pointer-events-auto relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(240,249,255,0.92))] shadow-[0_20px_60px_rgba(6,14,26,0.18)] backdrop-blur-2xl"
    >
      <div
        className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${tone.railClassName}`}
      />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.14),transparent_70%)]" />

      <div className="relative flex gap-3 p-4">
        <div
          className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_14px_30px_rgba(15,23,42,0.12)] ${tone.iconWrapClassName}`}
        >
          <ToastIcon type={toast.type} className={tone.iconClassName} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] ${tone.badgeClassName}`}
              >
                {tone.label}
              </span>

              <p className="mt-2 text-sm font-semibold text-[var(--abyss-900)]">
                {toast.title}
              </p>

              {toast.description ? (
                <p className="mt-1 text-[13px] leading-5 text-[var(--ice-800)]/90">
                  {toast.description}
                </p>
              ) : null}

              {toast.actionLabel && toast.onAction ? (
                <button
                  type="button"
                  className={`mt-3 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold shadow-[0_10px_24px_rgba(14,165,233,0.18)] transition-transform duration-200 hover:-translate-y-0.5 ${tone.actionClassName}`}
                  onClick={() => {
                    toast.onAction?.();
                    feedback.dismiss(toast.id);
                  }}
                >
                  {toast.actionLabel}
                </button>
              ) : null}
            </div>

            <button
              type="button"
              aria-label="关闭通知"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ice-700)] transition-colors duration-200 hover:bg-white/70 hover:text-[var(--abyss-900)]"
              onClick={() => feedback.dismiss(toast.id)}
            >
              <CloseIcon />
            </button>
          </div>

          {toast.duration > 0 ? (
            <div
              className={`mt-4 h-1 overflow-hidden rounded-full ${tone.progressTrackClassName}`}
            >
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: toast.duration / 1000, ease: "linear" }}
                className={`h-full origin-left rounded-full ${tone.progressFillClassName}`}
              />
            </div>
          ) : null}
        </div>
      </div>
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
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2"
        />
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
