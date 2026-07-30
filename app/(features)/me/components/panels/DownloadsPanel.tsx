"use client";

import Link from "next/link";
import { PageEmpty, PageLoading } from "@/components/ui/AsyncState";
import { buildResourcePath } from "@/lib/paths";
import type { DownloadRecord } from "@/types/me";
import { formatDateTime, getResourceTypeLabel } from "../shared/helpers";

export default function DownloadsPanel({
  downloads,
  isLoading,
}: {
  downloads: DownloadRecord[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <PageLoading
        text="下载记录加载中..."
        minHeight={false}
        className="min-h-[8rem] border-0 bg-transparent py-6 shadow-none"
      />
    );
  }

  if (downloads.length === 0) {
    return (
      <PageEmpty
        type="empty"
        title="暂无下载记录"
        description="下载过的资源会按时间倒序展示在这里。"
        className="min-h-[8rem] border-0 bg-transparent py-6 shadow-none"
        size="small"
      />
    );
  }

  return (
    <div className="space-y-2">
      {downloads.map((item) => {
        const resourceTitle = item.resource?.title ?? "未知资源";
        const resourceType = item.resource?.resource_type;

        return (
          <Link
            key={item.id}
            href={buildResourcePath(item.resource.id)}
            className="td-me-list-item block"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-medium text-gray-900">
                  {resourceTitle}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {formatDateTime(item.created_at)}
                </p>
              </div>
              <div className="text-sm text-gray-600 sm:text-right">
                <p>{getResourceTypeLabel(resourceType)}</p>
                <p>消耗 1 积分</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
