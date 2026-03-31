"use client";

import GlassCard from "@/components/ui/GlassCard";
import type {PaginatedData, ResourceItem} from "@/types/me";
import {
  formatDateTime,
  formatNumber,
  getResourceTypeLabel,
} from "./shared/helpers";

interface MeResourcesProps {
  resources: PaginatedData<ResourceItem>;
}

export default function MeResources({resources}: MeResourcesProps) {
  const items = resources.items ?? [];

  return (
      <div className="space-y-4">
        {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                  <GlassCard key={item.id} className="p-5">
                    <div
                        className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          上传于 {formatDateTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <StatPill
                          label="类型"
                          value={getResourceTypeLabel(item.resource_type)}
                      />
                      <StatPill
                          label="下载"
                          value={formatNumber(item.downloads)}
                      />
                      <StatPill
                          label="浏览"
                          value={formatNumber(item.views)}
                      />
                      <StatPill
                          label="点赞"
                          value={formatNumber(item.likes)}
                      />
                      <StatPill
                          label="热度"
                          value={`${item.hot_score ?? 0}`}
                      />
                    </div>
                  </GlassCard>
              ))}
            </div>
        ) : (
            <SectionEmptyState
                title="暂无上传资源"
                description="你上传的资源会显示在这里。"
            />
        )}
      </div>
  );
}

function StatPill({label, value}: { label: string; value: string }) {
  return (
      <div className="rounded-full border border-gray-200/70 bg-white/55 px-3 py-1.5 text-xs text-gray-600">
        <span className="mr-2 text-gray-400">{label}</span>
        <span className="font-medium text-gray-800">{value}</span>
      </div>
  );
}

function SectionEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
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
