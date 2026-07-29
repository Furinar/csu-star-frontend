"use client";

import Link from "next/link";
import { Empty, Tag } from "tdesign-react";
import { getCollegeIcon } from "@/data/colleges";
import { buildWikiDocPath } from "@/lib/paths";
import type { WikiGroup } from "@/types/wiki";

interface CompassMajorPortalProps {
  sectionKey: string;
  categories: WikiGroup[];
  selectedCollegeId: string;
  onSelectCollege: (id: string) => void;
  isFiltering: boolean;
}

export default function CompassMajorPortal({
  sectionKey,
  categories,
  selectedCollegeId,
  onSelectCollege,
  isFiltering,
}: CompassMajorPortalProps) {
  const visibleCategories =
    selectedCollegeId === "all"
      ? categories
      : categories.filter((c) => c.id === selectedCollegeId);

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 px-4 py-10">
        <Empty
          title={isFiltering ? "没有匹配的专业或学院" : "暂无专业指北"}
          description={
            isFiltering ? "试试其他关键词，或清空搜索" : "内容正在准备中"
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        <Tag
          shape="round"
          variant={selectedCollegeId === "all" ? "dark" : "light"}
          theme="primary"
          className="shrink-0 cursor-pointer"
          onClick={() => onSelectCollege("all")}
        >
          全部
        </Tag>
        {categories.map((college) => {
          const active = selectedCollegeId === college.id;
          const count = college.docCount ?? college.docs.length;
          return (
            <Tag
              key={college.id}
              shape="round"
              variant={active ? "dark" : "light"}
              theme="primary"
              className="shrink-0 cursor-pointer"
              onClick={() => onSelectCollege(college.id)}
            >
              {college.name}
              {count > 0 ? ` · ${count}` : ""}
            </Tag>
          );
        })}
      </div>

      {visibleCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 px-4 py-10">
          <Empty title="该学院下暂无匹配专业" description="切换其他学院试试" />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.map((college) => {
            const count = college.docCount ?? college.docs.length;
            return (
              <li
                key={college.id}
                id={`college-${college.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/55 p-5 shadow-sm backdrop-blur-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2 border-b border-gray-100/80 pb-3">
                  <h3 className="flex min-w-0 items-center gap-2 text-base font-bold text-gray-900">
                    <i
                      className={`fa-solid ${getCollegeIcon(college.name)} shrink-0 text-lg text-[var(--page-accent-text)]`}
                      aria-hidden
                    />
                    <span className="truncate">{college.name}</span>
                  </h3>
                  <Tag size="small" variant="light" shape="round">
                    {count}
                  </Tag>
                </div>
                {college.docs.length === 0 ? (
                  <p className="text-sm text-gray-400">暂无专业文档</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {college.docs.map((doc) => (
                      <li key={doc.id}>
                        <Link
                          href={buildWikiDocPath(sectionKey, doc.slug)}
                          className="flex items-center gap-1 rounded-lg px-1 py-1 text-sm text-gray-600 transition hover:bg-[var(--page-accent-soft)] hover:text-[var(--page-accent-text)]"
                        >
                          <i className="uil uil-angle-right shrink-0 text-base opacity-60" />
                          <span className="truncate">{doc.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
