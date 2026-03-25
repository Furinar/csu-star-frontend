"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import RatingBar from "@/components/ui/RatingBar";
import {
  getCourseDetail,
  getCourseRankings,
  getResourceRankings,
  getTeacherDetail,
  getTeacherRankings,
} from "@/api/ranking";
import {
  CourseDetail,
  CourseRankType,
  RankingItem,
  ResourceRankingItem,
  ResourceRankType,
  TeacherDetail,
  TeacherRankType,
} from "@/types/ranking";

const rankConfig = [
  {
    category: "resource",
    label: "资源",
    icon: "file-alt",
    filters: [
      {type: "comprehensive", label: "综合", icon: "award"},
      {type: "downloads", label: "下载量", icon: "import"},
      {type: "semester", label: "学期", icon: "schedule"},
      {type: "created_at", label: "上传", icon: "upload"},
      {type: "hot_score", label: "热度", icon: "fire"},
      {type: "likes", label: "点赞", icon: "thumbs-up"},
    ],
  },
  {
    category: "course",
    label: "课程",
    icon: "graduation-cap",
    filters: [
      {type: "avg_score", label: "综合", icon: "award"},
      {type: "avg_homework", label: "作业", icon: "book-open"},
      {type: "avg_gain", label: "收获", icon: "brain"},
      {type: "avg_exam_diff", label: "考试", icon: "brackets-curly"},
      {type: "resource_count", label: "资源数", icon: "file-alt"},
      {type: "hot", label: "热度", icon: "fire"},
    ],
  },
  {
    category: "teacher",
    label: "教师",
    icon: "users-alt",
    filters: [
      {type: "avg_score", label: "综合", icon: "award"},
      {type: "avg_quality", label: "教学", icon: "book-open"},
      {type: "avg_grading", label: "给分", icon: "chart-bar"},
      {type: "avg_attendance", label: "考勤", icon: "bell-school"},
      {type: "hot_score", label: "热度", icon: "fire"},
      {type: "eval_count", label: "评价数", icon: "comment-alt-lines"},
    ],
  },
] as const;

type RankCategory = (typeof rankConfig)[number]["category"];
type FilterType = (typeof rankConfig)[number]["filters"][number]["type"];

const PAGE_SIZE = 20;

