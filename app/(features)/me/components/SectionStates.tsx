"use client";

import {
  InlineErrorBar,
  PageEmpty,
  PageLoading,
} from "@/components/ui/AsyncState";

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
      <span className="mr-1.5 text-slate-400">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function SectionLoadingState({ label }: { label: string }) {
  return <PageLoading text={label} />;
}

export function InlineRetryState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return <InlineErrorBar message={message} onRetry={onRetry} retryText="重新加载" />;
}

export function SectionEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PageEmpty
      type="empty"
      title={title}
      description={description}
    />
  );
}

export function GuestTabState({
  title = "登录后查看个人内容",
  description = "登录后即可查看你的资源、收藏和评价记录。",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <PageEmpty
      type="empty"
      title={title}
      description={description}
    />
  );
}
