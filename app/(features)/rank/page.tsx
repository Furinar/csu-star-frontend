"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  InlineErrorBar,
  LoadMoreStatus,
  PageEmpty,
} from "@/components/ui/AsyncState";
import RankItemCard from "@/components/ui/RankItemCard";
import {
  getCourseRankings,
  getResourceRankings,
} from "@/api/ranking";
import {
  buildRankListCacheKey,
  readListCache,
  writeListCache,
} from "@/lib/listQueryCache";
import { getRequestErrorMessage } from "@/lib/requestError";
import type {
  CourseRankType,
  CourseRankingItem,
  ResourceRankType,
  ResourceRankingItem,
} from "@/types/ranking";

type RankCachePayload =
  | {
      category: "resource";
      items: ResourceRankingItem[];
      total: number;
      page: number;
    }
  | {
      category: "course";
      items: CourseRankingItem[];
      total: number;
      page: number;
    };

const rankConfig = [
  {
    category: "resource",
    label: "资源",
    icon: "file-alt",
    filters: [
      { type: "comprehensive", label: "综合", icon: "award" },
      { type: "downloads", label: "下载量", icon: "import" },
      { type: "views", label: "浏览量", icon: "eye" },
      { type: "likes", label: "点赞", icon: "thumbs-up" },
      { type: "resource_count", label: "资源数", icon: "files-landscapes" },
      { type: "favorite_count", label: "收藏数", icon: "bookmark" },
    ],
  },
  {
    category: "course",
    label: "课程",
    icon: "graduation-cap",
    filters: [
      { type: "avg_score", label: "综合", icon: "award" },
      { type: "avg_homework", label: "作业", icon: "book-open" },
      { type: "avg_gain", label: "收获", icon: "brain" },
      { type: "avg_exam_diff", label: "考试", icon: "brackets-curly" },
      { type: "resource_count", label: "资源数", icon: "file-alt" },
      { type: "favorite_count", label: "收藏数", icon: "bookmark" },
    ],
  },
] as const;

type RankCategory = (typeof rankConfig)[number]["category"];
type FilterType = (typeof rankConfig)[number]["filters"][number]["type"];

const PAGE_SIZE = 20;
// 骨架数量贴近首屏列表，降低「空列表骨架 → 真实列表」的高度差
const SKELETON_COUNT = 10;

const mergeRankingItems = <T,>(
  previous: T[],
  incoming: T[],
  getKey: (item: T) => string | number,
) => {
  const existingIds = new Set(previous.map(getKey));
  return [...previous, ...incoming.filter((item) => !existingIds.has(getKey(item)))];
};

