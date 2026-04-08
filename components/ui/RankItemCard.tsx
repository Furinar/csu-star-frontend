"use client";

import Link from "next/link";
import React from "react";
import type {
  CourseRankingItem,
  ResourceRankingItem,
  TeacherRankingItem,
} from "@/types/ranking";
import { getEntityTheme } from "@/lib/entityTheme";
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

function formatMetric(value?: number | null | string, digits = 2) {
  if (value === null || typeof value === "undefined") return "--";
  if (typeof value === "string") return value;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(digits);
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
    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
      <span className="w-12 sm:w-16 text-gray-500 truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 h-1 sm:h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${(score / max) * 100}%` }}
        ></div>
      </div>
      <span className="w-5 sm:w-7 text-right text-gray-600 font-medium tabular-nums">
        {formatMetric(value)}
      </span>
    </div>
  );
}

function formatCourseType(courseType?: string | null) {
  if (courseType === "public") return "公选";
  if (courseType === "non_public") return "非公选";
  if (courseType === "公选课") return "公选";
  if (courseType === "非公选课") return "非公选";
  return courseType || "未知类型";
}

export default function RankItemCard(props: RankItemCardProps) {
  const { type, filterLabel, filterValue, className = "" } = props;
  const theme = getEntityTheme(type);

  let href = "#";
  let title = "";
  let isPublic = false;
  let subtitleIcon = "";
  let subtitleContent: React.ReactNode = null;
  let rightDetailsContent: React.ReactNode = null;
  let bottomStats: Array<{
    icon: string;
    label: string;
    value: string | number;
  }> = [];

  const rank = props.item.rank || 1;
  const index = rank - 1;

  if (type === "course") {
    const item = props.item;
    href = buildCoursePath(item.id);
    title = item.name;
    const courseTypeLabel = formatCourseType(item.course_type);
    isPublic = courseTypeLabel === "公选";

    rightDetailsContent = (
      <>
        <BarRow
          label="收获感"
          value={item.avg_gain}
          colorClass={theme.dimensionBarClassNames[0]}
        />
        <BarRow
          label="作业量"
          value={item.avg_homework}
          colorClass={theme.dimensionBarClassNames[1]}
        />
        <BarRow
          label="考试难度"
          value={item.avg_exam_diff}
          colorClass={theme.dimensionBarClassNames[2]}
        />
      </>
    );

    bottomStats = [
      { icon: "uil-award", label: "综合", value: formatMetric(item.score) },
      {
        icon: "uil-comment-alt-lines",
        label: "评价",
        value: item.eval_count ?? 0,
      },
      { icon: "uil-folder", label: "资源", value: item.resource_count ?? 0 },
    ];
  } else if (type === "teacher") {
    const item = props.item;
    href = buildTeacherPath(item.id);
    title = item.name;
    subtitleIcon = "uil-building";
    subtitleContent = (
      <div className="flex w-full min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
        <span className="min-w-0 text-[10px] sm:text-xs text-gray-600 truncate">
          {item.department_name ||
            (item.department_id ? `学院ID:${item.department_id}` : "未知学院")}
        </span>
        <span className="shrink-0 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] sm:text-xs text-gray-600">
          {item.title || "未知职称"}
        </span>
      </div>
    );

    rightDetailsContent = (
      <>
        <BarRow
          label="教学质量"
          value={item.avg_quality}
          colorClass={theme.dimensionBarClassNames[0]}
        />
        <BarRow
          label="给分宽松"
          value={item.avg_grading}
          colorClass={theme.dimensionBarClassNames[1]}
        />
        <BarRow
          label="考勤要求"
          value={item.avg_attendance}
          colorClass={theme.dimensionBarClassNames[2]}
        />
      </>
    );

    bottomStats = [
      { icon: "uil-award", label: "综合", value: formatMetric(item.score) },
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
    const courseTypeLabel = formatCourseType(item.course_type);
    isPublic = courseTypeLabel === "公选";

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
          <span className="text-gray-500 w-14 sm:w-18">总浏览</span>
          <span className="font-medium text-gray-700 flex-1 tabular-nums">
            {item.view_total ?? 0}
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
      { icon: "uil-award", label: "综合", value: formatMetric(item.score) },
      { icon: "uil-file-alt", label: "资料", value: item.resource_count ?? 0 },
      { icon: "uil-bookmark", label: "收藏", value: item.favorite_count ?? 0 },
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
      <span className="text-base sm:text-lg text-gray-400 font-bold w-full text-center">
        {rank}
      </span>
    );
  }

  const teacherAvatar =
    type === "teacher" ? (
      <>
        {(props.item as TeacherRankingItem).avatar_url ? (
          <img
            src={(props.item as TeacherRankingItem).avatar_url!}
            alt={title}
            className="h-10 w-10 rounded-full border border-gray-200 object-cover shadow-sm sm:h-11 sm:w-11 md:h-12 md:w-12"
          />
        ) : (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm sm:h-11 sm:w-11 md:h-12 md:w-12 ${theme.badgeMutedBackgroundClassName} ${theme.badgeBorderClassName} ${theme.badgeTextClassName}`}
          >
            <i className="uil uil-user text-xl"></i>
          </div>
        )}
      </>
    ) : null;

  return (
    <Link
      href={href}
      className={`relative block w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_8px_22px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg md:rounded-xl ${className}`}
    >
      <div className="flex flex-col gap-3 p-3 md:hidden">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-gray-50/70 shadow-sm">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                index === 0
                  ? "border-yellow-300/50 bg-gradient-to-br from-yellow-100 to-amber-50"
                  : index === 1
                    ? "border-slate-300/50 bg-gradient-to-br from-slate-100 to-gray-50"
                    : index === 2
                      ? "border-orange-300/50 bg-gradient-to-br from-orange-100 to-red-50"
                      : "border-gray-200 bg-white"
              }`}
            >
              {medalIcon}
            </div>
          </div>

          {type === "teacher" ? (
            <div className="shrink-0 flex items-center justify-center">
              {teacherAvatar}
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3
                    className="line-clamp-1 text-[15px] font-bold text-gray-800"
                    title={title}
                  >
                    {title}
                  </h3>
                  {isPublic ? (
                    <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[9px] font-medium whitespace-nowrap text-amber-600">
                      公选
                    </span>
                  ) : null}
                </div>
                {subtitleContent ? (
                  <div className="mt-1 min-w-0 overflow-hidden text-[11px] text-gray-500">
                    {subtitleContent}
                  </div>
                ) : null}
              </div>

              <div
                className={`shrink-0 rounded-xl px-2.5 py-1.5 text-right md:rounded-2xl ${theme.badgeMutedBackgroundClassName}`}
              >
                <div className={`text-[10px] font-medium ${theme.badgeTextClassName}`}>
                  {filterLabel}
                </div>
                <div
                  className="mt-0.5 text-lg font-black leading-none tabular-nums"
                  style={{
                    color:
                      type === "teacher"
                        ? "#be185d"
                        : type === "resource"
                          ? "#047857"
                          : "#1d4ed8",
                  }}
                  title={
                    typeof filterValue === "string"
                      ? filterValue
                      : String(filterValue ?? "--")
                  }
                >
                  {typeof filterValue === "number"
                    ? formatMetric(filterValue)
                    : (filterValue ?? "--")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {bottomStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-100 bg-gray-50/70 px-2.5 py-2 md:rounded-2xl"
            >
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <i className={`uil ${stat.icon}`}></i>
                <span className="truncate">{stat.label}</span>
              </div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-gray-800">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden min-h-[100px] flex-row items-stretch md:flex">
        <div className="flex w-16 shrink-0 items-center justify-center border-r border-gray-100 bg-gray-50/40 md:w-20">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-md ${
              index === 0
                ? "border-yellow-300/50 bg-gradient-to-br from-yellow-100 to-amber-50"
                : index === 1
                  ? "border-slate-300/50 bg-gradient-to-br from-slate-100 to-gray-50"
                  : index === 2
                    ? "border-orange-300/50 bg-gradient-to-br from-orange-100 to-red-50"
                    : "border-gray-200 bg-white"
            }`}
          >
            {medalIcon}
          </div>
        </div>

        {type === "teacher" && (
          <div className="flex shrink-0 items-center justify-center pl-4 pr-0">
            {teacherAvatar}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
          <div className="mb-2 pr-2">
            <div className="flex items-center gap-2">
              <h3
                className="line-clamp-1 truncate text-base font-bold text-gray-800"
                title={title}
              >
                {title}
              </h3>
              {isPublic ? (
                <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[9px] font-medium whitespace-nowrap text-amber-600">
                  公选
                </span>
              ) : null}
            </div>
            {subtitleContent ? (
              <div className="mt-1.5 flex h-[20px] w-full items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-gray-500">
                <i className={`uil ${subtitleIcon} shrink-0 text-gray-400`}></i>
                {subtitleContent}
              </div>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-4 overflow-x-auto scrollbar-hide">
            {bottomStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-1 whitespace-nowrap text-xs"
              >
                <i className={`uil ${stat.icon} text-gray-400`}></i>
                <span className="text-gray-500">{stat.label}:</span>
                <span className="font-medium text-gray-800">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-3/5 shrink-0 border-l border-gray-100 sm:w-[45%] md:w-3/5">
          <div className="flex min-w-0 flex-1 flex-col justify-center border-r border-gray-100 px-3 md:px-4">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {rightDetailsContent}
            </div>
          </div>

          <div
            className={`relative flex w-[105px] shrink-0 flex-col items-center justify-center overflow-hidden px-2 py-2 md:w-[115px] ${theme.badgeMutedBackgroundClassName}`}
          >
            <div
              className={`absolute left-2 top-2 flex w-full items-center gap-1 truncate text-xs font-medium ${theme.badgeTextClassName}`}
            >
              <i className="uil uil-filter"></i>
              <span className="truncate">{filterLabel}</span>
            </div>
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center pt-5">
              <div
                className="w-full truncate px-1 text-center text-2xl font-black tabular-nums md:text-3xl"
                style={{
                  color:
                    type === "teacher"
                      ? "#be185d"
                      : type === "resource"
                        ? "#047857"
                        : "#1d4ed8",
                  textShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
                title={
                  typeof filterValue === "string"
                    ? filterValue
                    : String(filterValue ?? "--")
                }
              >
                {typeof filterValue === "number"
                  ? formatMetric(filterValue)
                  : (filterValue ?? "--")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
