"use client";

import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import { buildResourcePath } from "@/lib/paths";
import type { DownloadRecord } from "@/types/me";
import { formatDateTime, getResourceTypeLabel } from "../shared/helpers";

function SectionEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <GlassCard className="border-dashed p-8 text-center sm:p-12">
      <img
        src="/undraw_mcp-server_7kvc.svg"
        alt="空状态插画"
        className="mx-auto mb-4 h-24 w-auto opacity-90"
      />
      <h3 className="mb-2 text-xl font-medium text-gray-800">{title}</h3>
      <p className="mx-auto max-w-md text-gray-500">{description}</p>
    </GlassCard>
  );
}

export default function DownloadsPanel({
  downloads,
  isLoading,
}: {
  downloads: DownloadRecord[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <SectionEmptyState title="下载记录加载中..." description="请稍候。" />
    );
  }

  if (downloads.length === 0) {
    return (
      <SectionEmptyState
        title="暂无下载记录"
        description="下载过的资源会按时间倒序展示在这里。"
      />
    );
  }

  return (
    <div className="space-y-3">
      {downloads.map((item) => {
        const resourceTitle = item.resource?.title ?? "未知资源";
        const resourceType = item.resource?.resource_type;

        return (
          <Link
            key={item.id}
            href={buildResourcePath(item.resource.id)}
            className="block"
          >
            <GlassCard className="border border-white/50 p-4 transition-all hover:bg-white/60 hover:shadow-[0_12px_36px_0_rgba(31,38,135,0.18)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-medium text-gray-900">
                    {resourceTitle}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
                <div className="text-sm text-gray-600 sm:text-right">
                  <p>{getResourceTypeLabel(resourceType)}</p>
                  <p>消耗 1 积分</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        );
      })}
    </div>
  );
}
