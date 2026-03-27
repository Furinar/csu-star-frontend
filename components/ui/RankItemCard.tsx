"use client";

import Link from "next/link";
import React from "react";
import type {
  CourseRankingItem,
  ResourceRankingItem,
  TeacherRankingItem,
} from "@/types/ranking";
import {
  buildCoursePath,
  buildResourceCollectionPath,
  buildTeacherPath,
} from "@/lib/paths";

type RankItemCardProps =
  | {
      type: "course";
      item: CourseRankingItem;
      filterLabel: string;
      filterValue: number | string | null | undefined;
      className?: string;
    }
  | {
      type: "teacher";
      item: TeacherRankingItem;
      filterLabel: string;
      filterValue: number | string | null | undefined;
      className?: string;
    }
  | {
      type: "resource";
      item: ResourceRankingItem;
      filterLabel: string;
      filterValue: number | string | null | undefined;
      className?: string;
    };

const TYPE_THEME = {
  course: {
    label: "课程",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  teacher: { label: "教师", dotClass: "bg-sky-500", textClass: "text-sky-700" },
  resource: {
    label: "资源合集",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
  },
} as const;

function formatScore(value?: number | null | string, digits = 1) {
  if (value === null || typeof value === "undefined") return "--";
  if (typeof value === "string") return value;
  return value.toFixed(digits);
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN");
}

function BarRow({
  label,
  value,
  colorClass = "bg-blue-500",
  max = 5,
}: {
  label: string;
  value?: number | null;
  colorClass?: string;
  max?: number;
}) {
  const score = value ? Math.max(0, Math.min(value, max)) : 0;
  return (
    <div className="flex items-center gap-2 text-[10px] sm:text-xs">
      <span className="w-12 sm:w-14 text-gray-500 truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 h-1 sm:h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${(score / max) * 100}%` }}
        ></div>
      </div>
      <span className="w-5 sm:w-6 text-right text-gray-600 font-medium tabular-nums">
        {formatScore(value)}
      </span>
    </div>
  );
}

function truncateString(str: string, maxLength: number) {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

export default function RankItemCard(props: RankItemCardProps) {
  const { type, filterLabel, filterValue, className = "" } = props;
  const theme = TYPE_THEME[type];

  let href = "#";
  let title = "";
  let isPublic = false;
  let subtitleIcon = "";
  let subtitleContent: React.ReactNode = null;
  let rightDetailsContent: React.ReactNode = null;
  let bottomStats: Array<{ icon: string; label: string; value: string | number }> = [];

  const rank = props.item.rank || 1;
  const index = rank - 1;

  if (type === "course") {
    const item = props.item;
    href = buildCoursePath(item.id);
    title = item.name;
    isPublic =
      item.course_type === "公选" ||
      item.course_type === "public" ||
      item.course_type === "公共选修课";

    subtitleIcon = "uil-tag-alt";
    subtitleContent = (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-600">{item.code || "无代码"}</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] sm:text-xs text-gray-600">
          {truncateString(item.course_type || "未知类型", 8)}
        </span>
        {item.credits ? (
          <span className="text-[10px] sm:text-xs text-gray-500">{item.credits} 学分</span>
        ) : null}
      </div>
    );

    rightDetailsContent = (
      <>
        <BarRow label="收获感" value={item.avg_gain} colorClass="bg-emerald-400" />
        <BarRow label="作业量" value={item.avg_homework} colorClass="bg-orange-400" />
        <BarRow label="考试难度" value={item.avg_exam_diff} colorClass="bg-red-400" />
      </>
    );

    bottomStats = [
      { icon: "uil-award", label: "总得分", value: formatScore(item.score) },
      { icon: "uil-comment-alt-lines", label: "评价", value: item.eval_count ?? 0 },
      { icon: "uil-folder", label: "资源", value: item.resource_count ?? 0 },
    ];
  } else if (type === "teacher") {
    const item = props.item;
    href = buildTeacherPath(item.id);
    title = item.name;
    subtitleIcon = "uil-building";
    subtitleContent = (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] sm:text-xs text-gray-600">
          {item.department_name ||
            (item.department_id ? `学院ID:${item.department_id}` : "未知学院")}
        </span>
        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] sm:text-xs text-gray-600">
          {item.title || "未知职称"}
        </span>
      </div>
    );

    rightDetailsContent = (
      <>
        <BarRow label="教学质量" value={item.avg_quality} colorClass="bg-sky-400" />
        <BarRow label="给分宽松" value={item.avg_grading} colorClass="bg-purple-400" />
        <BarRow label="考勤要求" value={item.avg_attendance} colorClass="bg-indigo-400" />
      </>
    );

    bottomStats = [
      { icon: "uil-award", label: "总得分", value: formatScore(item.score) },
      { icon: "uil-comment-alt-lines", label: "评价", value: item.eval_count ?? 0 },
      { icon: "uil-folder", label: "资源", value: item.resource_count ?? 0 },
    ];
  } else {
    const item = props.item;
    href = buildResourceCollectionPath(item.course_id);
    title = item.course_name;
    subtitleIcon = "uil-folder-open";
    subtitleContent = (
      <div className="flex items-center gap-2 flex-wrap">
        {item.course_code ? (
          <span className="text-[10px] sm:text-xs text-gray-600">{item.course_code}</span>
        ) : null}
        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] sm:text-xs text-gray-600">
          最近更新 {formatDate(item.updated_at)}
        </span>
      </div>
    );

    rightDetailsContent = (
      <div className="flex flex-col gap-1 sm:gap-1.5 justify-center h-full">
        <div className="flex items-center text-[10px] sm:text-xs">
          <span className="text-gray-500 w-14 sm:w-18">资源总数</span>
          <span className="font-medium text-gray-700 flex-1 tabular-nums">
            {item.resource_count ?? 0}
          </span>
        </div>
        <div className="flex items-center text-[10px] sm:text-xs">
          <span className="text-gray-500 w-14 sm:w-18">总下载</span>
          <span className="font-medium text-gray-700 flex-1 tabular-nums">
            {item.download_total ?? 0}
          </span>
        </div>
        <div className="flex items-center text-[10px] sm:text-xs">
          <span className="text-gray-500 w-14 sm:w-18">总点赞</span>
          <span className="font-medium text-gray-700 flex-1 tabular-nums">
            {item.like_total ?? 0}
          </span>
        </div>
      </div>
    );

    bottomStats = [
      { icon: "uil-award", label: "总得分", value: formatScore(item.score) },
      { icon: "uil-file-alt", label: "资料", value: item.resource_count ?? 0 },
      { icon: "uil-fire", label: "热度", value: formatScore(item.hot_score) },
    ];
  }

  let medalIcon = null;
  if (index === 0) {
    medalIcon = (
      <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600">
        1
      </span>
    );
  } else if (index === 1) {
    medalIcon = (
      <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-300 to-slate-500">
        2
      </span>
    );
  } else if (index === 2) {
    medalIcon = (
      <span className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600">
        3
      </span>
    );
  } else {
    medalIcon = (
      <span className="text-base sm:text-lg text-gray-400 font-bold w-full text-center">{rank}</span>
    );
  }

  return (
    <Link
      href={href}
      className={`relative flex flex-row items-stretch w-full min-h-[100px] bg-white rounded-xl shadow-[0_8px_22px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-gray-50/80 px-1.5 py-0.5 rounded-md border border-gray-100 z-10">
        <div className={`w-1.5 h-1.5 rounded-full ${theme.dotClass}`} />
        <span className={`text-[9px] sm:text-[10px] font-medium ${theme.textClass}`}>
          {theme.label}
        </span>
      </div>

      <div className="w-14 sm:w-16 md:w-20 shrink-0 flex items-center justify-center bg-gray-50/40 border-r border-gray-100">
        <div
          className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full shadow-md border ${
            index === 0
              ? "bg-gradient-to-br from-yellow-100 to-amber-50 border-yellow-300/50"
              : index === 1
                ? "bg-gradient-to-br from-slate-100 to-gray-50 border-slate-300/50"
                : index === 2
                  ? "bg-gradient-to-br from-orange-100 to-red-50 border-orange-300/50"
                  : "bg-white border-gray-200"
          }`}
        >
          {medalIcon}
        </div>
      </div>

      <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-center">
        <div className="mb-2 sm:mb-2 pr-10">
          <div className="flex items-center gap-2">
            <h3
              className="text-[15px] sm:text-base font-bold text-gray-800 line-clamp-1 truncate"
              title={title}
            >
              {title}
            </h3>
            {isPublic ? (
              <span className="shrink-0 bg-amber-50 border border-amber-200 text-amber-600 px-1 py-0.5 text-[9px] font-medium rounded whitespace-nowrap">
                公选
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5 text-xs text-gray-500 truncate h-[20px]">
            <i className={`uil ${subtitleIcon} text-gray-400`}></i>
            {subtitleContent}
          </div>
        </div>

        <div className="mt-1 flex items-center gap-3 sm:gap-4 overflow-x-auto scroolbar-hide">
          {bottomStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-1 text-[10px] sm:text-xs whitespace-nowrap">
              <i className={`uil ${stat.icon} text-gray-400`}></i>
              <span className="text-gray-500 hidden sm:inline">{stat.label}:</span>
              <span className="text-gray-800 font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-[150px] sm:w-[220px] md:w-[280px] shrink-0 flex border-l border-gray-100">
        <div className="hidden sm:flex flex-1 flex-col justify-center px-2 md:px-3 border-r border-gray-100 min-w-0">
          <div className="flex flex-col gap-1 sm:gap-1.5">{rightDetailsContent}</div>
        </div>

        <div className="w-[70px] sm:w-[90px] shrink-0 flex flex-col items-center justify-center bg-[var(--first-color)]/5 px-1 py-2 relative overflow-hidden">
          <div className="flex flex-col items-center justify-center relative z-10 w-full h-full">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-[var(--first-color)]/80 mb-0.5 sm:mb-1 truncate w-full justify-center">
              <i className="uil uil-filter"></i>
              <span className="truncate">{filterLabel}</span>
            </div>
            <div
              className="text-[17px] sm:text-xl font-bold tabular-nums px-1 text-center truncate w-full py-0.5"
              style={{
                color: "var(--first-color)",
                textShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
              title={
                typeof filterValue === "string" ? filterValue : String(filterValue ?? "--")
              }
            >
              {typeof filterValue === "number"
                ? formatScore(filterValue)
                : filterValue ?? "--"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
