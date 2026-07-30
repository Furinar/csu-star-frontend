"use client";

import { searchEverything } from "@/api/search";
import SearchResultsGrid from "@/app/(features)/search/components/SearchResultsGrid";
import SupplementRequestModal from "@/components/supplement/SupplementRequestModal";
import type { SupplementRequestPromptVariant } from "@/components/supplement/SupplementRequestPrompt";
import SupplementRequestPrompt from "@/components/supplement/SupplementRequestPrompt";
import {
  InlineErrorBar,
  LoadMoreStatus,
  PageEmpty,
  PageLoading,
} from "@/components/ui/AsyncState";
import ModernCheckbox from "@/components/ui/ModernCheckbox";
import SearchBar from "@/components/ui/SearchBar";
import {
  buildSearchListCacheKey,
  readListCache,
  writeListCache,
} from "@/lib/listQueryCache";
import { getRequestErrorMessage } from "@/lib/requestError";
import { requireAuthAction } from "@/lib/requireAuthAction";
import { useAuthStore } from "@/store/useAuthStore";
import type { SearchResponse, SearchScope } from "@/types/search";
import type { SupplementRequestType } from "@/types/supplement";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE = 24;

type SearchCachePayload = {
  results: SearchResponse;
  currentPage: number;
  globalTypeCounts: {
    resource: number;
    course: number;
    teacher: number;
  };
};

const EMPTY_TYPE_COUNTS = {
  resource: 0,
  course: 0,
  teacher: 0,
};

const searchConfig: Array<{
  label: string;
  type: SearchScope;
  icon: string;
  placeholder: string;
}> = [
  {
    label: "全局",
    type: "all",
    icon: "globe",
    placeholder: "搜索有趣的事情...",
  },
  {
    label: "资源",
    type: "resource",
    icon: "file-alt",
    placeholder: "搜索资源所属的课程名...",
  },
  {
    label: "课程",
    type: "course",
    icon: "graduation-cap",
    placeholder: "搜索感兴趣的课程...",
  },
  {
    label: "教师",
    type: "teacher",
    icon: "users-alt",
    placeholder: "搜索感兴趣的教师...",
  },
];

function createEmptyResults(): SearchResponse {
  return {
    resources: { total: 0, items: [] },
    courses: { total: 0, items: [] },
    teachers: { total: 0, items: [] },
    all: { total: 0, items: [] },
  };
}