export default function Rank() {
  const [rankCategory, setRankCategory] = useState<RankCategory>("resource");
  const [filterType, setFilterType] = useState<FilterType>("downloads");
  const [sortType, setSortType] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [total, setTotal] = useState(0);
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [resourceItems, setResourceItems] = useState<ResourceRankingItem[]>([]);
  const [courseDetails, setCourseDetails] = useState<Record<number, CourseDetail>>({});
  const [teacherDetails, setTeacherDetails] = useState<Record<number, TeacherDetail>>({});

  const currentCategory = useMemo(() => {
    return rankConfig.find((item) => item.category === rankCategory) || rankConfig[0];
  }, [rankCategory]);

  useEffect(() => {
    setFilterType(currentCategory.filters[0].type as FilterType);
  }, [currentCategory]);

  const formatNumber = useCallback((value?: number, digits = 2) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "--";
    }
    return value.toFixed(digits);
  }, []);

  const formatInteger = useCallback((value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "--";
    }
    return value.toLocaleString("zh-CN");
  }, []);

  const formatSemester = useCallback(
    (start?: string | null, end?: string | null) => {
      if (!start && !end) return "--";
      if (!start) return end || "--";
      if (!end || end === start) return start;
      return `${start} ~ ${end}`;
    },
    []
  );

  const formatDateTime = useCallback((value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("zh-CN", { hour12: false });
  }, []);

  const loadCourseDetails = useCallback(async (items: RankingItem[]) => {
    const pairs = await Promise.all(
      items.map(async (item) => {
        try {
          const detail = await getCourseDetail(item.id);
          return [item.id, detail] as const;
        } catch {
          return null;
        }
      })
    );
    const mapped: Record<number, CourseDetail> = {};
    pairs.forEach((entry) => {
      if (entry) {
        mapped[entry[0]] = entry[1];
      }
    });
    return mapped;
  }, []);

  const loadTeacherDetails = useCallback(async (items: RankingItem[]) => {
    const pairs = await Promise.all(
      items.map(async (item) => {
        try {
          const detail = await getTeacherDetail(item.id);
          return [item.id, detail] as const;
        } catch {
          return null;
        }
      })
    );
    const mapped: Record<number, TeacherDetail> = {};
    pairs.forEach((entry) => {
      if (entry) {
        mapped[entry[0]] = entry[1];
      }
    });
    return mapped;
  }, []);

  const fetchRankings = useCallback(async () => {
    setHasRequested(true);
    setLoading(true);
    setErrorMessage("");
    setCourseDetails({});
    setTeacherDetails({});

    try {
      if (rankCategory === "resource") {
        const result = await getResourceRankings({
          rank_type: filterType as ResourceRankType,
          page: 1,
          size: PAGE_SIZE,
          period: "all",
          is_increased: sortType === "asc",
        });
        setResourceItems(result.items);
        setRankingItems([]);
        setTotal(result.total);
        return;
      }

      if (rankCategory === "course") {
        const result = await getCourseRankings({
          rank_type: filterType as CourseRankType,
          page: 1,
          size: PAGE_SIZE,
          period: "all",
          is_increased: sortType === "asc",
        });
        setRankingItems(result.items);
        setResourceItems([]);
        setTotal(result.total);
        const detailMap = await loadCourseDetails(result.items);
        setCourseDetails(detailMap);
        return;
      }

      const result = await getTeacherRankings({
        rank_type: filterType as TeacherRankType,
        page: 1,
        size: PAGE_SIZE,
        period: "all",
        is_increased: sortType === "asc",
      });
      setRankingItems(result.items);
      setResourceItems([]);
      setTotal(result.total);
      const detailMap = await loadTeacherDetails(result.items);
      setTeacherDetails(detailMap);
    } catch (error) {
      console.error(error);
      setErrorMessage("排行榜接口异常，请稍后重试。");
      setRankingItems([]);
      setResourceItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    filterType,
    loadCourseDetails,
    loadTeacherDetails,
    rankCategory,
    sortType,
  ]);

  useEffect(() => {
    setHasRequested(false);
    setErrorMessage("");
  }, [rankCategory, filterType, sortType]);

  return (
    <>
      <div className="container flex flex-col gap-10 mt-10">
        <div className="flex justify-center items-center flex-col gap-3 w-full">
          <div className="hero-gradient-text text-4xl font-bold">
            天梯风云榜
          </div>
          <div className="text-gray-600">
            Rise step by step, witness the top glory.
          </div>
        </div>

        <div className="flex flex-col gap-5 items-center">
          <div className="flex gap-5">
            <div className="relative flex p-1.5 bg-gray-100 rounded-full shadow-inner shadow-gray-300 ">
              <div
                className="absolute bg-white top-1.5 bottom-1.5 w-28 rounded-full shadow-md z-0 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.44)]"
                style={{
                  transform: `translateX(${
                    rankConfig.findIndex((item) => item.category === rankCategory) * 100
                  }%)`,
                }}
              />

              {rankConfig.map((item) => (
                <span
                  key={item.category}
                  onClick={() => setRankCategory(item.category)}
                  className={`relative z-10 w-28 flex justify-center items-center gap-2 py-2 rounded-full cursor-pointer transition-colors duration-300 ${
                    rankCategory === item.category ? "text-first-alt font-medium" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <i className={`uil uil-${item.icon}`}></i>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className=" border-t border-gray-300" />

        <div className="flex justify-between items-center">
          <div className="flex mt-5">
            <span
              onClick={() => setSortType("desc")}
              className={`relative z-10 w-12 flex justify-center items-center py-2 transition-colors duration-300 ${
                sortType === "desc" ? "text-first-alt" : "text-gray-500 hover:text-gray-700 cursor-pointer"
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
              className={`relative z-10 w-12 flex justify-center items-center py-2 transition-colors duration-300 ${
                sortType === "asc" ? "text-first-alt" : "text-gray-500 hover:text-gray-700 cursor-pointer"
              }`}
            >
              <i className="uil uil-sort-amount-up text-xl"></i>
            </span>
          </div>

          <div className="flex items-center gap-5 -mt-[99px]">
            <div
              className="relative flex py-1.5 bg-white shadow-gray-300 border-t-2 border-gray-200">
              <div
                className="absolute top-0 bottom-0 w-28 shadow-gray-400 z-0 transition-transform duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)] border-t-2 border-first bg-gradient-to-b from-[var(--first-color)]/20 to-transparent"
                style={{
                  transform: `translateX(${
                    currentCategory.filters.findIndex((item) => item.type === filterType) * 100
                  }%)`,
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

          <div className="mt-5">
            <button
              onClick={fetchRankings}
              disabled={loading}
              className="group bg-first text-white font-inherit py-[0.35em] pl-[1.2em] pr-[3.3em] text-[17px] font-medium rounded-[0.9em] border-0 tracking-[0.05em] flex items-center shadow-[inset_0_0_1.6em_-0.6em_#714da6] overflow-hidden relative h-[2.8em] cursor-pointer disabled:opacity-70"
            >
              {loading ? "更新中..." : "Get Rank"}
              <span
                className="icon bg-white ml-[1em] absolute flex items-center justify-center h-[2.2em] w-[2.2em] rounded-[0.7em] shadow-[0.1em_0.1em_0.6em_0.2em_#7b52b9] right-[0.3em] transition-all duration-300 group-hover:w-[calc(100%-0.6em)] active:scale-95">
                <i
                  className="uil uil-arrow-right
                text-[1.1em] text-[#7b52b9]
                transition-transform duration-300 group-hover:translate-x-[0.1em] group-hover:scale-140"
                ></i>
              </span>
            </button>
          </div>
        </div>

        {!hasRequested ? (
          <div className="flex flex-col gap-5 items-center justify-center mt-15">
            <div className="text-8xl text-gray-300">
              <i className="uil uil-filter"></i>
            </div>
            <div className="text-2xl text-gray-800">角逐左家垅之巅</div>
            <div className="text-lg text-gray-500">
              使用上方的排行筛选器，发现更多精彩内容！
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base md:text-lg font-semibold text-gray-800">
                共 {formatInteger(total)} 条记录
              </div>
              <div className="text-sm text-gray-500">
                当前排序：{currentCategory.filters.find((item) => item.type === filterType)?.label || "--"}（{sortType === "desc" ? "降序" : "升序"}）
              </div>
            </div>

            {errorMessage ? (
              <div className="py-12 text-center">
                <div className="text-red-500 text-base">{errorMessage}</div>
                <div className="mt-3 text-gray-500 text-sm">你可以点击右上角按钮重试请求。</div>
              </div>
            ) : null}

            {!errorMessage && loading ? (
              <div className="py-12 text-center text-gray-500">排行榜加载中...</div>
            ) : null}

            {!errorMessage && !loading && rankCategory === "resource" && resourceItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {resourceItems.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-4 md:px-5 md:py-5 shadow-[0_8px_22px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-[var(--first-color)]/10 text-first-alt font-semibold text-sm flex items-center justify-center">
                            {item.rank || index + 1}
                          </span>
                          <div className="text-lg font-semibold text-gray-800">{item.title}</div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>资源 ID：{item.id}</span>
                          <span>课程 ID：{item.course_id || "--"}</span>
                          <span>资源类型：{item.resource_type || "--"}</span>
                          <span>适用学期：{formatSemester(item.semester_start, item.semester_end)}</span>
                          <span>上传时间：{formatDateTime(item.created_at)}</span>
                          <span>积分：{typeof item.points_cost === "number" ? item.points_cost : "--"}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 md:text-right">
                        <div>综合：{formatNumber(item.score)}</div>
                        <div>下载：{formatInteger(item.downloads)}</div>
                        <div>浏览：{formatInteger(item.views)}</div>
                        <div>点赞：{formatInteger(item.likes)}</div>
                        <div>热度：{formatNumber(item.hot_score)}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <RatingBar
                        label="综合指数"
                        score={typeof item.score === "number" ? item.score : 0}
                        maxScore={5}
                        color={0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!errorMessage && !loading && rankCategory !== "resource" && rankingItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {rankingItems.map((item, index) => {
                  if (rankCategory === "course") {
                    const detail = courseDetails[item.id];
                    return (
                      <div
                        key={`${item.id}-${index}`}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-4 md:px-5 md:py-5 shadow-[0_8px_22px_rgba(0,0,0,0.04)]"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full bg-[var(--first-color)]/10 text-first-alt font-semibold text-sm flex items-center justify-center">
                                {item.rank || index + 1}
                              </span>
                              <div className="text-lg font-semibold text-gray-800">{item.name}</div>
                            </div>
                            <div className="mt-2 text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span>课程 ID：{item.id}</span>
                              <span>课程代码：{detail?.code || "--"}</span>
                              <span>课程类型：{detail?.course_type || "--"}</span>
                              <span>学分：{typeof detail?.credits === "number" ? detail.credits : "--"}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 md:text-right">
                            <div>榜单分值：{formatNumber(item.score)}</div>
                            <div>评价数：{formatInteger(detail?.eval_count)}</div>
                            <div>资源数：{formatInteger(detail?.resource_count)}</div>
                            <div>热度：{formatNumber(detail?.hot_score)}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <RatingBar label="综合评分" score={detail?.avg_score || item.score} maxScore={5} color={0} />
                          <RatingBar label="作业量" score={detail?.avg_homework || 0} maxScore={5} color={1} />
                          <RatingBar label="收获感" score={detail?.avg_gain || 0} maxScore={5} color={2} />
                          <RatingBar label="考试难度" score={detail?.avg_exam_diff || 0} maxScore={5} color={3} />
                        </div>
                      </div>
                    );
                  }

                  const detail = teacherDetails[item.id];
                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-4 md:px-5 md:py-5 shadow-[0_8px_22px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-[var(--first-color)]/10 text-first-alt font-semibold text-sm flex items-center justify-center">
                              {item.rank || index + 1}
                            </span>
                            <div className="text-lg font-semibold text-gray-800">{item.name}</div>
                          </div>
                          <div className="mt-2 text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>教师 ID：{item.id}</span>
                            <span>所属学院：{item.department_name || "--"}</span>
                            <span>职称：{detail?.title || "--"}</span>
                            <span>热度：{formatNumber(detail?.hot_score)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 md:text-right">
                          <div>榜单分值：{formatNumber(item.score)}</div>
                          <div>评价数：{formatInteger(detail?.eval_count)}</div>
                          <div>热度：{formatNumber(detail?.hot_score)}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <RatingBar label="综合评分" score={detail?.avg_score || item.score} maxScore={5} color={0} />
                        <RatingBar label="教学质量" score={detail?.avg_quality || 0} maxScore={5} color={1} />
                        <RatingBar label="给分宽松" score={detail?.avg_grading || 0} maxScore={5} color={2} />
                        <RatingBar label="考勤要求" score={detail?.avg_attendance || 0} maxScore={5} color={3} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!errorMessage &&
            !loading &&
            ((rankCategory === "resource" && resourceItems.length === 0) ||
              (rankCategory !== "resource" && rankingItems.length === 0)) ? (
              <div className="flex flex-col gap-4 items-center justify-center py-12">
                <div className="text-7xl text-gray-300">
                  <i className="uil uil-filter"></i>
                </div>
                <div className="text-xl text-gray-800">当前条件下暂无数据</div>
                <div className="text-base text-gray-500">请切换筛选维度或排序方式后重试。</div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
