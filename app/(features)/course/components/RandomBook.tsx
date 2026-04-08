"use client";

import "./style.css";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRandomCourseShowcase } from "@/api/showcase";
import CollectButton from "@/components/ui/CollectButton";
import RatingBar from "@/components/ui/RatingBar";
import StarRating from "@/components/ui/StarRating";
import { isPublicCourseType } from "@/lib/courseType";
import {
  buildCourseEvaluationAnchor,
  buildCoursePath,
  buildResourceCollectionPath,
  buildTeacherPath,
} from "@/lib/paths";
import { getPageTheme } from "@/lib/pageTheme";
import type { CourseShowcaseItem } from "@/types/showcase";

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(2);
}

function normalizeRating(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(5, value));
}

const EMPTY_COURSE: CourseShowcaseItem = {
  id: "",
  name: "暂无课程数据",
  course_type: "待更新",
  avg_score: null,
  avg_homework: null,
  avg_gain: null,
  avg_exam_diff: null,
  eval_count: 0,
  resource_count: 0,
  teacher_count: 0,
  teachers: [],
};

const courseTheme = getPageTheme("/course");

type ScoreCardProps = {
  avgScore?: number | null;
  avgHomework?: number | null;
  avgGain?: number | null;
  avgExamDiff?: number | null;
  evalCount?: number | null;
  compact?: boolean;
  error?: boolean;
};

function CourseScoreCard({
  avgScore,
  avgHomework,
  avgGain,
  avgExamDiff,
  evalCount,
  compact = false,
  error = false,
}: ScoreCardProps) {
  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-center text-xs text-gray-500 md:text-sm">
        随机课程加载失败，请稍后重试。
      </div>
    );
  }

  return (
    <div className="course-rate flex h-full w-full flex-col">
      <div
        className={`avg-rate flex w-full flex-nowrap items-center self-center ${
          compact ? "justify-between gap-2" : "justify-around"
        }`}
      >
        <div className="flex flex-nowrap items-baseline gap-1">
          <div className={`font-bold self-center ${compact ? "text-3xl" : "text-6xl"}`}>
            {formatScore(avgScore)}
          </div>
          <div className={`self-end whitespace-nowrap text-gray-500 ${compact ? "text-[11px]" : "text-base"}`}>/ 5.0</div>
        </div>

        <div className={`flex shrink-0 flex-col whitespace-nowrap ${compact ? "items-end" : ""}`}>
          <div className={compact ? "mb-0.5" : "mb-1"}>
            <StarRating
              score={normalizeRating(avgScore)}
              size={compact ? "14px" : "18px"}
              fillClassName="text-[var(--first-color)]"
            />
          </div>

          <div className={`whitespace-nowrap text-gray-500 ${compact ? "text-[10px]" : "text-sm"}`}>
            基于 <strong>{evalCount ?? 0}</strong> 条评价
          </div>
        </div>
      </div>

      <div className={`mt-2 flex w-full flex-1 flex-col items-start justify-evenly text-center ${compact ? "gap-0.5" : "gap-1"}`}>
        <RatingBar
          label="推荐指数"
          score={normalizeRating(avgScore)}
          maxScore={5}
          gradient={courseTheme.ratingGradients[0]}
          compact={compact}
        />
        <RatingBar
          label="给分情况"
          score={normalizeRating(avgHomework)}
          maxScore={5}
          gradient={courseTheme.ratingGradients[1]}
          compact={compact}
        />
        <RatingBar
          label="任务量"
          score={normalizeRating(avgExamDiff)}
          maxScore={5}
          gradient={courseTheme.ratingGradients[2]}
          compact={compact}
        />
        <RatingBar
          label="课程收获"
          score={normalizeRating(avgGain)}
          maxScore={5}
          gradient={courseTheme.ratingGradients[0]}
          compact={compact}
        />
      </div>
    </div>
  );
}

