"use client";

import { searchEverything } from "@/api/search";
import SearchResultsGrid from "@/app/(features)/search/components/SearchResultsGrid";
import type { SearchResponse, SearchScope, SearchUnifiedItem } from "@/types/search";
import { useEffect, useMemo, useState } from "react";

type LandingScope = Exclude<SearchScope, "all">;

const DEFAULT_PAGE_SIZE = 6;

function createEmptyResults(): SearchResponse {
  return {
    resources: { total: 0, items: [] },
    courses: { total: 0, items: [] },
    teachers: { total: 0, items: [] },
    all: { total: 0, items: [] },
  };
}

function getScopedItems(results: SearchResponse, type: LandingScope): SearchUnifiedItem[] {
  if (type === "course") {
    return results.courses.items.map((item) => ({ type: "course" as const, item }));
  }

  if (type === "teacher") {
    return results.teachers.items.map((item) => ({ type: "teacher" as const, item }));
  }

  return results.resources.items.map((item) => ({ type: "resource" as const, item }));
}

function getScopedTotal(results: SearchResponse, type: LandingScope) {
  if (type === "course") return results.courses.total;
  if (type === "teacher") return results.teachers.total;
  return results.resources.total;
}

export default function SearchLandingSection({
  type,
  title,
  description,
  size = DEFAULT_PAGE_SIZE,
  className = "",
}: {
  type: LandingScope;
  title: string;
  description?: string;
  size?: number;
  className?: string;
}) {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    searchEverything({
      q: "",
      type,
      page: 1,
      size,
    })
      .then((data) => {
        if (!active) return;
        setResults(data);
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "列表加载失败，请稍后重试。";
        setError(message);
        setResults(createEmptyResults());
      });

    return () => {
      active = false;
    };
  }, [size, type]);

  const isLoading = results === null && error === null;
  const resolvedResults = results ?? createEmptyResults();
  const items = useMemo(() => getScopedItems(resolvedResults, type), [resolvedResults, type]);
  const total = useMemo(() => getScopedTotal(resolvedResults, type), [resolvedResults, type]);

  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {description ? (
            <p className="text-sm text-gray-500">{description}</p>
          ) : null}
        </div>
        {!isLoading && !error ? (
          <div className="text-sm text-gray-400">
            已展示 {items.length} / {total}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-gray-200 bg-white/70 py-10 text-gray-500">
          正在加载列表...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="flex items-center justify-center rounded-3xl border border-gray-200 bg-white/70 py-10 text-gray-500">
          暂无可展示内容
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <SearchResultsGrid items={items} />
      ) : null}
    </section>
  );
}
