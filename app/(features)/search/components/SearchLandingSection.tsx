"use client";

import { searchEverything } from "@/api/search";
import SearchResultsGrid from "@/app/(features)/search/components/SearchResultsGrid";
import type { SearchResponse, SearchScope, SearchUnifiedItem } from "@/types/search";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LandingScope = Exclude<SearchScope, "all">;

const DEFAULT_PAGE_SIZE = 24;

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

function mergeResults(previous: SearchResponse, next: SearchResponse, type: LandingScope): SearchResponse {
  if (type === "course") {
    const existingIds = new Set(previous.courses.items.map((item) => item.id));
    const mergedItems = [
      ...previous.courses.items,
      ...next.courses.items.filter((item) => !existingIds.has(item.id)),
    ];

    return {
      ...previous,
      courses: {
        ...next.courses,
        items: mergedItems,
      },
    };
  }

  if (type === "teacher") {
    const existingIds = new Set(previous.teachers.items.map((item) => item.id));
    const mergedItems = [
      ...previous.teachers.items,
      ...next.teachers.items.filter((item) => !existingIds.has(item.id)),
    ];

    return {
      ...previous,
      teachers: {
        ...next.teachers,
        items: mergedItems,
      },
    };
  }

  const existingIds = new Set(previous.resources.items.map((item) => item.course_id));
  const mergedItems = [
    ...previous.resources.items,
    ...next.resources.items.filter((item) => !existingIds.has(item.course_id)),
  ];

  return {
    ...previous,
    resources: {
      ...next.resources,
      items: mergedItems,
    },
  };
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
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async ({
    page: nextPage,
    append,
  }: {
    page: number;
    append: boolean;
  }) => {
    const currentRequestId = append ? requestIdRef.current : requestIdRef.current + 1;

    if (!append) {
      requestIdRef.current = currentRequestId;
      setError(null);
      setResults(null);
      setPage(1);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await searchEverything({
        q: "",
        type,
        page: nextPage,
        size,
      });

      if (requestIdRef.current !== currentRequestId) return;

      setResults((previous) =>
        append && previous ? mergeResults(previous, data, type) : data,
      );
      setPage(nextPage);
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;

      const message =
        err instanceof Error ? err.message : "列表加载失败，请稍后重试。";
      setError(message);
      setResults((previous) => previous ?? createEmptyResults());
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setIsLoadingMore(false);
      }
    }
  }, [size, type]);

  useEffect(() => {
    void loadPage({ page: 1, append: false });
  }, [loadPage]);

  const isLoading = results === null && error === null;
  const resolvedResults = results ?? createEmptyResults();
  const items = useMemo(() => getScopedItems(resolvedResults, type), [resolvedResults, type]);
  const total = useMemo(() => getScopedTotal(resolvedResults, type), [resolvedResults, type]);
  const hasMore = items.length < total;

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || isLoading || isLoadingMore || error || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        void loadPage({ page: page + 1, append: true });
      },
      { rootMargin: "280px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [error, hasMore, isLoading, isLoadingMore, loadPage, page]);

  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {description ? (
            <p className="text-sm text-gray-500">{description}</p>
          ) : null}
        </div>
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
        <>
          <SearchResultsGrid items={items} />
          <div ref={loadMoreRef} className="py-4 text-center text-sm text-gray-500">
            {isLoadingMore ? "正在加载更多..." : null}
            {!isLoadingMore && !hasMore ? "没有更多内容了" : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
