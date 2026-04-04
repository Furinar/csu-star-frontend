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
  // If we are in "linked" mode, or if fields from the other side exist, we show all 6.
  const isLinked =
    evaluation.mode === "linked" ||
    (evaluation.course_id && evaluation.teacher_id);

  // Decide which dimensions to show
  let dimensionsToShow: DimensionConfig[] = [];

  if (isLinked) {
    // Show both (6 dimensions)
    dimensionsToShow = [...DIMENSIONS_TEACHER, ...DIMENSIONS_COURSE];
  } else if (theme === "teacher") {
    // Show only teacher's 3 dimensions
    dimensionsToShow = [...DIMENSIONS_TEACHER];
  } else {
    // Show only course's 3 dimensions
    dimensionsToShow = [...DIMENSIONS_COURSE];
  }

  // If there are 6 dimensions, use a 2-column grid. Otherwise 1-column or 2-column depending on space.
  if (!isLinked) {
    return (
      <div className={`p-3 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
          {dimensionsToShow.map((dim) => (
            <BarRow
              key={dim.key}
              label={dim.label}
              value={getDimensionScore(evaluation, dim.key)}
              fillStyle={dim.fillStyle}
            />
          ))}
        </div>
      </div>
    );
  }

  // Linked mode: split into two columns with a vertical divider
  const teacherName = evaluation.teacher_name || (theme === "teacher" ? "教师参评" : "关联教师");
  const courseName = evaluation.course_name || (theme === "course" ? "课程参评" : "关联课程");

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
