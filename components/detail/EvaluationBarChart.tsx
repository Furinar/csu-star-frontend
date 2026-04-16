"use client";

import React, { type CSSProperties } from "react";
import { getPageTheme } from "@/lib/pageTheme";
type CommonEvaluation = {
  mode?: "standalone" | "linked" | null;
  course_id?: string | number | null;
  teacher_id?: string | number | null;
  course_name?: string | null;
  teacher_name?: string | null;
  rating_quality?: number | null;
  rating_grading?: number | null;
  rating_attendance?: number | null;
  rating_gain?: number | null;
  rating_homework?: number | null;
  rating_exam_difficulty?: number | null;
};

interface EvaluationBarChartProps {
  evaluation: CommonEvaluation;
  theme: "course" | "teacher";
  isLinked?: boolean;
  className?: string;
}

const teacherTheme = getPageTheme("/teacher");
const courseTheme = getPageTheme("/course");

const DIMENSIONS_TEACHER = [
  {
    key: "rating_quality",
    label: "教学质量",
    fillStyle: { background: teacherTheme.ratingGradients[0] },
  },
  {
    key: "rating_grading",
    label: "给分好坏",
    fillStyle: { background: teacherTheme.ratingGradients[1] },
  },
  {
    key: "rating_attendance",
    label: "考勤要求",
    fillStyle: { background: teacherTheme.ratingGradients[2] },
  },
] as const;

const DIMENSIONS_COURSE = [
  {
    key: "rating_gain",
    label: "收获感",
    fillStyle: { background: courseTheme.ratingGradients[0] },
  },
  {
    key: "rating_homework",
    label: "作业量",
    fillStyle: { background: courseTheme.ratingGradients[1] },
  },
  {
    key: "rating_exam_difficulty",
    label: "考试难度",
    fillStyle: { background: courseTheme.ratingGradients[2] },
  },
] as const;

type DimensionKey =
  | (typeof DIMENSIONS_TEACHER)[number]["key"]
  | (typeof DIMENSIONS_COURSE)[number]["key"];
type DimensionConfig = {
  key: DimensionKey;
  label: string;
  fillStyle: CSSProperties;
};

function clampScore(value?: number | null) {
  if (value === null || typeof value === "undefined" || Number.isNaN(value))
    return 0;
  return Math.min(Math.max(value, 0), 5);
}

function formatScore(value?: number | null) {
  if (value === null || typeof value === "undefined") return "--";
  return value.toFixed(1);
}

function getDimensionScore(evaluation: CommonEvaluation, key: DimensionKey) {
  return evaluation[key];
}

const BarRow = ({
  label,
  value,
  fillStyle,
}: {
  label: string;
  value?: number | null;
  fillStyle: CSSProperties;
}) => {
  const score = clampScore(value);
  const percentage = (score / 5) * 100;

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <span className="w-14 sm:w-16 text-gray-500 truncate">{label}</span>
      <div className="flex-1 h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, ...fillStyle }}
        />
      </div>
      <span className="w-6 sm:w-8 text-right text-gray-600 font-medium tabular-nums">
        {formatScore(value)}
      </span>
    </div>
  );
};

export const EvaluationBarChart: React.FC<EvaluationBarChartProps> = ({
  evaluation,
  theme,
  className = "",
}) => {
  // Linked evaluation can contain both teacher/course dimensions in one record.
  const isLinked =
    evaluation.mode === "linked" ||
    (evaluation.course_id && evaluation.teacher_id);

  // On course detail page we intentionally hide teacher-side bars.
  const showLinkedSplit = theme === "teacher" && isLinked;

  // Decide which dimensions to show in non-split mode
  let dimensionsToShow: DimensionConfig[] = [];

  if (theme === "course") {
    dimensionsToShow = [...DIMENSIONS_COURSE];
  } else if (showLinkedSplit) {
    dimensionsToShow = [...DIMENSIONS_TEACHER, ...DIMENSIONS_COURSE];
  } else if (theme === "teacher") {
    dimensionsToShow = [...DIMENSIONS_TEACHER];
  } else {
    dimensionsToShow = [...DIMENSIONS_COURSE];
  }

  if (!showLinkedSplit) {
    const showCompactDivider = dimensionsToShow.length === 3;
    return (
      <div className={`p-3 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 sm:gap-y-0">
          {dimensionsToShow.map((dim, index) => (
            <div key={dim.key} className="relative sm:px-1">
              {showCompactDivider && index > 0 ? (
                <span className="pointer-events-none absolute -left-3 top-1/2 hidden h-8 -translate-y-1/2 border-l border-gray-200 sm:block" />
              ) : null}
              <BarRow
                label={dim.label}
                value={getDimensionScore(evaluation, dim.key)}
                fillStyle={dim.fillStyle}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Linked mode on teacher detail: split into two columns with a vertical divider
  const teacherName = evaluation.teacher_name || "教师参评";
  const courseName = evaluation.course_name || "关联课程";

  return (
    <div className={`p-4 rounded-xl bg-gray-50/80 border border-gray-100 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-4">
        {/* Left Side (Teacher) */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs text-gray-500 font-medium mb-1 px-1">{teacherName}</div>
          <div className="space-y-3">
            {DIMENSIONS_TEACHER.map((dim) => (
              <BarRow
              key={dim.key}
              label={dim.label}
              value={getDimensionScore(evaluation, dim.key)}
              fillStyle={dim.fillStyle}
            />
            ))}
          </div>
        </div>

        {/* Divider (hidden on mobile, visible on sm and up) */}
        <div className="hidden sm:block w-px bg-gray-200/60 my-2" />

        {/* Divider (visible on mobile) */}
        <div className="sm:hidden h-px bg-gray-200/60 my-1 mx-2" />

        {/* Right Side (Course) */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs text-gray-500 font-medium mb-1 px-1">{courseName}</div>
          <div className="space-y-3">
            {DIMENSIONS_COURSE.map((dim) => (
              <BarRow
              key={dim.key}
              label={dim.label}
              value={getDimensionScore(evaluation, dim.key)}
              fillStyle={dim.fillStyle}
            />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationBarChart;
