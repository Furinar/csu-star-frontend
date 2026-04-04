"use client";

import {searchEverything} from "@/api/search";
import SearchResultsGrid from "@/app/(features)/search/components/SearchResultsGrid";
import SupplementRequestModal from "@/components/supplement/SupplementRequestModal";
import SupplementRequestPrompt from "@/components/supplement/SupplementRequestPrompt";
import SearchBar from "@/components/ui/SearchBar";
import {useAuthStore} from "@/store/useAuthStore";
import {feedback} from "@/store/useFeedbackStore";
import type {
  SearchResponse,
  SearchScope,
} from "@/types/search";
import type {SupplementRequestType} from "@/types/supplement";
import {useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {useSearchParams} from "next/navigation";

const PAGE_SIZE = 24;

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
    placeholder: "探索有趣的资源、课程和教师，发现更多精彩内容...",
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
    resources: {total: 0, items: []},
    courses: {total: 0, items: []},
    teachers: {total: 0, items: []},
    all: {total: 0, items: []},
  };
}

function mergeResults(
    previous: SearchResponse,
    incoming: SearchResponse,
    searchType: SearchScope,
) {
  if (searchType === "all") {
    return {
      ...incoming,
      all: {
        ...incoming.all,
        items: [...previous.all.items, ...incoming.all.items],
      },
    };
  }

  if (searchType === "resource") {
    return {
      ...incoming,
      resources: {
        ...incoming.resources,
        items: [...previous.resources.items, ...incoming.resources.items],
      },
    };
  }

  if (searchType === "course") {
    return {
      ...incoming,
      courses: {
        ...incoming.courses,
        items: [...previous.courses.items, ...incoming.courses.items],
      },
    };
  }

  return {
    ...incoming,
    teachers: {
      ...incoming.teachers,
      items: [...previous.teachers.items, ...incoming.teachers.items],
    },
  };
}

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authUser = useAuthStore((state) => state.user);
  const [searchType, setSearchType] = useState<SearchScope>("all");
  const [keyword, setKeyword] = useState("");
  const [, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>(createEmptyResults);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [globalTypeCounts, setGlobalTypeCounts] = useState({
    resource: 0,
    course: 0,
    teacher: 0,
  });
  const [isSupplementModalOpen, setIsSupplementModalOpen] = useState(false);
  const requestIdRef = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const supplementInitialType: SupplementRequestType =
      searchType === "teacher" ? "teacher" : "course";

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

  const runSearch = async ({
                             query,
                             type,
                             page,
                             append,
                           }: {
    query: string;
    type: SearchScope;
    page: number;
    append: boolean;
  }) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      requestIdRef.current += 1;
      setHasSearched(false);
      setIsLoading(false);
      setIsLoadingMore(false);
      setError(null);
      setSubmittedQuery("");
      setCurrentPage(1);
      setResults(createEmptyResults());
      setGlobalTypeCounts({ resource: 0, course: 0, teacher: 0 });
      return;
    }

    const currentRequestId = append
        ? requestIdRef.current
        : requestIdRef.current + 1;

    if (!append) {
      requestIdRef.current = currentRequestId;
      setHasSearched(true);
      setSubmittedQuery(trimmedQuery);
      setIsLoading(true);
      setIsLoadingMore(false);
      setError(null);
      setCurrentPage(1);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await searchEverything({
        q: trimmedQuery,
        type,
        page,
        size: PAGE_SIZE,
      });

      if (requestIdRef.current !== currentRequestId) return;

      if (!append) {
        if (type === "all") {
          try {
            const [resourceData, courseData, teacherData] = await Promise.all([
              searchEverything({ q: trimmedQuery, type: "resource", page: 1, size: 1 }),
              searchEverything({ q: trimmedQuery, type: "course", page: 1, size: 1 }),
              searchEverything({ q: trimmedQuery, type: "teacher", page: 1, size: 1 }),
            ]);

            if (requestIdRef.current !== currentRequestId) return;

            setGlobalTypeCounts({
              resource: resourceData.resources.total,
              course: courseData.courses.total,
              teacher: teacherData.teachers.total,
            });
          } catch {
            if (requestIdRef.current !== currentRequestId) return;
            setGlobalTypeCounts({ resource: 0, course: 0, teacher: 0 });
          }
        } else {
          setGlobalTypeCounts({ resource: 0, course: 0, teacher: 0 });
        }
      }

      setResults((previous) =>
          append ? mergeResults(previous, data, type) : data,
      );
      setCurrentPage(page);
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;

      const message =
          err instanceof Error ? err.message : "搜索失败，请稍后重试。";
      setError(message);

      if (!append) {
        setResults(createEmptyResults());
      }
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

    if (keyword.trim()) {
      void runSearch({
        query: keyword,
        type,
        page: 1,
        append: false,
      });
      return;
    }

    setHasSearched(false);
    setIsLoading(false);
    setIsLoadingMore(false);
    setError(null);
    setCurrentPage(1);
    setResults(createEmptyResults());
  };

  const handleSearch = async (value: string) => {
    setKeyword(value);
    await runSearch({query: value, type: searchType, page: 1, append: false});
  };

  const showEmptyPrompt = !hasSearched && !isLoading;
  const showNoResults =
      hasSearched && !isLoading && !error && summary.total === 0;

  useEffect(() => {
    const typeParam = searchParams.get("type");
    const qParam = searchParams.get("q");
    const normalizedType =
        typeParam === "resource" ||
        typeParam === "course" ||
        typeParam === "teacher"
            ? typeParam
            : "all";

    setSearchType(normalizedType);
    setKeyword(qParam ?? "");

    if (qParam?.trim()) {
      void runSearch({
        query: qParam,
        type: normalizedType,
        page: 1,
        append: false,
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

    if (!node || !hasSearched || isLoading || isLoadingMore || !hasMore || error) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (!entry?.isIntersecting) return;

      void runSearch({
        query: keyword,
        type: searchType,
        page: currentPage + 1,
        append: true,
      });
    }, {rootMargin: "240px 0px"});

    observer.observe(node);

    return () => observer.disconnect();
  }, [
    currentPage,
    error,
    hasMore,
    hasSearched,
    isLoading,
    isLoadingMore,
    keyword,
    searchType,
  ]);

  const handleOpenSupplementModal = () => {
    if (!authUser) {
      feedback.warning({
        title: "请先登录",
        description: "登录后才能提交补录申请。",
      });
      router.push("/login");
      return;
    }

    setIsSupplementModalOpen(true);
  };

  return (
      <div className="container flex flex-col gap-10 mt-10 mb-20">
        {/* Retained your original Hero and Searchbar UI unchanged */}
        <div className="w-full flex justify-center items-center flex-col gap-3">
          <div className="hero-gradient-text text-4xl font-bold">风影情报处</div>
          <div className="text-gray-600">
            Explore freely, discover what you need.
          </div>
        </div>

        <div className="flex flex-col gap-5 items-center">
          <div className="relative flex p-1.5 bg-gray-100 rounded-full shadow-inner shadow-gray-300">
            <div
                className="absolute top-1.5 bottom-1.5 w-28 bg-white rounded-full shadow-md z-0 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)]"
                style={{
                  transform: `translateX(${searchConfig.findIndex((item) => item.type === searchType) * 100}%)`,
                }}
            />
            {searchConfig.map((item) => (
                <span
                    key={item.type}
                    onClick={() => handleSearchTypeChange(item.type)}
                    className={`relative z-10 w-28 flex items-center justify-center gap-2 py-2 rounded-full cursor-pointer transition-colors duration-300 ${
                        searchType === item.type
                            ? "text-first-alt font-medium"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                >
              <i className={`uil uil-${item.icon} text-lg`}></i>
                  {item.label}
            </span>
            ))}
          </div>
          <div className="w-full max-w-2xl">
            <SearchBar
                value={keyword}
                onChange={setKeyword}
                onSearch={handleSearch}
                debounceOnChange={false}
                placeholder={currentSearchType?.placeholder}
            />
          </div>
        </div>

        <div className="border-t border-gray-300"/>

        {/* Conditional rendering based on search state */}
        {showEmptyPrompt ? (
            <div className="flex flex-col gap-5 items-center justify-center mt-15">
              <div className="text-8xl text-gray-300">
                <i className="uil uil-search"></i>
              </div>

              <div className="text-2xl text-gray-800">
                开始搜索{currentSearchType?.label}吧！
              </div>
              <div className="text-lg text-gray-500">
                使用上方的搜索工具栏，输入关键词，发现更多精彩内容！
              </div>
            </div>
        ) : null}

        {isLoading ? (
            <div className="flex flex-col gap-5 items-center justify-center mt-10">
              <div className="text-4xl text-first-alt animate-spin">
                <i className="uil uil-spinner-alt"></i>
              </div>
              <div className="text-gray-500">正在拼命搜索中...</div>
            </div>
        ) : null}

        {error ? (
            <div
                className="flex flex-col items-center justify-center mt-10 bg-red-50 p-6 rounded-2xl border border-red-200 shadow-sm max-w-2xl mx-auto w-full">
              <div className="text-red-500 text-4xl mb-3">
                <i className="uil uil-exclamation-triangle"></i>
              </div>
              <div className="text-red-700 font-medium">搜索请求失败</div>
              <div className="text-red-600 text-sm mt-1">{error}</div>
            </div>
        ) : null}

        {showNoResults ? (
            <div className="flex flex-col gap-6 items-center justify-center mt-15">
              <div className="text-8xl text-gray-300">
                <i className="uil uil-tear"></i>
              </div>

              <div className="text-2xl text-gray-800">
                没有找到匹配的{currentSearchType?.label}
              </div>
              <div className="text-lg text-gray-500">
                可以尝试换一个简短的关键词重新搜索看看~
              </div>

              <div className="w-full max-w-2xl">
                <SupplementRequestPrompt
                    onClick={handleOpenSupplementModal}
                    align="center"
                    className="rounded-[28px] border border-slate-200 bg-slate-50/70 px-6 py-5"
                />
              </div>
            </div>
        ) : null}

        {!isLoading && !error && hasSearched && summary.total > 0 ? (
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  找到相关的{" "}
                  <span className="font-semibold text-gray-800">{summary.total}</span>{" "}
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

              <SearchResultsGrid items={displayedItems} />

              {isLoadingMore ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    正在加载更多结果...
                  </div>
              ) : null}

              {!isLoadingMore && !hasMore ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-6">
                    <div className="text-sm text-gray-400">已经到底了</div>
                    <div className="w-full max-w-3xl">
                      <SupplementRequestPrompt
                          onClick={handleOpenSupplementModal}
                          align="center"
                          className="rounded-[28px] border border-slate-200 bg-slate-50/70 px-6 py-5"
                      />
                    </div>
                  </div>
              ) : null}

              <div ref={loadMoreRef} className="h-1"/>
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
