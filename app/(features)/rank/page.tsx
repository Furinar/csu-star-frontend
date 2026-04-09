"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import RankItemCard from "@/components/ui/RankItemCard";
import {
  getCourseRankings,
  getResourceRankings,
  getTeacherRankings,
} from "@/api/ranking";
import type {
  CourseRankType,
  CourseRankingItem,
  ResourceRankType,
  ResourceRankingItem,
  TeacherRankType,
  TeacherRankingItem,
} from "@/types/ranking";

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
  {
    category: "teacher",
    label: "教师",
    icon: "users-alt",
    filters: [
      { type: "avg_score", label: "综合", icon: "award" },
      { type: "avg_quality", label: "教学", icon: "book-open" },
      { type: "avg_grading", label: "给分", icon: "chart-bar" },
      { type: "avg_attendance", label: "考勤", icon: "bell-school" },
      { type: "eval_count", label: "评价数", icon: "comment-alt-lines" },
      { type: "favorite_count", label: "收藏数", icon: "bookmark" },
    ],
  },
] as const;

type RankCategory = (typeof rankConfig)[number]["category"];
type FilterType = (typeof rankConfig)[number]["filters"][number]["type"];

const PAGE_SIZE = 20;

const mergeRankingItems = <T,>(
  previous: T[],
  incoming: T[],
  getKey: (item: T) => string | number,
) => {
  const existingIds = new Set(previous.map(getKey));
  return [...previous, ...incoming.filter((item) => !existingIds.has(getKey(item)))];
};