export default function RandomBook() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseShowcaseItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    let alive = true;

    getRandomCourseShowcase()
      .then((items) => {
        if (!alive) return;
        setCourses(items);
        setActiveIndex(0);
        setHasError(items.length === 0);
      })
      .catch((error) => {
        console.error(error);
        if (!alive) return;
        setHasError(true);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (courses.length <= 1) return;

    let switchTimeoutId: number | undefined;
    const intervalId = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          setIsAnimating(true);
          switchTimeoutId = window.setTimeout(() => {
            setActiveIndex((index) => (index + 1) % courses.length);
            setIsAnimating(false);
          }, 220);
          return 10;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
      if (switchTimeoutId) window.clearTimeout(switchTimeoutId);
    };
  }, [courses.length]);

  const course = courses[activeIndex] ?? EMPTY_COURSE;
  const teacherCount = course.teacher_count ?? course.teachers.length;
  const coursePath = course.id ? buildCoursePath(course.id) : null;
  const resourcePath = course.id ? buildResourceCollectionPath(course.id) : null;
  const hasResourceCollection = (course.resource_count ?? 0) > 0;
  const evaluationPath = course.id ? buildCourseEvaluationAnchor(course.id) : null;
  const courseTypeChars = isPublicCourseType(course.course_type) ? ["公", "选"] : ["非", "公", "选"];
  const showErrorState = hasError && !isLoading && courses.length === 0;

  const handleBackgroundNavigate = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!coursePath) return;
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, select, textarea, label, [role='button']")) {
      return;
    }
    router.push(coursePath);
  };

  return (
    <div
      className={`random-book relative grid h-auto grid-cols-1 gap-3 p-3 md:h-90 md:grid-cols-[3fr_2fr] md:gap-0 md:p-5 ${coursePath ? "cursor-pointer" : ""} ${isAnimating ? "is-switching" : ""}`}
      onClick={handleBackgroundNavigate}
      style={
        {
          "--container-bg":
            "linear-gradient(145deg, rgba(219, 234, 254, 0.94) 0%, rgba(255, 255, 255, 0.96) 42%, rgba(224, 231, 255, 0.95) 74%, rgba(237, 233, 254, 0.92) 100%)",
          "--container-shadow":
            "12px 18px 36px rgba(37, 99, 235, 0.14), -10px -10px 26px rgba(255, 255, 255, 0.92)",
        } as CSSProperties
      }
    >
      <div className="absolute top-0 left-4 flex flex-col rounded-b-sm bg-first px-1 py-0.5 text-xs font-bold text-white shadow-lg md:left-7 md:px-1.5 md:py-1 md:text-base">
        {courseTypeChars.map((char, index) => (
          <span key={`${course.id}-${index}-${char}`}>{char}</span>
        ))}
      </div>

      <div className="left flex flex-col gap-3 md:gap-4">
        <div className="course-info mt-2 flex flex-nowrap items-center justify-between gap-2 overflow-hidden md:mt-0 md:gap-4">
          {coursePath ? (
            <Link
              href={coursePath}
              className="course-name hero-gradient-text min-w-0 flex-1 truncate whitespace-nowrap pl-10 pb-1 text-2xl font-extrabold tracking-tight drop-shadow-sm md:pl-15 md:text-4xl"
            >
              {course.name}
            </Link>
          ) : (
            <div className="course-name hero-gradient-text min-w-0 flex-1 truncate whitespace-nowrap pl-10 pb-1 text-2xl font-extrabold tracking-tight drop-shadow-sm md:pl-15 md:text-4xl">
              {course.name}
            </div>
          )}

          <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap md:ml-0 md:gap-3">
            <div className="shrink-0 rounded-full border border-white/70 bg-white/75 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-slate-500 shadow-sm md:px-3 md:text-xs">
              {countdown}s 后切换
            </div>
            <CollectButton
              key={`random-course-collect-${course.id}`}
              size="sm"
              isCollected={false}
              targetId={course.id}
              targetType="course"
              initialStatus={false}
            />
          </div>
        </div>

        <div className={`course-relate flex-1 grid grid-cols-1 gap-3 pt-3 md:gap-6 md:pt-4 ${hasResourceCollection ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {hasResourceCollection ? (
            <div className="resource-card flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-transform hover:-translate-y-1 md:rounded-2xl md:p-5">
              <div className="mb-2 flex items-center gap-2 text-gray-500">
                <i className="uil uil-file-alt text-lg text-[var(--first-color)] md:text-xl"></i>
                <span className="text-xs font-medium text-gray-600 md:text-sm">关联资源</span>
              </div>
              <div className="my-1 flex flex-1 items-center justify-center text-4xl font-bold tracking-tight text-gray-800 md:my-2 md:text-5xl">
                {isLoading ? "..." : course.resource_count ?? 0}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2.5 md:pt-3">
                <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400 md:text-xs">
                  <i className="uil uil-import text-[11px] md:text-sm"></i>
                  课程资源
                </div>
                {resourcePath ? (
                  <Link
                    href={resourcePath}
                    className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--first-color)] transition-colors hover:bg-[var(--first-color)] hover:text-white md:text-xs"
                  >
                    资源详情
                  </Link>
                ) : (
                  <span className="px-2 py-1 text-[11px] font-medium text-gray-300 md:text-xs">资源详情</span>
                )}
              </div>
            </div>
          ) : null}

          <div className="comment-card hidden flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1 md:flex">
            <div className="mb-2 flex items-center gap-2 text-gray-500">
              <i className="uil uil-comment-dots text-xl text-[var(--first-color)]"></i>
              <span className="text-sm font-medium text-gray-600">相关评价</span>
            </div>
            <div className="my-2 flex flex-1 items-center justify-center text-5xl font-bold tracking-tight text-gray-800">
              {isLoading ? "..." : course.eval_count ?? 0}
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                <i className="uil uil-users-alt text-sm"></i>
                真实评价
              </div>
              {evaluationPath ? (
                <Link
                  href={evaluationPath}
                  className="rounded-md px-2 py-1 text-xs font-medium text-[var(--first-color)] transition-colors hover:bg-[var(--first-color)] hover:text-white"
                >
                  评价详情
                </Link>
              ) : (
                <span className="px-2 py-1 text-xs font-medium text-gray-300">评价详情</span>
              )}
            </div>
          </div>

          <div className="flex min-h-[172px] gap-3 md:contents md:min-h-0">
            <div className="teacher-card flex min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-transform hover:-translate-y-1 md:rounded-2xl md:p-5">
              <div className="mb-2 flex items-center gap-1 text-gray-500 md:mb-3 md:gap-2">
                <i className="uil uil-user-circle text-base text-[var(--first-color)] md:text-xl"></i>
                <span className="text-xs font-medium text-gray-600 md:text-sm">
                  授课教师 {teacherCount ? `(${teacherCount})` : ""}
                </span>
              </div>

              <div className="custom-scrollbar content-start flex w-full flex-wrap gap-1.5 overflow-y-auto pr-1 md:gap-2">
                {course.teachers.length > 0 ? (
                  course.teachers.map((teacher) => (
                    <Link
                      key={`${course.id}-${teacher.id}`}
                      href={buildTeacherPath(teacher.id)}
                      className="whitespace-nowrap rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600 transition-colors hover:bg-[var(--first-color)] hover:text-white md:px-3 md:text-xs"
                    >
                      {teacher.name}
                    </Link>
                  ))
                ) : (
                  <div className="rounded-full border border-dashed border-gray-200 px-2.5 py-1 text-[11px] text-gray-400 md:px-3 md:text-xs">
                    {isLoading ? "教师信息加载中..." : "暂无授课教师"}
                  </div>
                )}
              </div>
            </div>

            <div className="right flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-3 shadow-sm md:hidden">
              <CourseScoreCard
                avgScore={course.avg_score}
                avgHomework={course.avg_homework}
                avgGain={course.avg_gain}
                avgExamDiff={course.avg_exam_diff}
                evalCount={course.eval_count}
                compact
                error={showErrorState}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="right hidden h-80 rounded-[15px] bg-white p-4 shadow-lg md:block">
        <CourseScoreCard
          avgScore={course.avg_score}
          avgHomework={course.avg_homework}
          avgGain={course.avg_gain}
          avgExamDiff={course.avg_exam_diff}
          evalCount={course.eval_count}
          error={showErrorState}
        />
      </div>
    </div>
  );
}
