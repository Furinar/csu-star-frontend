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
        你的每一次真诚分享都会点亮贡献图中的星光。高质量的资源上传与课程评价是社区最宝贵的财富，因此也会为你带来更多贡献值。感谢你对中南星的建设与付出！
      </p>
    </div>
  );
}
