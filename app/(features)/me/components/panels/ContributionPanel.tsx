"use client";

import { CONTRIBUTION_RULES } from "../shared/helpers";

export default function ContributionPanel() {
  return (
    <div className="space-y-2">
      {CONTRIBUTION_RULES.map((rule) => (
        <div key={rule.title} className="td-me-list-item">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{rule.title}</p>
              <p className="mt-0.5 text-sm leading-6 text-gray-600">
                {rule.detail}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-first">
              +{rule.score} 分
            </span>
          </div>
        </div>
      ))}
      <p className="td-me-hint pt-1">
        高质量的资源上传与课程评价是社区最宝贵的财富，也会带来更多贡献值。感谢你对中南星的建设与付出。
      </p>
    </div>
  );
}
