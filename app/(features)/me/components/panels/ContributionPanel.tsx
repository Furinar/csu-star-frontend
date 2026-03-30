"use client";

import GlassCard from "@/components/ui/GlassCard";
import { CONTRIBUTION_RULES } from "../shared/helpers";

export default function ContributionPanel() {
  return (
    <div className="space-y-3">
      {CONTRIBUTION_RULES.map((rule) => (
        <GlassCard key={rule.title} className="border border-white/50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-gray-900">{rule.title}</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {rule.detail}
              </p>
            </div>
            <span className="rounded-full border border-gray-200 bg-white/60 px-3 py-1 text-sm font-semibold text-first">
              +{rule.score} 分
            </span>
          </div>
        </GlassCard>
      ))}
      <p className="text-sm leading-6 text-gray-600">
        这套规则的核心是&quot;内容生产权重大于纯活跃&quot;。上传通过审核的资源与高质量评价会直接主导热力图颜色，签到与邀请作为辅助信号存在，但不会盖过真正能帮助他人的贡献。
      </p>
    </div>
  );
}
