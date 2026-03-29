"use client";

import { searchEverything } from "@/api/search";
import SearchResultCard from "@/app/(features)/search/components/SearchResultCard";
import SearchBar from "@/components/ui/SearchBar";
import type {
  SearchCourseItem,
  SearchResourceCard,
  SearchResponse,
  SearchScope,
  SearchTeacherItem,
} from "@/types/search";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

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
    resources: { total: 0, items: [] },
    courses: { total: 0, items: [] },
    teachers: { total: 0, items: [] },
  };
}

function renderCard(
  type: "course" | "teacher" | "resource",
  item: SearchCourseItem | SearchTeacherItem | SearchResourceCard,
) {
  if (type === "course") {
    return <SearchResultCard type="course" item={item as SearchCourseItem} />;
  }

  if (type === "teacher") {
    return <SearchResultCard type="teacher" item={item as SearchTeacherItem} />;
  }

  return <SearchResultCard type="resource" item={item as SearchResourceCard} />;
}

export default function Search() {
  const searchParams = useSearchParams();
  const [searchType, setSearchType] = useState<SearchScope>("all");
  const [keyword, setKeyword] = useState("");
  const [, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>(createEmptyResults);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const currentSearchType = useMemo(() => {
    return (
      searchConfig.find((option) => option.type === searchType) ??
      searchConfig[0]
    );
  }, [searchType]);

  const summary = useMemo(() => {
    const counts = {
      resource: results.resources.items.length,
      course: results.courses.items.length,
      teacher: results.teachers.items.length,
    };

    return {
      counts,
      total: counts.resource + counts.course + counts.teacher,
    };
  }, [results]);

  const sections = useMemo(() => {
    if (searchType === "resource") {
      return [
        {
          key: "resource",
          title: "资源结果",
          description: "按课程聚合展示命中的资源结果。",
          items: results.resources.items,
        },
      ];
    }

    if (searchType === "course") {
      return [
        {
          key: "course",
          title: "课程结果",
          description: "展示课程评分、数据和资源情况。",
          items: results.courses.items,
        },
      ];
    }

    if (searchType === "teacher") {
      return [
        {
          key: "teacher",
          title: "教师结果",
          description: "展示教师教学画像与评价概况。",
          items: results.teachers.items,
        },
      ];
    }

    return [
      {
        key: "course",
        title: "课程结果",
        description: "展示课程评分、数据和资源情况。",
        items: results.courses.items,
      },
      {
        key: "teacher",
        title: "教师结果",
        description: "展示教师教学画像与评价概况。",
        items: results.teachers.items,
      },
      {
        key: "resource",
        title: "资源结果",
        description: "资源搜索按课程聚合展示。",
        items: results.resources.items,
      },
    ].filter((section) => section.items.length > 0);
  }, [results, searchType]);

  const handleSearchTypeChange = (type: SearchScope) => {
    requestIdRef.current += 1;
    setSearchType(type);
    setHasSearched(false);
    setIsLoading(false);
    setError(null);
    setResults(createEmptyResults());
  };

  const handleSearch = async (value: string) => {
    const trimmedValue = value.trim();
    setKeyword(value);

    if (!trimmedValue) {
      requestIdRef.current += 1;
      setHasSearched(false);
      setIsLoading(false);
      setError(null);
      setSubmittedQuery("");
      setResults(createEmptyResults());
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setHasSearched(true);
    setSubmittedQuery(trimmedValue);
    setIsLoading(true);
    setError(null);

    try {
      const data = await searchEverything({
        q: trimmedValue,
        type: searchType,
        page: 1,
        size: 24,
      });

      if (requestIdRef.current !== currentRequestId) return;
      setResults(data);
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;

      const message =
        err instanceof Error ? err.message : "搜索失败，请稍后重试。";
      setError(message);
      setResults(createEmptyResults());
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setIsLoading(false);
      }
    }
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
      void (async () => {
        const currentRequestId = requestIdRef.current + 1;
        requestIdRef.current = currentRequestId;
        setHasSearched(true);
        setSubmittedQuery(qParam.trim());
        setIsLoading(true);
        setError(null);

        try {
          const data = await searchEverything({
            q: qParam.trim(),
            type: normalizedType,
            page: 1,
            size: 24,
          });

          if (requestIdRef.current !== currentRequestId) return;
          setResults(data);
        } catch (err) {
          if (requestIdRef.current !== currentRequestId) return;
          const message =
            err instanceof Error ? err.message : "搜索失败，请稍后重试。";
          setError(message);
          setResults(createEmptyResults());
        } finally {
          if (requestIdRef.current === currentRequestId) {
            setIsLoading(false);
          }
        }
      })();
    } else {
      setResults(createEmptyResults());
      setHasSearched(false);
      setIsLoading(false);
      setError(null);
      setSubmittedQuery("");
    }
  }, [searchParams]);

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

      <div className="border-t border-gray-300" />

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
        <div className="flex flex-col items-center justify-center mt-10 bg-red-50 p-6 rounded-2xl border border-red-200 shadow-sm max-w-2xl mx-auto w-full">
          <div className="text-red-500 text-4xl mb-3">
            <i className="uil uil-exclamation-triangle"></i>
          </div>
          <div className="text-red-700 font-medium">搜索请求失败</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      ) : null}

      {showNoResults ? (
        <div className="flex flex-col gap-5 items-center justify-center mt-15">
          <div className="text-8xl text-gray-300">
            <i className="uil uil-tear"></i>
          </div>

          <div className="text-2xl text-gray-800">
            没有找到匹配的{currentSearchType?.label}
          </div>
          <div className="text-lg text-gray-500">
            可以尝试换一个简短的关键词重新搜索看看~
          </div>
        </div>
      ) : null}

      {/* Render Results */}
      {!isLoading && !error && hasSearched && summary.total > 0 ? (
        <div className="flex flex-col gap-10">
          {/* Summary */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            找到相关的{" "}
            <span className="font-semibold text-gray-800">{summary.total}</span>{" "}
            条结果
            {searchType === "all" && (
              <div className="flex gap-3 ml-2 border-l border-gray-300 pl-4">
                <span>课程: {summary.counts.course}</span>
                <span>教师: {summary.counts.teacher}</span>
                <span>资源: {summary.counts.resource}</span>
              </div>
            )}
          </div>

          {/* Result Sections */}
          <div className="flex flex-col gap-12">
            {sections.map((section) => (
              <section key={section.key} className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {section.title}
                  </h2>
                  <span className="bg-gray-100 text-gray-500 text-sm px-2 py-0.5 rounded-full">
                    {section.items.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.items.map((item) => (
                    <div
                      key={`${section.key}-${"id" in item ? item.id : JSON.stringify(item)}`}
                    >
                      {renderCard(
                        section.key as "course" | "teacher" | "resource",
                        item,
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
