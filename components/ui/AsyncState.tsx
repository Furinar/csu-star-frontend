"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button, Empty, Loading } from "tdesign-react";
import {
  resolveAsyncEmptyType,
  type AsyncEmptyType,
} from "@/lib/requestError";

type Size = "small" | "medium" | "large";

const panelShellClassName =
  "flex w-full flex-col items-center justify-center rounded-2xl border border-gray-100/80 bg-white/80 px-4 py-8 text-center sm:rounded-3xl sm:px-6 sm:py-12";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function PageLoading({
  text = "加载中...",
  size = "medium",
  minHeight = true,
  className,
}: {
  text?: string;
  size?: Size;
  /** Keep a stable block height so lists don't collapse while loading. */
  minHeight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        panelShellClassName,
        minHeight && "min-h-[12rem] sm:min-h-[16rem]",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <Loading
        loading
        size={size}
        text={text}
        delay={80}
        showOverlay={false}
        inheritColor
      />
    </div>
  );
}

export function PageEmpty({
  type,
  title,
  description,
  onRetry,
  retryText = "重新加载",
  action,
  error,
  className,
  size = "medium",
}: {
  type?: AsyncEmptyType;
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryText?: string;
  /** Extra action (e.g. supplement prompt). Rendered after retry. */
  action?: ReactNode;
  /** Thrown error or message used to auto-pick network-error vs fail. */
  error?: unknown;
  className?: string;
  size?: Size;
}) {
  const resolvedType =
    type ??
    (error != null || (typeof description === "string" && description.trim())
      ? resolveAsyncEmptyType(error ?? description)
      : "empty");

  const defaultTitle =
    resolvedType === "network-error"
      ? "网络异常"
      : resolvedType === "fail"
        ? "加载失败"
        : "暂无内容";

  const defaultDescription =
    resolvedType === "network-error"
      ? "请检查网络后重试。"
      : resolvedType === "fail"
        ? "请稍后重试。"
        : "当前条件下没有可展示的内容。";

  const resolvedTitle = title ?? defaultTitle;
  const resolvedDescription =
    typeof description === "string" && description.trim()
      ? description
      : description ??
        (typeof error === "string" && error.trim() ? error : defaultDescription);

  const retryButton =
    onRetry != null ? (
      <Button
        theme="primary"
        size="medium"
        onClick={onRetry}
        className="!min-h-10 !min-w-[7.5rem] !px-5 sm:!w-auto"
        style={{ width: "100%", maxWidth: "16rem" }}
      >
        {retryText}
      </Button>
    ) : null;

  return (
    <div className={cn(panelShellClassName, "min-h-[12rem] sm:min-h-[16rem]", className)}>
      <Empty
        type={resolvedType}
        size={size}
        title={resolvedTitle}
        description={resolvedDescription}
        imageStyle={{ maxWidth: 160, width: "42vw", margin: "0 auto" }}
        action={
          retryButton || action ? (
            <div className="mt-1 flex w-full max-w-sm flex-col items-center gap-3">
              {retryButton}
              {action}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}

export function InlineErrorBar({
  message,
  onRetry,
  retryText = "重试",
  className,
}: {
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      role="alert"
    >
      <p className="min-w-0 break-words text-left leading-relaxed">{message}</p>
      {onRetry ? (
        <Button
          theme="default"
          variant="outline"
          size="medium"
          onClick={onRetry}
          className="!min-h-10 shrink-0 sm:!w-auto"
          style={{ width: "100%", maxWidth: "10rem" }}
        >
          {retryText}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadMoreStatus({
  loading,
  end,
  loadingText = "正在加载更多...",
  endText = "没有更多内容了",
  className,
}: {
  loading?: boolean;
  end?: boolean;
  loadingText?: string;
  endText?: string;
  className?: string;
}) {
  if (!loading && !end) return null;

  return (
    <div
      className={cn(
        "flex min-h-[3rem] items-center justify-center py-4 text-sm text-gray-500 md:min-h-[3.5rem] md:py-6",
        className,
      )}
      aria-live="polite"
    >
      {loading ? (
        <Loading
          loading
          size="small"
          text={loadingText}
          showOverlay={false}
          inheritColor
        />
      ) : (
        <span>{endText}</span>
      )}
    </div>
  );
}

/**
 * Compact floating pill for slow loads only.
 * `delayMs` avoids a one-frame flash when data is already cached / resolves quickly.
 */
export function FloatingLoadingPill({
  text = "加载中...",
  className,
  delayMs = 280,
}: {
  text?: string;
  className?: string;
  /** Wait before painting so fast paths never show the pill. */
  delayMs?: number;
}) {
  const [visible, setVisible] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) {
      setVisible(true);
      return;
    }
    setVisible(false);
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, text]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-24 z-[5] flex justify-center px-4",
        className,
      )}
    >
      <div className="rounded-full border border-gray-200/70 bg-white/85 px-4 py-2 text-sm text-gray-600 shadow-sm backdrop-blur-sm">
        <Loading
          loading
          size="small"
          text={text}
          showOverlay={false}
          inheritColor
        />
      </div>
    </div>
  );
}
