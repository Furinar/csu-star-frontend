"use client";

import { searchEverything } from "@/api/search";
import SearchResultsGrid from "@/app/(features)/search/components/SearchResultsGrid";
import {
  InlineErrorBar,
  LoadMoreStatus,
  PageEmpty,
  PageLoading,
} from "@/components/ui/AsyncState";
import {
  buildLandingListCacheKey,
  readListCache,
  writeListCache,
} from "@/lib/listQueryCache";
import { getRequestErrorMessage } from "@/lib/requestError";
import type { SearchResponse, SearchScope, SearchUnifiedItem } from "@/types/search";
import type { ReactNode } from "react";
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

function resolveMergedTotal(
  previousTotal: number,
  nextTotal: number,
  mergedCount: number,
  nextPageCount: number,
) {
  // Empty page ⇒ exhausted. Clamp total so hasMore stops even if server total
  // was inflated by unstable pagination / duplicates.
  if (nextPageCount === 0) {
    return mergedCount;
  }

  return Math.max(previousTotal, nextTotal, mergedCount);
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
        total: resolveMergedTotal(
          previous.courses.total,
          next.courses.total,
          mergedItems.length,
          next.courses.items.length,
        ),
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
        total: resolveMergedTotal(
          previous.teachers.total,
          next.teachers.total,
          mergedItems.length,
          next.teachers.items.length,
        ),
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
      total: resolveMergedTotal(
        previous.resources.total,
        next.resources.total,
        mergedItems.length,
        next.resources.items.length,
      ),
      items: mergedItems,
    },
  };
}

type LandingCachePayload = {
  results: SearchResponse;
  page: number;
};

export default function SearchLandingSection({
  type,
  title,
  description,
  action,
  size = DEFAULT_PAGE_SIZE,
  className = "",
}: {
  type: LandingScope;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  size?: number;
  className?: string;
}) {
  const cacheKey = buildLandingListCacheKey(type, size);
  const cached = readListCache<LandingCachePayload>(cacheKey);

  const [results, setResults] = useState<SearchResponse | null>(
    () => cached?.results ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !cached?.results);
  const [page, setPage] = useState(() => cached?.page ?? 1);
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
      // Keep showing cached results while refreshing; only block UI when empty.
      setLoading(true);
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

      setResults((previous) => {
        const next = append && previous ? mergeResults(previous, data, type) : data;
        writeListCache(cacheKey, {
          results: next,
          page: nextPage,
        } satisfies LandingCachePayload);
        return next;
      });
      setPage(nextPage);
      setError(null);
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;

      // Never clear existing results on network failure — surface inline retry only.
      setError(getRequestErrorMessage(err, "列表加载失败，请稍后重试。"));
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [cacheKey, size, type]);

  useEffect(() => {
    void loadPage({ page: 1, append: false });
  }, [loadPage]);

  const resolvedResults = results ?? createEmptyResults();
  const items = useMemo(() => getScopedItems(resolvedResults, type), [resolvedResults, type]);
  const total = useMemo(() => getScopedTotal(resolvedResults, type), [resolvedResults, type]);
  const hasMore = items.length < total;
  const hasCachedItems = items.length > 0;
  // Full-page loading only when nothing to show yet.
  const showInitialLoading = loading && !hasCachedItems;

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || showInitialLoading || isLoadingMore || error || !hasMore) {
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
  }, [error, hasMore, isLoadingMore, loadPage, page, showInitialLoading]);

  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      <div className="flex flex-row items-center justify-between gap-3 md:flex-row md:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-2">
          <h2
            className="bg-clip-text text-xl font-bold text-transparent md:text-3xl"
            style={{ backgroundImage: "var(--page-accent-gradient)" }}
          >
            {title}
          </h2>
          {description ? (
            // Reserve two text-sm lines so one-line vs two-line copy (e.g. course vs resource)
            // does not shift the list grid below.
            <p className="hidden text-sm leading-5 text-gray-500 md:block md:min-h-10">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="w-auto shrink-0 self-auto">{action}</div> : null}
      </div>

      {showInitialLoading ? <PageLoading text="正在加载列表..." /> : null}

      {!showInitialLoading && error && !hasCachedItems ? (
        <PageEmpty
          error={error}
          description={error}
          onRetry={() => void loadPage({ page: 1, append: false })}
        />
      ) : null}

      {!showInitialLoading && !error && !hasCachedItems ? (
        <PageEmpty type="empty" title="暂无可展示内容" description="稍后再来看看吧。" />
      ) : null}

      {hasCachedItems ? (
        <>
          {error ? (
            <InlineErrorBar
              message={error}
              onRetry={() => void loadPage({ page: 1, append: false })}
            />
          ) : null}
          <div
            className={`transition-opacity duration-200 ${
              loading ? "pointer-events-none opacity-55" : "opacity-100"
            }`}
          >
            <SearchResultsGrid items={items} />
          </div>
          <div ref={loadMoreRef}>
            <LoadMoreStatus
              loading={isLoadingMore || (loading && hasCachedItems)}
              end={!loading && !isLoadingMore && !hasMore}
              loadingText={isLoadingMore ? "正在加载更多..." : "正在刷新..."}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
