"use client";

import { Tag } from "tdesign-react";

interface CompassStatsProps {
  guideCount: number;
  collegeCount: number;
  majorCount: number;
}

export default function CompassStats({
  guideCount,
  collegeCount,
  majorCount,
}: CompassStatsProps) {
  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Tag theme="primary" variant="light" shape="round">
          {guideCount} 篇指南
        </Tag>
        <Tag theme="primary" variant="light" shape="round">
          {collegeCount} 个学院
        </Tag>
        <Tag theme="primary" variant="light" shape="round">
          {majorCount} 个专业
        </Tag>
      </div>
      <nav
        className="flex flex-wrap items-center justify-center gap-3 text-sm"
        aria-label="页面分区"
      >
        <a
          href="#compass-guides"
          className="font-medium text-[var(--page-accent-text)] transition hover:opacity-80"
        >
          入坑指南
        </a>
        <span className="text-gray-300" aria-hidden>
          |
        </span>
        <a
          href="#compass-majors"
          className="font-medium text-[var(--page-accent-text)] transition hover:opacity-80"
        >
          专业指北
        </a>
      </nav>
    </div>
  );
}