function RankListSkeleton({ count = SKELETON_COUNT }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white md:rounded-xl"
        >
          <div className="flex min-h-[132px] flex-col gap-3 p-3 md:hidden">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 shrink-0 rounded-full bg-gray-100" />
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <div className="h-4 w-2/3 rounded bg-gray-100" />
                <div className="h-3 w-1/3 rounded bg-gray-100" />
              </div>
              <div className="h-12 w-16 shrink-0 rounded-xl bg-gray-100" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-14 rounded-xl bg-gray-50" />
              <div className="h-14 rounded-xl bg-gray-50" />
              <div className="h-14 rounded-xl bg-gray-50" />
            </div>
          </div>

          <div className="hidden min-h-[112px] flex-row items-stretch md:flex">
            <div className="flex w-16 shrink-0 items-center justify-center border-r border-gray-100 bg-gray-50/40 md:w-20">
              <div className="h-11 w-11 rounded-full bg-gray-100" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-4">
              <div className="h-4 w-1/3 rounded bg-gray-100" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
            <div className="flex w-3/5 shrink-0 border-l border-gray-100 sm:w-[45%] md:w-3/5">
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 border-r border-gray-100 px-3 md:px-4">
                <div className="h-2 w-full rounded bg-gray-100" />
                <div className="h-2 w-full rounded bg-gray-100" />
                <div className="h-2 w-4/5 rounded bg-gray-100" />
              </div>
              <div className="w-[105px] shrink-0 bg-gray-50/80 md:w-[115px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Rank() {
  const searchParams = useSearchParams();
  const [rankCategory, setRankCategory] = useState<RankCategory>("resource");
  const [filterType, setFilterType] = useState<FilterType>("comprehensive");
  const [sortType, setSortType] = useState<"desc" | "asc">("desc");
  // 进入页即展示结果区骨架，避免空态 → 加载态 → 列表 的高度塌缩抖动
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasRequested, setHasRequested] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [courseItems, setCourseItems] = useState<CourseRankingItem[]>([]);
  const [resourceItems, setResourceItems] = useState<ResourceRankingItem[]>([]);
  const [shouldAutoFetch, setShouldAutoFetch] = useState(true);
  const requestIdRef = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const currentCategory = useMemo(
    () =>
      rankConfig.find((item) => item.category === rankCategory) ??
      rankConfig[0],
    [rankCategory],
  );

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const filterParam = searchParams.get("filter");
    const sortParam = searchParams.get("sort");

    const nextCategory = rankConfig.find((item) => item.category === categoryParam)?.category;
    if (!nextCategory) {
      setShouldAutoFetch(true);
      return;
    }

    const nextCategoryConfig =
      rankConfig.find((item) => item.category === nextCategory) ?? rankConfig[0];
    const nextFilter =
      nextCategoryConfig.filters.find((item) => item.type === filterParam)?.type ??
      nextCategoryConfig.filters[0].type;
    const nextSort = sortParam === "asc" ? "asc" : "desc";

    setRankCategory(nextCategory);
    setFilterType(nextFilter as FilterType);
    setSortType(nextSort);
    setShouldAutoFetch(true);
  }, [searchParams]);

  const currentItems = useMemo(() => {
    if (rankCategory === "resource") return resourceItems;
    return courseItems;
  }, [courseItems, rankCategory, resourceItems]);

  const hasMore = currentItems.length < total;

  const fetchRankings = useCallback(async ({
    page: nextPage,
    append,
  }: {
    page: number;
    append: boolean;
  }) => {
    const cacheKey = buildRankListCacheKey(rankCategory, filterType, sortType);
    const currentRequestId = append ? requestIdRef.current : requestIdRef.current + 1;

    if (!append) {
      requestIdRef.current = currentRequestId;
      setHasRequested(true);
      setLoading(true);
      setIsLoadingMore(false);
      setErrorMessage("");

      const cached = readListCache<RankCachePayload>(cacheKey);
      if (cached && cached.category === rankCategory) {
        // Hydrate this filter's cache immediately; never blank on refresh failure.
        if (cached.category === "resource") {
          setResourceItems(cached.items);
        } else {
          setCourseItems(cached.items);
        }
        setTotal(cached.total);
        setPage(cached.page);
      } else {
        // No cache for this key: clear foreign filter leftovers and show skeleton.
        if (rankCategory === "resource") {
          setResourceItems([]);
        } else {
          setCourseItems([]);
        }
        setTotal(0);
        setPage(1);
      }
    } else {
      setIsLoadingMore(true);
    }

    try {
      if (rankCategory === "resource") {
        const result = await getResourceRankings({
          rank_type: filterType as ResourceRankType,
          page: nextPage,
          size: PAGE_SIZE,
          is_increased: sortType === "asc",
        });

        if (requestIdRef.current !== currentRequestId) return;

        setResourceItems((previous) => {
          const next = append
            ? mergeRankingItems(previous, result.items, (item) => item.course_id)
            : result.items;
          writeListCache(cacheKey, {
            category: "resource",
            items: next,
            total: result.total,
            page: nextPage,
          } satisfies RankCachePayload);
          return next;
        });
        setTotal(result.total);
        setPage(nextPage);
        setErrorMessage("");
        return;
      }

      if (rankCategory === "course") {
        const result = await getCourseRankings({
          rank_type: filterType as CourseRankType,
          page: nextPage,
          size: PAGE_SIZE,
          is_increased: sortType === "asc",
        });

        if (requestIdRef.current !== currentRequestId) return;

        setCourseItems((previous) => {
          const next = append
            ? mergeRankingItems(previous, result.items, (item) => item.id)
            : result.items;
          writeListCache(cacheKey, {
            category: "course",
            items: next,
            total: result.total,
            page: nextPage,
          } satisfies RankCachePayload);
          return next;
        });
        setTotal(result.total);
        setPage(nextPage);
        setErrorMessage("");
        return;
      }
    } catch (error) {
      if (requestIdRef.current !== currentRequestId) return;
      console.error(error);
      // Do not clear hydrated/cached list on network failure.
      setErrorMessage(
        getRequestErrorMessage(error, "排行榜接口异常，请稍后重试。"),
      );
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [filterType, rankCategory, sortType]);

  // 分类/筛选/排序切换时取消在途请求，由 fetchRankings 负责按 key 水合缓存
  useEffect(() => {
    requestIdRef.current += 1;
    setHasRequested(true);
    setIsLoadingMore(false);
    setErrorMessage("");
  }, [rankCategory, filterType, sortType]);

  useEffect(() => {
    if (!shouldAutoFetch) return;
    void fetchRankings({ page: 1, append: false });
  }, [fetchRankings, shouldAutoFetch]);

  const currentItemsEmpty = currentItems.length === 0;
  // Soft refresh keeps list visible; skeleton only when this key has no cache.
  const showInitialLoading = loading && currentItemsEmpty;

  useEffect(() => {
    const node = loadMoreRef.current;

    if (
      !node ||
      !hasRequested ||
      showInitialLoading ||
      isLoadingMore ||
      !!errorMessage ||
      !hasMore
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        void fetchRankings({ page: page + 1, append: true });
      },
      { rootMargin: "280px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    errorMessage,
    fetchRankings,
    hasMore,
    hasRequested,
    isLoadingMore,
    page,
    showInitialLoading,
  ]);
  const currentFilterLabel =
    currentCategory.filters.find((item) => item.type === filterType)?.label || "--";

  const getResourceFilterValue = (item: ResourceRankingItem) => {
    switch (filterType as ResourceRankType) {
      case "downloads":
        return item.download_total;
      case "views":
        return item.view_total;
      case "likes":
        return item.like_total;
      case "favorite_count":
        return item.favorite_count;
      case "resource_count":
        return item.resource_count;
      default:
        return item.score;
    }
  };

  return (
    <div className="container mt-6 flex flex-col gap-6 md:mt-10 md:gap-10">
      {/* 主类目 + 分割线 + 子类目：桌面端子类目上边框与分割线重合 */}
      <div className="flex w-full flex-col">
        {/* 标题与资源/课程分类：水平排列；移动端简称「排行」 */}
        <div className="flex w-full flex-row items-center justify-between gap-3 px-1 md:gap-6 md:px-0">
          <div className="flex min-w-0 flex-col gap-1 md:gap-1.5">
            <div className="hero-gradient-text text-2xl font-bold sm:text-3xl md:text-4xl">
              <span className="md:hidden">排行</span>
              <span className="hidden md:inline">天梯风云榜</span>
            </div>
            <div className="hidden text-base text-gray-600 md:block">
              Rise step by step, witness the top glory.
            </div>
          </div>

          <div className="relative flex shrink-0 overflow-x-auto rounded-full bg-gray-100 p-1 shadow-inner shadow-gray-300 scrollbar-hide md:p-1.5">
            <div
              className="absolute top-1 bottom-1 left-1 z-0 w-[4.5rem] rounded-full bg-white shadow-md transition-transform duration-300 ease-out sm:w-20 md:top-1.5 md:bottom-1.5 md:left-1.5 md:w-28"
              style={{
                transform: `translateX(${Math.max(0, rankConfig.findIndex((item) => item.category === rankCategory)) * 100}%)`,
              }}
            />

            {rankConfig.map((item) => (
              <span
                key={item.category}
                onClick={() => {
                  setRankCategory(item.category);
                  setFilterType(item.filters[0].type as FilterType);
                }}
                className={`relative z-10 flex w-[4.5rem] cursor-pointer items-center justify-center gap-1 rounded-full py-1.5 text-sm whitespace-nowrap transition-colors duration-300 sm:w-20 md:w-28 md:gap-2 md:py-2 md:text-base ${
                  rankCategory === item.category
                    ? "text-first-alt font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i
                  className={`uil uil-${item.icon} shrink-0 leading-none text-base md:text-lg`}
                  aria-hidden="true"
                ></i>
                <span className="leading-none">{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 移动端：分割线 + 下拉维度 + 排序 */}
        <div className="mt-6 flex flex-col gap-3 md:hidden">
          <div className="border-t border-gray-300" />
          <div className="w-full">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              排行维度
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[var(--first-color)] focus:ring-2 focus:ring-[var(--first-color)]/10"
              style={{
                WebkitAppearance: "menulist",
                appearance: "auto",
              }}
            >
              {currentCategory.filters.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <span
              onClick={() => setSortType("desc")}
              className={`relative z-10 flex w-10 items-center justify-center py-1 transition-colors duration-300 ${
                sortType === "desc"
                  ? "text-first-alt"
                  : "cursor-pointer text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="uil uil-sort-amount-down text-lg"></i>
            </span>
            <label
              className="relative inline-block h-[1.75em] w-[3.3em] text-base"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
              }}
            >
              <input
                type="checkbox"
                className="peer h-0 w-0 opacity-0"
                checked={sortType === "asc"}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
                }}
              />
              <span
                className="absolute inset-0 cursor-pointer rounded-[0.45em] bg-gray-200 shadow-[0_0.16em_#dfd9d9] transition-all duration-400
               before:absolute before:bottom-[0.35em] before:left-[0.28em] before:h-[1.25em] before:w-[1.15em] before:rounded-[0.28em]
               before:bg-[lightsalmon] before:shadow-[0_0.3em_#bcb4b4] before:transition-all before:duration-400 before:content-['']
               before:hover:bottom-[0.28em] before:hover:shadow-[0_0.18em_#bcb4b4]
               peer-checked:before:translate-x-[1.55em] peer-checked:before:bg-[lightgreen]"
              ></span>
            </label>
            <span
              onClick={() => setSortType("asc")}
              className={`relative z-10 flex w-10 items-center justify-center py-1 transition-colors duration-300 ${
                sortType === "asc"
                  ? "text-first-alt"
                  : "cursor-pointer text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className="uil uil-sort-amount-up text-lg"></i>
            </span>
          </div>
        </div>

        {/*
          桌面端：全宽分割线为唯一基准线。
          子类目条顶边压在该线上；紫色指示条在同一 top:0 上滑动，覆盖对应段落。
        */}
        <div className="relative mt-8 hidden md:block">
          {/* 全宽分割线（唯一基准） */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-0.5 bg-gray-200"
          />

          <div className="relative grid grid-cols-[1fr_auto_1fr] items-start">
            {/* 左侧排序：落在分割线下方 */}
            <div className="z-10 flex items-center self-start pt-5">
              <span
                onClick={() => setSortType("desc")}
                className={`relative z-10 flex w-12 items-center justify-center py-2 transition-colors duration-300 ${
                  sortType === "desc"
                    ? "text-first-alt"
                    : "cursor-pointer text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className="uil uil-sort-amount-down text-xl"></i>
              </span>
              <label
                className="relative inline-block h-[2em] w-[4em] text-lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
                }}
              >
                <input
                  type="checkbox"
                  className="peer h-0 w-0 opacity-0"
                  checked={sortType === "asc"}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
                  }}
                />
                <span
                  className="absolute inset-0 cursor-pointer rounded-[0.5em] bg-gray-200 shadow-[0_0.2em_#dfd9d9] transition-all duration-400
                 before:absolute before:bottom-[0.7em] before:left-[0.3em] before:h-[1.5em] before:w-[1.4em] before:rounded-[0.3em]
                 before:bg-[lightsalmon] before:shadow-[0_0.4em_#bcb4b4] before:transition-all before:duration-400 before:content-['']
                 before:hover:bottom-[0.5em] before:hover:shadow-[0_0.2em_#bcb4b4]
                 peer-checked:before:translate-x-[2em] peer-checked:before:bg-[lightgreen]"
                ></span>
              </label>
              <span
                onClick={() => setSortType("asc")}
                className={`relative z-10 flex w-12 items-center justify-center py-2 transition-colors duration-300 ${
                  sortType === "asc"
                    ? "text-first-alt"
                    : "cursor-pointer text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className="uil uil-sort-amount-up text-xl"></i>
              </span>
            </div>

            {/* 中间子类目：顶边与全宽分割线重合 */}
            <div className="relative z-10">
              {/* 紫线 + 渐变底：与全宽分割线共用 top:0 */}
              <div
                className="absolute left-0 top-0 z-0 h-full w-28 bg-gradient-to-b from-[var(--first-color)]/20 to-transparent transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(${Math.max(0, currentCategory.filters.findIndex((item) => item.type === filterType)) * 100}%)`,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-[var(--first-color)]" />
              </div>

              <div className="relative z-10 flex py-1.5">
                {currentCategory.filters.map((item) => (
                  <div
                    key={item.type}
                    onClick={() => setFilterType(item.type)}
                    className={`relative z-10 flex w-28 cursor-pointer items-center justify-center gap-2 py-2 text-sm transition-colors duration-300 ${
                      filterType === item.type
                        ? "text-first-alt font-semibold"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <i className={`uil uil-${item.icon}`}></i>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧占位，保持子类目水平居中 */}
            <div aria-hidden className="pt-5" />
          </div>
        </div>
      </div>

      {!hasRequested ? (
        <div className="mt-8 flex min-h-[28rem] flex-col items-center justify-center gap-2.5 md:mt-15 md:min-h-[32rem] md:gap-5">
          <div className="text-8xl text-gray-300">
            <i className="uil uil-filter"></i>
          </div>
          <div className="text-lg sm:text-xl md:text-2xl text-gray-800">角逐左家垅之巅</div>
          <div className="text-sm sm:text-base md:text-lg text-gray-500">
            使用上方的排行筛选器，发现更多精彩内容！
          </div>
        </div>
      ) : (
        <div className="min-h-[28rem] md:min-h-[32rem]">
          <div className="mb-3 flex min-h-[1.75rem] flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between md:mb-4 md:gap-2">
            <div className="text-base md:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-red-500 tracking-wider">
              巅峰百强
            </div>
            <div className="text-sm text-gray-500">
              当前排序：{currentFilterLabel}
              （{sortType === "desc" ? "降序" : "升序"}）
            </div>
          </div>

          {showInitialLoading ? <RankListSkeleton /> : null}

          {!showInitialLoading && errorMessage && currentItemsEmpty ? (
            <PageEmpty
              error={errorMessage}
              description={errorMessage}
              onRetry={() => void fetchRankings({ page: 1, append: false })}
              className="border-0 bg-transparent shadow-none"
            />
          ) : null}

          {errorMessage && !currentItemsEmpty ? (
            <div className="mb-4">
              <InlineErrorBar
                message={errorMessage}
                onRetry={() => void fetchRankings({ page: 1, append: false })}
              />
            </div>
          ) : null}

          {rankCategory === "resource" && resourceItems.length > 0 ? (
            <div
              className={`grid grid-cols-1 gap-4 transition-opacity duration-200 ${
                loading ? "pointer-events-none opacity-45" : "opacity-100"
              }`}
            >
              {resourceItems.map((item, index) => (
                <RankItemCard
                  key={item.course_id}
                  type="resource"
                  item={{ ...item, rank: item.rank || index + 1 }}
                  filterLabel={
                    currentCategory.filters.find((f) => f.type === filterType)
                      ?.label || ""
                  }
                  filterValue={getResourceFilterValue(item)}
                />
              ))}
            </div>
          ) : null}

          {rankCategory === "course" && courseItems.length > 0 ? (
            <div
              className={`grid grid-cols-1 gap-4 transition-opacity duration-200 ${
                loading ? "pointer-events-none opacity-45" : "opacity-100"
              }`}
            >
              {courseItems.map((item, index) => (
                <RankItemCard
                  key={item.id}
                  type="course"
                  item={{ ...item, rank: item.rank || index + 1 }}
                  filterLabel={
                    currentCategory.filters.find((f) => f.type === filterType)
                      ?.label || ""
                  }
                  filterValue={item[filterType as keyof CourseRankingItem] as string | number | null | undefined}
                />
              ))}
            </div>
          ) : null}

          {!showInitialLoading && currentItemsEmpty && !errorMessage ? (
            <PageEmpty
              type="empty"
              title="当前条件下暂无数据"
              description="请切换筛选维度或排序方式后重试。"
              className="border-0 bg-transparent shadow-none"
            />
          ) : null}

          {!currentItemsEmpty ? (
            <div ref={loadMoreRef}>
              <LoadMoreStatus
                loading={isLoadingMore || (loading && !currentItemsEmpty)}
                end={!loading && !isLoadingMore && !hasMore}
                loadingText={isLoadingMore ? "正在加载更多..." : "正在刷新..."}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