function dedupeUnifiedItems(items: SearchResponse["all"]["items"]) {
  const seen = new Set<string>();

  return items.filter((entry) => {
    const entityId =
      entry.type === "resource" ? entry.item.course_id : entry.item.id;
    const key = `${entry.type}-${entityId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function dedupeEntityItems<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function dedupeResourceItems(items: SearchResponse["resources"]["items"]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.course_id)) {
      return false;
    }

    seen.add(item.course_id);
    return true;
  });
}

function resolveMergedTotal(
  previousTotal: number,
  incomingTotal: number,
  mergedCount: number,
  incomingPageCount: number,
) {
  // Prefer the larger reported total; never let a later empty page collapse
  // total to 0. An empty page means the list is exhausted — clamp total down
  // to the unique items we already have so hasMore becomes false.
  if (incomingPageCount === 0) {
    return mergedCount;
  }

  return Math.max(previousTotal, incomingTotal, mergedCount);
}

function mergeResults(
  previous: SearchResponse,
  incoming: SearchResponse,
  searchType: SearchScope,
) {
  if (searchType === "all") {
    const items = dedupeUnifiedItems([
      ...previous.all.items,
      ...incoming.all.items,
    ]);

    return {
      ...previous,
      ...incoming,
      resources: {
        ...incoming.resources,
        total: resolveMergedTotal(
          previous.resources.total,
          incoming.resources.total,
          items.length,
          incoming.all.items.length,
        ),
      },
      courses: {
        ...incoming.courses,
        total: resolveMergedTotal(
          previous.courses.total,
          incoming.courses.total,
          items.length,
          incoming.all.items.length,
        ),
      },
      teachers: {
        ...incoming.teachers,
        total: resolveMergedTotal(
          previous.teachers.total,
          incoming.teachers.total,
          items.length,
          incoming.all.items.length,
        ),
      },
      all: {
        ...incoming.all,
        total: resolveMergedTotal(
          previous.all.total,
          incoming.all.total,
          items.length,
          incoming.all.items.length,
        ),
        items,
      },
    };
  }

  if (searchType === "resource") {
    const items = dedupeResourceItems([
      ...previous.resources.items,
      ...incoming.resources.items,
    ]);

    return {
      ...previous,
      ...incoming,
      resources: {
        ...incoming.resources,
        total: resolveMergedTotal(
          previous.resources.total,
          incoming.resources.total,
          items.length,
          incoming.resources.items.length,
        ),
        items,
      },
    };
  }

  if (searchType === "course") {
    const items = dedupeEntityItems([
      ...previous.courses.items,
      ...incoming.courses.items,
    ]);

    return {
      ...previous,
      ...incoming,
      courses: {
        ...incoming.courses,
        total: resolveMergedTotal(
          previous.courses.total,
          incoming.courses.total,
          items.length,
          incoming.courses.items.length,
        ),
        items,
      },
    };
  }

  const items = dedupeEntityItems([
    ...previous.teachers.items,
    ...incoming.teachers.items,
  ]);

  return {
    ...previous,
    ...incoming,
    teachers: {
      ...incoming.teachers,
      total: resolveMergedTotal(
        previous.teachers.total,
        incoming.teachers.total,
        items.length,
        incoming.teachers.items.length,
      ),
      items,
    },
  };
}

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((state) => state.access_token);
  const [searchType, setSearchType] = useState<SearchScope>("all");
  const [keyword, setKeyword] = useState("");
  const [relevanceFirst, setRelevanceFirst] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>(createEmptyResults);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalTypeCounts, setGlobalTypeCounts] = useState(EMPTY_TYPE_COUNTS);
  const [isSupplementModalOpen, setIsSupplementModalOpen] = useState(false);
  const requestIdRef = useRef(0);
  const resultKeyRef = useRef("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const supplementInitialType: SupplementRequestType =
    searchType === "teacher" ? "teacher" : "course";
  const supplementPromptVariant: SupplementRequestPromptVariant =
    searchType === "teacher"
      ? "teacher"
      : searchType === "all"
        ? "mixed"
        : "course";

  const currentSearchType = useMemo(() => {
    return (
      searchConfig.find((option) => option.type === searchType) ??
      searchConfig[0]
    );
  }, [searchType]);

  const summary = useMemo(() => {
    const counts =
      searchType === "all"
        ? globalTypeCounts
        : {
            resource: results.resources.total,
            course: results.courses.total,
            teacher: results.teachers.total,
          };

    if (searchType === "all") {
      return {
        counts,
        total: results.all.total,
        loaded: results.all.items.length,
      };
    }

    if (searchType === "resource") {
      return {
        counts,
        total: results.resources.total,
        loaded: results.resources.items.length,
      };
    }

    if (searchType === "course") {
      return {
        counts,
        total: results.courses.total,
        loaded: results.courses.items.length,
      };
    }

    return {
      counts,
      total: results.teachers.total,
      loaded: results.teachers.items.length,
    };
  }, [globalTypeCounts, results, searchType]);

  const displayedItems = useMemo(() => {
    if (searchType === "all") {
      return results.all.items;
    }

    if (searchType === "resource") {
      return results.resources.items.map((item) => ({
        type: "resource" as const,
        item,
      }));
    }

    if (searchType === "course") {
      return results.courses.items.map((item) => ({
        type: "course" as const,
        item,
      }));
    }

    return results.teachers.items.map((item) => ({
      type: "teacher" as const,
      item,
    }));
  }, [results, searchType]);

  const hasMore = summary.loaded < summary.total;

  const syncSearchParams = useCallback(
    ({
      query,
      type,
      relevance,
    }: {
      query: string;
      type: SearchScope;
      relevance: boolean;
    }) => {
      const trimmedQuery = query.trim();
      const params = new URLSearchParams();

      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      }
      if (type !== "all") {
        params.set("type", type);
      }
      if (relevance) {
        params.set("relevance", "1");
      }

      const queryString = params.toString();
      const href = queryString ? `/search?${queryString}` : "/search";
      router.replace(href);
    },
    [router],
  );

  const runSearch = async ({
    query,
    type,
    page,
    append,
    relevance,
  }: {
    query: string;
    type: SearchScope;
    page: number;
    append: boolean;
    relevance: boolean;
  }) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      requestIdRef.current += 1;
      resultKeyRef.current = "";
      setHasSearched(false);
      setIsLoading(false);
      setIsLoadingMore(false);
      setError(null);
      setSubmittedQuery("");
      setCurrentPage(1);
      setResults(createEmptyResults());
      setGlobalTypeCounts(EMPTY_TYPE_COUNTS);
      return;
    }

    const cacheKey = buildSearchListCacheKey(trimmedQuery, type, relevance);
    const currentRequestId = append
      ? requestIdRef.current
      : requestIdRef.current + 1;

    // Snapshot of type counts for this request (avoids stale closures when writing cache).
    let typeCountsSnapshot =
      type === "all" ? { ...EMPTY_TYPE_COUNTS } : EMPTY_TYPE_COUNTS;

    if (!append) {
      requestIdRef.current = currentRequestId;
      setHasSearched(true);
      setSubmittedQuery(trimmedQuery);
      setIsLoading(true);
      setIsLoadingMore(false);
      setError(null);

      const cached = readListCache<SearchCachePayload>(cacheKey);
      if (cached) {
        // Hydrate immediately so network blips never blank the UI.
        resultKeyRef.current = cacheKey;
        typeCountsSnapshot = cached.globalTypeCounts;
        setResults(cached.results);
        setCurrentPage(cached.currentPage);
        setGlobalTypeCounts(cached.globalTypeCounts);
      } else if (resultKeyRef.current !== cacheKey) {
        // Different query/type without cache: clear stale foreign results.
        resultKeyRef.current = cacheKey;
        setResults(createEmptyResults());
        setCurrentPage(1);
        setGlobalTypeCounts(EMPTY_TYPE_COUNTS);
      } else {
        resultKeyRef.current = cacheKey;
      }
    } else {
      setIsLoadingMore(true);
      // Append keeps existing counts; they'll be re-read from cache write via functional path below.
    }

    try {
      const data = await searchEverything({
        q: trimmedQuery,
        type,
        page,
        size: PAGE_SIZE,
        relevance_first: relevance,
      });

      if (requestIdRef.current !== currentRequestId) return;

      if (!append) {
        if (type === "all") {
          try {
            const [resourceData, courseData, teacherData] = await Promise.all([
              searchEverything({
                q: trimmedQuery,
                type: "resource",
                page: 1,
                size: 1,
                relevance_first: relevance,
              }),
              searchEverything({
                q: trimmedQuery,
                type: "course",
                page: 1,
                size: 1,
                relevance_first: relevance,
              }),
              searchEverything({
                q: trimmedQuery,
                type: "teacher",
                page: 1,
                size: 1,
                relevance_first: relevance,
              }),
            ]);

            if (requestIdRef.current !== currentRequestId) return;

            typeCountsSnapshot = {
              resource: resourceData.resources.total,
              course: courseData.courses.total,
              teacher: teacherData.teachers.total,
            };
            setGlobalTypeCounts(typeCountsSnapshot);
          } catch {
            if (requestIdRef.current !== currentRequestId) return;
            // Keep hydrated/cached counts — never force zeros over a good snapshot.
          }
        } else {
          typeCountsSnapshot = EMPTY_TYPE_COUNTS;
          setGlobalTypeCounts(EMPTY_TYPE_COUNTS);
        }
      }

      setResults((previous) => {
        const next = append ? mergeResults(previous, data, type) : data;
        const existingCache = readListCache<SearchCachePayload>(cacheKey);
        const countsForCache =
          type === "all"
            ? append
              ? (existingCache?.globalTypeCounts ?? typeCountsSnapshot)
              : typeCountsSnapshot
            : EMPTY_TYPE_COUNTS;

        writeListCache(cacheKey, {
          results: next,
          currentPage: page,
          globalTypeCounts: countsForCache,
        } satisfies SearchCachePayload);

        return next;
      });
      setCurrentPage(page);
      resultKeyRef.current = cacheKey;
      setError(null);
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;

      // Keep any hydrated/cached results; only surface the error.
      setError(getRequestErrorMessage(err, "搜索失败，请稍后重试。"));
    } finally {
      if (requestIdRef.current === currentRequestId) {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    }
  };

  const handleSearchTypeChange = (type: SearchScope) => {
    requestIdRef.current += 1;
    setSearchType(type);
    syncSearchParams({ query: keyword, type, relevance: relevanceFirst });
  };

  const handleSearch = async (value: string) => {
    setKeyword(value);
    syncSearchParams({
      query: value,
      type: searchType,
      relevance: relevanceFirst,
    });
  };

  const handleRelevanceChange = (checked: boolean) => {
    requestIdRef.current += 1;
    setRelevanceFirst(checked);
    syncSearchParams({ query: keyword, type: searchType, relevance: checked });
  };

  const hasResultItems = summary.loaded > 0;
  // Only full-page loading when there is nothing cached/hydrated to show.
  const showInitialLoading = isLoading && !hasResultItems;
  const showEmptyPrompt = !hasSearched && !showInitialLoading;
  // Use loaded count so a corrupted total=0 after append cannot hide real items.
  const showNoResults =
    hasSearched && !showInitialLoading && !error && !hasResultItems;

  useEffect(() => {
    const typeParam = searchParams.get("type");
    const qParam = searchParams.get("q");
    const relevanceParam = searchParams.get("relevance");
    const normalizedType =
      typeParam === "resource" ||
      typeParam === "course" ||
      typeParam === "teacher"
        ? typeParam
        : "all";
    const normalizedRelevance =
      relevanceParam === "1" || relevanceParam === "true";

    setSearchType(normalizedType);
    setKeyword(qParam ?? "");
    setRelevanceFirst(normalizedRelevance);

    if (qParam?.trim()) {
      void runSearch({
        query: qParam,
        type: normalizedType,
        page: 1,
        append: false,
        relevance: normalizedRelevance,
      });
    } else {
      setResults(createEmptyResults());
      setHasSearched(false);
      setIsLoading(false);
      setIsLoadingMore(false);
      setError(null);
      setCurrentPage(1);
      setSubmittedQuery("");
      setGlobalTypeCounts({ resource: 0, course: 0, teacher: 0 });
    }
  }, [searchParams]);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (
      !node ||
      !hasSearched ||
      showInitialLoading ||
      isLoadingMore ||
      !hasMore ||
      error
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting) return;

        void runSearch({
          query: keyword,
          type: searchType,
          page: currentPage + 1,
          append: true,
          relevance: relevanceFirst,
        });
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [
    currentPage,
    error,
    hasMore,
    hasSearched,
    isLoadingMore,
    keyword,
    relevanceFirst,
    searchType,
    showInitialLoading,
  ]);

  const handleOpenSupplementModal = () => {
    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能提交补录申请。",
      })
    ) {
      return;
    }

    setIsSupplementModalOpen(true);
  };

  return (
    <div className="container mt-6 mb-12 flex flex-col gap-6 md:mt-10 md:mb-20 md:gap-10">
      {/*
        桌面端：搜索框在左，标题文字在右，分类在下居中
        移动端：标题「搜索」+ 分类同一行，搜索框全宽在下（主操作优先）
      */}
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-1 md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-6 md:gap-y-5 md:px-0">
        {/* 标题：移动端左上；桌面端右上右对齐 */}
        <div className="col-start-1 row-start-1 flex min-w-0 flex-col gap-1 md:col-start-2 md:items-end md:gap-1.5 md:text-right">
          <div className="hero-gradient-text text-2xl font-bold sm:text-3xl md:text-4xl">
            <span className="md:hidden">搜索</span>
            <span className="hidden md:inline">风影情报处</span>
          </div>
          <div className="hidden text-base text-gray-600 md:block">
            Explore freely, discover what you need.
          </div>
        </div>

        {/* 分类：移动端右上；桌面端第二行居中 */}
        <div className="col-start-2 row-start-1 justify-self-end md:col-span-2 md:col-start-1 md:row-start-2 md:justify-self-center">
          <div className="relative flex max-w-[min(100%,20rem)] overflow-x-auto rounded-full bg-gray-100 p-1 shadow-inner shadow-gray-300 scrollbar-hide sm:max-w-none md:p-1.5">
            <div
              className="absolute top-1 bottom-1 left-1 z-0 w-[3.75rem] rounded-full bg-white shadow-md transition-transform duration-300 ease-out sm:w-20 md:top-1.5 md:bottom-1.5 md:left-1.5 md:w-28"
              style={{
                transform: `translateX(${Math.max(0, searchConfig.findIndex((item) => item.type === searchType)) * 100}%)`,
              }}
            />
            {searchConfig.map((item) => (
              <span
                key={item.type}
                onClick={() => handleSearchTypeChange(item.type)}
                className={`relative z-10 flex w-[3.75rem] cursor-pointer items-center justify-center gap-0.5 rounded-full py-1.5 text-xs whitespace-nowrap transition-colors duration-300 sm:w-20 sm:gap-1 sm:text-sm md:w-28 md:gap-2 md:py-2 md:text-base ${
                  searchType === item.type
                    ? "text-first-alt font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i
                  className={`uil uil-${item.icon} shrink-0 leading-none text-sm sm:text-base md:text-lg`}
                  aria-hidden="true"
                ></i>
                <span className="leading-none">{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/*
          搜索框：移动端第二行全宽。
          桌面端用明确宽度撑开（auto 列 + max-w 无效）；约 36rem 适中。
        */}
        <div className="col-span-2 row-start-2 w-full md:col-span-1 md:col-start-1 md:row-start-1 md:w-[min(100%,36rem)] md:max-w-none md:justify-self-start">
          <SearchBar
            size="compact"
            value={keyword}
            onChange={setKeyword}
            onSearch={handleSearch}
            debounceOnChange={false}
            placeholder={currentSearchType?.placeholder}
            className="!max-w-none"
            wrapperClassName="!max-w-none"
          />
        </div>
      </div>

      <div className="border-t border-gray-300" />

      {/* Conditional rendering based on search state */}
      {showEmptyPrompt ? (
        <div className="mt-8 md:mt-10">
          <PageEmpty
            type="empty"
            title={`开始搜索${currentSearchType?.label ?? ""}吧！`}
            description="使用上方的搜索工具栏，输入关键词，发现更多精彩内容！"
          />
        </div>
      ) : null}

      {showInitialLoading ? (
        <div className="mt-8 md:mt-10">
          <PageLoading text="正在拼命搜索中..." />
        </div>
      ) : null}

      {error && hasSearched && !hasResultItems && !showInitialLoading ? (
        <div className="mt-8 md:mt-10">
          <PageEmpty
            error={error}
            title="搜索请求失败"
            description={error}
            onRetry={() =>
              void runSearch({
                query: submittedQuery || keyword,
                type: searchType,
                page: 1,
                append: false,
                relevance: relevanceFirst,
              })
            }
          />
        </div>
      ) : null}

      {showNoResults ? (
        <div className="mt-8 md:mt-10">
          <PageEmpty
            type="empty"
            title={`没有找到匹配的${currentSearchType?.label ?? "内容"}`}
            description="可以尝试换一个简短的关键词重新搜索看看~"
            action={
              <div className="w-full max-w-2xl">
                <SupplementRequestPrompt
                  onClick={handleOpenSupplementModal}
                  align="center"
                  className="rounded-[28px] border border-slate-200 bg-slate-50/70 px-5 py-4 md:px-6 md:py-5"
                  variant={supplementPromptVariant}
                />
              </div>
            }
          />
        </div>
      ) : null}

      {hasSearched && hasResultItems ? (
        <div className="flex flex-col gap-6 md:gap-10">
          {error ? (
            <InlineErrorBar
              message={error}
              onRetry={() =>
                void runSearch({
                  query: submittedQuery || keyword,
                  type: searchType,
                  page: 1,
                  append: false,
                  relevance: relevanceFirst,
                })
              }
            />
          ) : null}

          <div className="flex flex-col md:flex-row md:justify-between gap-4 md:items-end">
            <div className="flex flex-col gap-2 text-sm text-gray-500 md:gap-3">
              <div className="flex items-center gap-4">
                找到相关的{" "}
                <span className="font-semibold text-gray-800">
                  {Math.max(summary.total, summary.loaded)}
                </span>{" "}
                条结果
              </div>
              {searchType === "all" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-700">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <span>课程 {summary.counts.course}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>教师 {summary.counts.teacher}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>资源 {summary.counts.resource}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center shrink-0">
              <ModernCheckbox
                checked={relevanceFirst}
                onChange={handleRelevanceChange}
                label="按匹配度优先"
              />
            </div>
          </div>

          <div
            className={`transition-opacity duration-200 ${
              isLoading ? "pointer-events-none opacity-55" : "opacity-100"
            }`}
          >
            <SearchResultsGrid items={displayedItems} />
          </div>

          {isLoadingMore || (isLoading && hasResultItems) ? (
            <LoadMoreStatus
              loading
              loadingText={
                isLoadingMore ? "正在加载更多结果..." : "正在刷新搜索结果..."
              }
            />
          ) : null}

          {!isLoadingMore && !hasMore ? (
            <div className="flex flex-col items-center justify-center gap-3 py-5 md:gap-4 md:py-6">
              <LoadMoreStatus end endText="已经到底了" />
              <div className="w-full max-w-3xl">
                <SupplementRequestPrompt
                  onClick={handleOpenSupplementModal}
                  align="center"
                  className="rounded-[28px] border border-slate-200 bg-slate-50/70 px-5 py-4 md:px-6 md:py-5"
                  variant={supplementPromptVariant}
                />
              </div>
            </div>
          ) : null}

          <div ref={loadMoreRef} className="h-1" />
        </div>
      ) : null}

      <SupplementRequestModal
        isOpen={isSupplementModalOpen}
        onClose={() => setIsSupplementModalOpen(false)}
        initialRequestType={supplementInitialType}
        allowTypeSwitch={searchType === "all"}
      />
    </div>
  );
}
