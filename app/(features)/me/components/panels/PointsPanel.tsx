"use client";

import type { PointsRecord } from "@/types/me";
import {
  formatDateTime,
  formatNumber,
  getPointsReasonLabel,
} from "../shared/helpers";

export default function PointsPanel({ points }: { points: PointsRecord[] }) {
  if (points.length === 0) {
    return (
      <div className="td-me-empty">
        还没有积分流水。签到、上传资源和邀请好友后会自动产生记录。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {points.map((item) => (
        <div key={item.id} className="td-me-list-item">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">
                {getPointsReasonLabel(item.reason)}
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                {formatDateTime(item.created_at)}
              </p>
            </div>
            <div className="sm:text-right">
              <p
                className={`text-base font-semibold ${
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
        </div>
      ))}
    </div>
  );
}
