"use client";

import GlassCard from "@/components/ui/GlassCard";
import type { PointsRecord } from "@/types/me";
import {
  formatDateTime,
  formatNumber,
  getPointsReasonLabel,
} from "../shared/helpers";

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

export default function PointsPanel({ points }: { points: PointsRecord[] }) {
  if (points.length === 0) {
    return (
      <SectionEmptyState
        title="还没有积分流水"
        description="签到、上传资源和邀请好友后会自动产生积分记录。"
      />
    );
  }

  return (
    <div className="space-y-3">
      {points.map((item) => (
        <GlassCard key={item.id} className="border border-white/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">
                {getPointsReasonLabel(item.reason)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {formatDateTime(item.created_at)}
              </p>
            </div>
            <div className="sm:text-right">
              <p
                className={`text-lg font-semibold ${
                  item.change_amount >= 0 ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                {item.change_amount >= 0 ? "+" : ""}
                {item.change_amount}
              </p>
              <p className="text-sm text-gray-500">
                余额 {formatNumber(item.balance_after)}
              </p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
