"use client";

import GlassCard from "@/components/ui/GlassCard";
import type {DownloadRecord} from "@/types/me";
import {formatDateTime, getResourceTypeLabel} from "../shared/helpers";

function SectionEmptyState({title, description}: { title: string; description: string }) {
  return (
      <GlassCard className="border-dashed p-12 text-center">
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
    return <SectionEmptyState title="下载记录加载中..." description="请稍候。"/>;
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
        {downloads.map((item) => (
            <GlassCard key={item.id} className="border border-white/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {item.resource.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>{getResourceTypeLabel(item.resource.resource_type)}</p>
                  <p>消耗 1 积分</p>
                </div>
              </div>
            </GlassCard>
        ))}
      </div>
  );
}