export default function Rank() {
  const searchParams = useSearchParams();
  const [rankCategory, setRankCategory] = useState<RankCategory>("resource");
  const [filterType, setFilterType] = useState<FilterType>("comprehensive");
  const [sortType, setSortType] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [courseItems, setCourseItems] = useState<CourseRankingItem[]>([]);
  const [teacherItems, setTeacherItems] = useState<TeacherRankingItem[]>([]);
  const [resourceItems, setResourceItems] = useState<ResourceRankingItem[]>([]);
  const [shouldAutoFetch, setShouldAutoFetch] = useState(false);
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
      setShouldAutoFetch(false);
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
    if (rankCategory === "course") return courseItems;
    return teacherItems;
  }, [courseItems, rankCategory, resourceItems, teacherItems]);

  const hasMore = currentItems.length < total;

  const fetchRankings = useCallback(async ({
    page: nextPage,
    append,
  }: {
    page: number;
    append: boolean;
  }) => {
    const currentRequestId = append ? requestIdRef.current : requestIdRef.current + 1;

    if (!append) {
      requestIdRef.current = currentRequestId;
      setHasRequested(true);
      setLoading(true);
      setIsLoadingMore(false);
      setErrorMessage("");
      setTotal(0);
      setPage(1);
      setCourseItems([]);
      setTeacherItems([]);
      setResourceItems([]);
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

        setResourceItems((previous) =>
          append
            ? mergeRankingItems(previous, result.items, (item) => item.course_id)
            : result.items,
        );
        setTotal(result.total);
        setPage(nextPage);
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

        setCourseItems((previous) =>
          append
            ? mergeRankingItems(previous, result.items, (item) => item.id)
            : result.items,
        );
        setTotal(result.total);
        setPage(nextPage);
        return;
      }

      const result = await getTeacherRankings({
        rank_type: filterType as TeacherRankType,
        page: nextPage,
        size: PAGE_SIZE,
        is_increased: sortType === "asc",
      });

      if (requestIdRef.current !== currentRequestId) return;

      setTeacherItems((previous) =>
        append
          ? mergeRankingItems(previous, result.items, (item) => item.id)
          : result.items,
      );
      setTotal(result.total);
      setPage(nextPage);
    } catch (error) {
      if (requestIdRef.current !== currentRequestId) return;
      console.error(error);
      setErrorMessage("排行榜接口异常，请稍后重试。");
      setTotal(0);
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [filterType, rankCategory, sortType]);

  useEffect(() => {
    requestIdRef.current += 1;
    setHasRequested(false);
    setLoading(false);
    setIsLoadingMore(false);
    setErrorMessage("");
    setTotal(0);
    setPage(1);
    setCourseItems([]);
    setTeacherItems([]);
    setResourceItems([]);
  }, [rankCategory, filterType, sortType]);

  useEffect(() => {
    if (!shouldAutoFetch) return;
    void fetchRankings({ page: 1, append: false });
  }, [fetchRankings, shouldAutoFetch]);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (
      !node ||
      !hasRequested ||
      loading ||
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
  }, [errorMessage, fetchRankings, hasMore, hasRequested, isLoadingMore, loading, page]);

  const currentItemsEmpty = currentItems.length === 0;
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
      <div className="flex w-full flex-col items-center justify-center gap-2 md:gap-3">
        <div className="hero-gradient-text text-4xl font-bold">天梯风云榜</div>
        <div className="text-gray-600">
          Rise step by step, witness the top glory.
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-3 px-1 md:gap-5 md:px-0">
        <div className="relative flex max-w-full overflow-x-auto rounded-full bg-gray-100 p-1 shadow-inner shadow-gray-300 scrollbar-hide md:p-1.5">
            <div
              className="absolute top-1 bottom-1 z-0 w-20 rounded-full bg-white shadow-md transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)] md:top-1.5 md:bottom-1.5 md:w-28"
              style={{
                transform: `translateX(${rankConfig.findIndex((item) => item.category === rankCategory) * 100}%)`,
              }}
            />

            {rankConfig.map((item) => (
              <span
                key={item.category}
                onClick={() => {
                  setRankCategory(item.category);
                  setFilterType(item.filters[0].type as FilterType);
                }}
                className={`relative z-10 flex w-20 items-center justify-center gap-1 rounded-full py-1.5 text-sm whitespace-nowrap cursor-pointer transition-colors duration-300 md:w-28 md:gap-2 md:py-2 md:text-base ${
                  rankCategory === item.category
                    ? "text-first-alt font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className={`uil uil-${item.icon} text-base md:text-lg`}></i>
                {item.label}
              </span>
            ))}
        </div>
      </div>

      <div className=" border-t border-gray-300" />

      <div className="md:hidden flex flex-col gap-1.5">
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            排行维度
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-2.5 pr-12 text-sm text-gray-800 outline-none transition focus:border-[var(--first-color)] focus:ring-2 focus:ring-[var(--first-color)]/10"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml;utf8,<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 6.75L9 11.25L13.5 6.75" fill="none" stroke="%236b7280" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>\')',
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1rem 1rem",
            }}
          >
            {currentCategory.filters.map((item) => (
              <option key={item.type} value={item.type}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center">
            <span
              onClick={() => setSortType("desc")}
              className={`relative z-10 flex w-10 justify-center items-center py-1 transition-colors duration-300 ${
                sortType === "desc"
                  ? "text-first-alt"
                  : "text-gray-500 hover:text-gray-700 cursor-pointer"
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
                className="peer opacity-0 w-0 h-0"
                checked={sortType === "asc"}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
                }}
              />
              <span
                className="absolute inset-0 cursor-pointer bg-gray-200 transition-all duration-400 rounded-[0.45em] shadow-[0_0.16em_#dfd9d9]
               before:content-[''] before:absolute before:h-[1.25em] before:w-[1.15em] before:rounded-[0.28em]
               before:left-[0.28em] before:bottom-[0.35em] before:bg-[lightsalmon] before:transition-all before:duration-400
               before:shadow-[0_0.3em_#bcb4b4]
               before:hover:shadow-[0_0.18em_#bcb4b4] before:hover:bottom-[0.28em]
               peer-checked:before:translate-x-[1.55em] peer-checked:before:bg-[lightgreen]"
              ></span>
            </label>
            <span
              onClick={() => setSortType("asc")}
              className={`relative z-10 flex w-10 justify-center items-center py-1 transition-colors duration-300 ${
                sortType === "asc"
                  ? "text-first-alt"
                  : "text-gray-500 hover:text-gray-700 cursor-pointer"
              }`}
            >
              <i className="uil uil-sort-amount-up text-lg"></i>
            </span>
          </div>

          <div className="self-auto">
            <button
              onClick={() => void fetchRankings({ page: 1, append: false })}
              disabled={loading || isLoadingMore}
              className="group relative flex h-[2.55em] items-center overflow-hidden rounded-[0.85em] border-0 bg-first py-[0.32em] pl-[1em] pr-[3.05em] text-[15px] font-medium tracking-[0.04em] text-white shadow-[inset_0_0_1.3em_-0.55em_#714da6] whitespace-nowrap cursor-pointer disabled:opacity-70"
            >
              {loading ? "更新中..." : isLoadingMore ? "加载更多中..." : "Get Rank"}
              <span className="icon absolute right-[0.28em] flex h-[1.95em] w-[1.95em] items-center justify-center rounded-[0.62em] bg-white shadow-[0.08em_0.08em_0.5em_0.18em_#7b52b9] transition-all duration-300 group-hover:w-[calc(100%-0.56em)] active:scale-95">
                <i className="uil uil-arrow-right text-[1em] text-[#7b52b9] transition-transform duration-300 group-hover:translate-x-[0.1em] group-hover:scale-140"></i>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:flex-row md:items-center md:justify-between">
        <div className="mt-5 flex items-center self-start">
          <span
            onClick={() => setSortType("desc")}
            className={`relative z-10 flex w-12 justify-center items-center py-2 transition-colors duration-300 ${
              sortType === "desc"
                ? "text-first-alt"
                : "text-gray-500 hover:text-gray-700 cursor-pointer"
            }`}
          >
            <i className="uil uil-sort-amount-down text-xl"></i>
          </span>
          <label
            className="relative inline-block w-[4em] h-[2em] text-lg"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
            }}
          >
            <input
              type="checkbox"
              className="peer opacity-0 w-0 h-0"
              checked={sortType === "asc"}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSortType((prev) => (prev === "desc" ? "asc" : "desc"));
              }}
            />
            <span
              className="absolute inset-0 cursor-pointer bg-gray-200 transition-all duration-400 rounded-[0.5em] shadow-[0_0.2em_#dfd9d9]
             before:content-[''] before:absolute before:h-[1.5em] before:w-[1.4em] before:rounded-[0.3em]
             before:left-[0.3em] before:bottom-[0.7em] before:bg-[lightsalmon] before:transition-all before:duration-400
             before:shadow-[0_0.4em_#bcb4b4]
             before:hover:shadow-[0_0.2em_#bcb4b4] before:hover:bottom-[0.5em]
             peer-checked:before:translate-x-[2em] peer-checked:before:bg-[lightgreen]"
            ></span>
          </label>
          <span
            onClick={() => setSortType("asc")}
            className={`relative z-10 flex w-12 justify-center items-center py-2 transition-colors duration-300 ${
              sortType === "asc"
                ? "text-first-alt"
                : "text-gray-500 hover:text-gray-700 cursor-pointer"
            }`}
          >
            <i className="uil uil-sort-amount-up text-xl"></i>
          </span>
        </div>

        <div className="flex items-center gap-5 -mt-[99px]">
          <div className="relative flex py-1.5 bg-white shadow-gray-300 border-t-2 border-gray-200">
            <div
              className="absolute top-0 bottom-0 w-28 shadow-gray-400 z-0 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)] border-t-2 border-first bg-gradient-to-b from-[var(--first-color)]/20 to-transparent"
              style={{
                transform: `translateX(${currentCategory.filters.findIndex((item) => item.type === filterType) * 100}%)`,
              }}
            />

            {currentCategory.filters.map((item) => (
              <div
                key={item.type}
                onClick={() => setFilterType(item.type)}
                className={`relative z-10 w-28 flex items-center justify-center gap-2 py-2 rounded-full cursor-pointer transition-transform duration-500 text-sm ${
                  filterType === item.type
                    ? "text-first-alt font-medium scale-[1.15]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className={`uil uil-${item.icon}`}></i>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 self-start">
          <button
            onClick={() => void fetchRankings({ page: 1, append: false })}
            disabled={loading || isLoadingMore}
            className="group relative flex h-[2.8em] items-center overflow-hidden rounded-[0.9em] border-0 bg-first py-[0.35em] pl-[1.2em] pr-[3.3em] text-[17px] font-medium tracking-[0.05em] text-white shadow-[inset_0_0_1.6em_-0.6em_#714da6] whitespace-nowrap cursor-pointer disabled:opacity-70"
          >
            {loading ? "更新中..." : isLoadingMore ? "加载更多中..." : "Get Rank"}
            <span className="icon absolute right-[0.3em] flex h-[2.2em] w-[2.2em] items-center justify-center rounded-[0.7em] bg-white shadow-[0.1em_0.1em_0.6em_0.2em_#7b52b9] transition-all duration-300 group-hover:w-[calc(100%-0.6em)] active:scale-95">
              <i className="uil uil-arrow-right text-[1.1em] text-[#7b52b9] transition-transform duration-300 group-hover:translate-x-[0.1em] group-hover:scale-140"></i>
            </span>
          </button>
        </div>
      </div>

      {!hasRequested ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-2.5 md:mt-15 md:gap-5">
          <div className="text-8xl text-gray-300">
            <i className="uil uil-filter"></i>
          </div>
          <div className="text-lg sm:text-xl md:text-2xl text-gray-800">角逐左家垅之巅</div>
          <div className="text-sm sm:text-base md:text-lg text-gray-500">
            使用上方的排行筛选器，发现更多精彩内容！
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200/80 bg-white/90 p-4 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between md:mb-4 md:gap-2">
            <div className="text-base md:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-red-500 tracking-wider">
              巅峰百强
            </div>
            <div className="text-sm text-gray-500">
              当前排序：{currentFilterLabel}
              （{sortType === "desc" ? "降序" : "升序"}）
            </div>
          </div>

          {errorMessage ? (
            <div className="py-8 text-center md:py-12">
              <div className="text-red-500 text-base">{errorMessage}</div>
              <div className="mt-3 text-gray-500 text-sm">
                你可以点击右上角按钮重试请求。
              </div>
            </div>
          ) : null}

          {!errorMessage && loading ? (
            <div className="py-8 text-center text-gray-500 md:py-12">
              排行榜加载中...
            </div>
          ) : null}

          {!errorMessage &&
          !loading &&
          rankCategory === "resource" &&
          resourceItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {resourceItems.map((item, index) => (
                <RankItemCard
                  key={`${item.course_id}-${index}`}
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

          {!errorMessage &&
          !loading &&
          rankCategory === "course" &&
          courseItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {courseItems.map((item, index) => (
                <RankItemCard
                  key={`${item.id}-${index}`}
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

          {!errorMessage &&
          !loading &&
          rankCategory === "teacher" &&
          teacherItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {teacherItems.map((item, index) => (
                <RankItemCard
                  key={`${item.id}-${index}`}
                  type="teacher"
                  item={{ ...item, rank: item.rank || index + 1 }}
                  filterLabel={
                    currentCategory.filters.find((f) => f.type === filterType)
                      ?.label || ""
                  }
                  filterValue={item[filterType as keyof TeacherRankingItem] as string | number | null | undefined}
                />
              ))}
            </div>
          ) : null}

          {!errorMessage && !loading && currentItemsEmpty ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 md:gap-4 md:py-12">
              <div className="text-7xl text-gray-300">
                <i className="uil uil-filter"></i>
              </div>
              <div className="text-xl text-gray-800">当前条件下暂无数据</div>
              <div className="text-base text-gray-500">
                请切换筛选维度或排序方式后重试。
              </div>
            </div>
          ) : null}

          {!errorMessage && !loading && !currentItemsEmpty ? (
            <div
              ref={loadMoreRef}
              className="flex justify-center py-4 text-sm text-gray-500 md:py-6"
            >
              {isLoadingMore ? "正在加载更多..." : null}
              {!isLoadingMore && !hasMore ? "没有更多内容了" : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
