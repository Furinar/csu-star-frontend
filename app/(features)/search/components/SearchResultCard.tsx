import type { ReactNode } from "react";
import Link from "next/link";
import EntityTypeBadge from "@/components/ui/EntityTypeBadge";
import { isPublicCourseType } from "@/lib/courseType";
import { getEntityTheme } from "@/lib/entityTheme";
import type {
  SearchCourseItem,
  SearchResourceCard,
  SearchTeacherItem,
} from "@/types/search";
import {
  buildCoursePath,
  buildResourceCollectionPath,
  buildTeacherPath,
} from "@/lib/paths";

type SearchResultCardProps =
  | {
      type: "course";
      item: SearchCourseItem;
      className?: string;
    }
  | {
      type: "teacher";
      item: SearchTeacherItem;
      className?: string;
    }
  | {
      type: "resource";
      item: SearchResourceCard;
      className?: string;
    };

function clampScore(value?: number | null) {
  if (value === null || typeof value === "undefined" || Number.isNaN(value))
    return 0;
  return Math.min(Math.max(value, 0), 5);
}

function formatScore(value?: number | null, digits = 2) {
  if (value === null || typeof value === "undefined") return "--";
  return value.toFixed(digits);
}

function StarRating({
  value,
  fullClassName,
}: {
  value?: number | null;
  fullClassName: string;
}) {
  const score = clampScore(value);

  return (
    <div className="flex items-center gap-0.5 text-xs">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill =
          score >= i + 1 ? 100 : score > i ? Math.round((score - i) * 100) : 0;

        return (
          <span key={i} className="relative inline-flex text-sm leading-none">
            <span className="text-gray-200">★</span>
            <span
              className={`absolute inset-y-0 left-0 overflow-hidden ${fullClassName}`}
              style={{ width: `${fill}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

function BarRow({
  label,
  value,
  colorClass = "bg-blue-500",
  hideBarOnMobile = false,
}: {
  label: string;
  value?: number | null;
  colorClass?: string;
  hideBarOnMobile?: boolean;
}) {
  const score = clampScore(value);
  return (
    <div
      className={`flex items-center text-xs ${hideBarOnMobile ? "justify-between md:gap-2" : "gap-2"}`}
    >
      <span
        className={`${hideBarOnMobile ? "min-w-0 flex-1 md:w-16 md:flex-none" : "w-16"} truncate text-gray-500`}
      >
        {label}
      </span>
      <div
        className={`${hideBarOnMobile ? "hidden md:block" : ""} h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100`}
      >
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${(score / 5) * 100}%` }}
        ></div>
      </div>
      <span
        className={`${hideBarOnMobile ? "ml-3 w-auto shrink-0 md:w-6" : "w-6"} text-right font-medium tabular-nums text-gray-600`}
      >
        {formatScore(value)}
      </span>
    </div>
  );
}

export default function SearchResultCard(props: SearchResultCardProps) {
  const { type, className = "" } = props;
  const theme = getEntityTheme(type);

  let href = "#";
  let title = "";
  let isPublic = false;
  let subtitleIcon = "";
  let subtitleContent: ReactNode = null;
  let leftScoreTitle = "总体评分";
  let leftScoreValue: number | null = null;
  let leftScoreHint = "";
  let rightDetailsTitle = "";
  let rightDetailsIcon = "";
  let rightDetailsContent: ReactNode = null;
  let bottomStats: Array<{
    icon: string;
    label: string;
    value: string | number;
  }> = [];

  if (type === "course") {
    const item = props.item;
    href = buildCoursePath(item.id);
    title = item.name;
    isPublic = isPublicCourseType(item.course_type);
    const teachers = item.teachers ?? [];
    const teacherCount = item.teacher_count ?? teachers.length;
    subtitleIcon = "uil-users-alt";
    subtitleContent = (
      <div className="flex w-full min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
        {teachers.slice(0, 3).map((teacher, index) => (
          <span
            key={teacher.id}
            className={`bg-gray-100 px-2 py-0.5 rounded-full text-[11px] text-gray-600 ${index > 0 ? "hidden md:inline-block shrink-0" : "min-w-0 truncate"}`}
          >
            {teacher.name}
          </span>
        ))}
        {teacherCount > 0 ? (
          <span className="shrink-0 ml-1 text-[11px] text-gray-400">
            共{teacherCount}位教师
          </span>
        ) : (
          <span className="shrink-0 text-[11px] text-gray-400">暂无教师</span>
        )}
      </div>
    );
    leftScoreValue = item.avg_score ?? 0;
    leftScoreHint = "/ 5.0";
    rightDetailsTitle = "详细评分";
    rightDetailsIcon = "uil-chart-bar";
    rightDetailsContent = (
      <>
        <BarRow
          label="收获感"
          value={item.avg_gain}
          colorClass={theme.dimensionBarClassNames[0]}
          hideBarOnMobile
        />
        <BarRow
          label="作业量"
          value={item.avg_homework}
          colorClass={theme.dimensionBarClassNames[1]}
          hideBarOnMobile
        />
        <BarRow
          label="考试难度"
          value={item.avg_exam_diff}
          colorClass={theme.dimensionBarClassNames[2]}
          hideBarOnMobile
        />
      </>
    );
    bottomStats = [
      {
        icon: "uil-comment-alt-lines",
        label: "评价",
        value: item.eval_count ?? 0,
      },
      { icon: "uil-bookmark", label: "收藏", value: item.favorite_count ?? 0 },
    ];
  } else if (type === "teacher") {
    const item = props.item;
    href = buildTeacherPath(item.id);
    title = item.name;
    const courses = item.courses ?? [];
    subtitleIcon = "uil-bag";
    subtitleContent = (
      <div className="flex w-full min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
        <span className="shrink-0 text-[11px] text-gray-600">
          {item.department_name || item.title || "未录入职称"}
        </span>
        <span className="shrink-0 text-[11px] text-gray-300">|</span>
        {courses.length > 0 ? (
          <>
            {courses.slice(0, 1).map((course) => (
              <span
                key={course.id}
                className="min-w-0 truncate rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
              >
                {course.name}
              </span>
            ))}
            <span className="shrink-0 text-[11px] text-gray-400">
              共{courses.length}门课程
            </span>
          </>
        ) : (
          <span className="shrink-0 text-[11px] text-gray-400">暂无关联课程</span>
        )}
      </div>
    );
    leftScoreValue = item.avg_score ?? 0;
    leftScoreHint = "/ 5.0";
    rightDetailsTitle = "详细评分";
    rightDetailsIcon = "uil-chart-bar";
    rightDetailsContent = (
      <>
        <BarRow
          label="教学质量"
          value={item.avg_quality}
          colorClass={theme.dimensionBarClassNames[0]}
          hideBarOnMobile
        />
        <BarRow
          label="给分宽松"
          value={item.avg_grading}
          colorClass={theme.dimensionBarClassNames[1]}
          hideBarOnMobile
        />
        <BarRow
          label="考勤要求"
          value={item.avg_attendance}
          colorClass={theme.dimensionBarClassNames[2]}
          hideBarOnMobile
        />
      </>
    );
    bottomStats = [
      {
        icon: "uil-comment-alt-lines",
        label: "评价",
        value: item.eval_count ?? 0,
      },
      { icon: "uil-bookmark", label: "收藏", value: item.favorite_count ?? 0 },
    ];
  } else {
    const item = props.item;
    href = buildResourceCollectionPath(item.course_id);
    title = item.course_name;
    isPublic = isPublicCourseType(item.course_type);
    subtitleIcon = "uil-folder-open";
    subtitleContent = (
      <span className="text-xs text-gray-600">课程资源合集</span>
    );
    leftScoreTitle = "课程评分";
    leftScoreValue = item.avg_score ?? 0;
    leftScoreHint = "/ 5.0";
    rightDetailsTitle = "合集概况";
    rightDetailsIcon = "uil-analytics";
    rightDetailsContent = (
      <div className="flex flex-col gap-2 justify-center h-full text-xs text-gray-600">
        <div className="flex items-center justify-between gap-2">
          <span>资源总数</span>
          <span className="font-medium text-gray-700">
            {item.resource_count}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>累计下载</span>
          <span className="font-medium text-gray-700">
            {item.download_total ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>累计点赞</span>
          <span className="font-medium text-gray-700">
            {item.like_total ?? 0}
          </span>
        </div>
      </div>
    );
    bottomStats = [
      { icon: "uil-file-alt", label: "资料", value: item.resource_count ?? 0 },
      {
        icon: "uil-cloud-download",
        label: "总下载",
        value: item.download_total ?? 0,
      },
      { icon: "uil-bookmark", label: "收藏", value: item.favorite_count ?? 0 },
    ];
  }

  return (
    <Link
      href={href}
      className={`relative flex flex-col h-[220px] md:h-[260px] max-w-[460px] mx-auto w-full bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="absolute transform scale-75 origin-top-right md:scale-100 top-2 right-2 md:top-4 md:right-4">
        <EntityTypeBadge type={type} />
      </div>

      <div className="p-3 md:p-5 flex flex-col h-full">
        <div className="mb-2 md:mb-4 h-[44px] md:h-[52px]">
          <div className="flex items-center gap-2 pr-12 md:pr-16">
            <h3
              className="text-sm md:text-lg font-bold text-gray-800 line-clamp-1"
              title={title}
            >
              {title}
            </h3>
            {isPublic ? (
              <span className="bg-amber-50 border border-amber-200 text-amber-600 px-1 md:px-1.5 py-px md:py-0.5 text-[8px] md:text-[10px] font-medium rounded whitespace-nowrap hidden sm:inline-block">
                公选
              </span>
            ) : null}
          </div>
          <div className="flex w-full items-center gap-1 md:gap-1.5 mt-1 text-xs md:text-sm text-gray-500 truncate">
            <i className={`uil ${subtitleIcon} text-gray-400 mt-0.5`}></i>
            {subtitleContent}
          </div>
        </div>

        <div className="flex flex-1 gap-1 md:gap-4 mt-1 mb-1 md:mt-2 md:mb-2 min-h-[70px] md:min-h-[90px]">
          <div className="w-[80px] md:w-[120px] flex flex-col items-center justify-center border-r border-gray-100 pr-1 md:pr-4">
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500 mb-1 md:mb-1.5">
              <i className="uil uil-chart-line"></i> {leftScoreTitle}
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-xl md:text-3xl font-bold text-gray-800 tabular-nums">
                {formatScore(leftScoreValue)}
              </div>
            </div>
            <div className="text-[9px] md:text-xs text-gray-400 mt-0 md:mt-0.5">
              {leftScoreHint}
            </div>
            <div className="mt-1 md:mt-1.5 transform scale-75 origin-center md:scale-100">
              <StarRating
                value={leftScoreValue}
                fullClassName={theme.starFillClassName}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center px-1 md:px-2">
            <div className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2 flex items-center gap-1">
              <i className={`uil ${rightDetailsIcon}`}></i> {rightDetailsTitle}
            </div>
            <div className="flex flex-col gap-1 md:gap-2 transform origin-left scale-90 md:scale-100">
              {rightDetailsContent}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-2 md:pt-3 border-t border-gray-100 flex items-center gap-2 md:gap-6 overflow-x-auto scrollbar-hide">
          {bottomStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm whitespace-nowrap"
            >
              <i className={`uil ${stat.icon} text-gray-400`}></i>
              <span className="text-gray-500">{stat.label}</span>
              <span className="text-gray-800 font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
