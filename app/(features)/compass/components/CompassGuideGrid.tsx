"use client";

import Link from "next/link";
import { Empty } from "tdesign-react";
import { buildWikiDocPath } from "@/lib/paths";
import type { WikiDocMeta } from "@/types/wiki";
import { getGuideIcon } from "./guideIcons";

interface CompassGuideGridProps {
  sectionKey: string;
  docs: WikiDocMeta[];
  isFiltering: boolean;
}

export default function CompassGuideGrid({
  sectionKey,
  docs,
  isFiltering,
}: CompassGuideGridProps) {
  if (docs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 px-4 py-10">
        <Empty
          title={isFiltering ? "没有匹配的指南" : "暂无指南"}
          description={
            isFiltering ? "试试其他关键词，或清空搜索" : "内容正在准备中"
          }
        />
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {docs.map((doc) => {
        const Icon = getGuideIcon(doc.slug, doc.title);
        return (
          <li key={doc.id}>
            <Link
              href={buildWikiDocPath(sectionKey, doc.slug)}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[var(--page-accent-border)] hover:bg-white/80 hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--page-accent-soft)] text-[var(--page-accent-text)] transition group-hover:bg-[var(--page-accent-soft-strong)]">
                <Icon size={20} />
              </span>
              <span className="line-clamp-2 text-sm font-semibold text-gray-800 sm:text-base">
                {doc.title}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
