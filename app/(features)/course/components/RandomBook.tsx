"use client";

import "./style.css";
import StarRating from "@/components/ui/StarRating";
import RatingBar from "@/components/ui/RatingBar";
import Link from "next/link";
import CollectButton from "@/components/ui/CollectButton";
import { useEffect, useState } from "react";
import { getRandomCourseShowcase } from "@/api/showcase";
import type { CourseShowcaseItem } from "@/types/showcase";
import {
  buildCourseEvaluationAnchor,
  buildCoursePath,
  buildResourceCollectionPath,
  buildTeacherPath,
} from "@/lib/paths";

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(2);
}

function normalizeRating(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(5, value));
}

const EMPTY_COURSE: CourseShowcaseItem = {
  id: 0,
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

export default function RandomBook() {
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
  const evaluationPath = course.id ? buildCourseEvaluationAnchor(course.id) : null;
  const courseTypeChars = course.course_type?.includes("公") ? ["公", "选"] : ["非", "公", "选"];

  return (
    <>
      <div className={`random-book h-90 grid grid-cols-[3fr_2fr] p-5 relative ${isAnimating ? "is-switching" : ""}`}>
        <div className="absolute top-0 left-7 py-1 px-1.5 bg-first flex flex-col rounded-b-sm text-white font-bold shadow-lg user-invalid:">
          {courseTypeChars.map((char, index) => (
            <span key={`${course.id}-${index}-${char}`}>{char}</span>
          ))}
        </div>
        <div className="left flex flex-col gap-4">
          <div className="course-info flex flex-wrap gap-4 items-center justify-between">
            {coursePath ? (
              <Link
                href={coursePath}
                className="course-name text-4xl font-extrabold hero-gradient-text tracking-tight pb-1 drop-shadow-sm pl-15"
              >
                {course.name}
              </Link>
            ) : (
              <div className="course-name text-4xl font-extrabold hero-gradient-text tracking-tight pb-1 drop-shadow-sm pl-15">
                {course.name}
              </div>
            )}
            {/*公选/非公选*/}
            {/* <div className="course-type flex items-center gap-1.5 bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] px-4 py-1.5 rounded-full text-gray-700 text-sm font-medium transition-all hover:shadow-md hover:border-[var(--first-color)] hover:text-[var(--first-color)] hover:-translate-y-0.5 cursor-default mt-1">
              <span>公选</span>
            </div> */}

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
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

          <div className="course-relate flex-1 grid grid-cols-3 gap-6 pt-4">
            {/* 关联资源卡片 */}
            <div className="resource-card bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <i className="uil uil-file-alt text-xl text-[var(--first-color)]"></i>
                <span className="text-sm font-medium text-gray-600">
                  关联资源
                </span>
              </div>
              <div className="flex-1 flex justify-center items-center text-5xl font-bold text-gray-800 my-2 tracking-tight">
                {isLoading ? "..." : course.resource_count ?? 0}
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                  <i className="uil uil-import text-sm"></i> 课程资源
                </div>
                {resourcePath ? (
                  <Link
                    href={resourcePath}
                    className="text-xs text-[var(--first-color)] hover:text-white hover:bg-[var(--first-color)] px-2 py-1 rounded-md transition-colors font-medium"
                  >
                    资源详情
                  </Link>
                ) : (
                  <span className="text-xs text-gray-300 px-2 py-1 font-medium">
                    资源详情
                  </span>
                )}
              </div>
            </div>

            {/* 相关评价卡片 */}
            <div className="comment-card bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <i className="uil uil-comment-dots text-xl text-[var(--first-color)]"></i>
                <span className="text-sm font-medium text-gray-600">
                  相关评价
                </span>
              </div>
              <div className="flex-1 flex justify-center items-center text-5xl font-bold text-gray-800 my-2 tracking-tight">
                {isLoading ? "..." : course.eval_count ?? 0}
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                  <i className="uil uil-users-alt text-sm"></i> 真实评价
                </div>
                {evaluationPath ? (
                  <Link
                    href={evaluationPath}
                    className="text-xs text-[var(--first-color)] hover:text-white hover:bg-[var(--first-color)] px-2 py-1 rounded-md transition-colors font-medium"
                  >
                    评价详情
                  </Link>
                ) : (
                  <span className="text-xs text-gray-300 px-2 py-1 font-medium">
                    评价详情
                  </span>
                )}
              </div>
            </div>

            {/* 授课教师卡片 */}
            <div className="teacher-card bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <i className="uil uil-user-circle text-xl text-[var(--first-color)]"></i>
                <span className="text-sm font-medium text-gray-600">
                  授课教师 {teacherCount ? `(${teacherCount})` : ""}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 overflow-y-auto w-full custom-scrollbar pr-1 content-start">
                {course.teachers.length > 0 ? (
                  course.teachers.map((teacher) => (
                    <Link
                      key={`${course.id}-${teacher.id}`}
                      href={buildTeacherPath(teacher.id)}
                      className="whitespace-nowrap bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs hover:bg-[var(--first-color)] hover:text-white transition-colors border border-gray-100"
                    >
                      {teacher.name}
                    </Link>
                  ))
                ) : (
                  <div className="rounded-full border border-dashed border-gray-200 px-3 py-1 text-xs text-gray-400">
                    {isLoading ? "教师信息加载中..." : "暂无授课教师"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="right bg-white p-4 rounded-[15px] shadow-lg h-80">
          {hasError && !isLoading && courses.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              随机课程加载失败，请稍后重试。
            </div>
          ) : (
          <div className="course-rate flex flex-col  h-full ">
            <div className="avg-rate self-center flex justify-around w-full items-center">
              <div className="flex">
                <div className="text-6xl font-bold self-center">{formatScore(course.avg_score)}</div>
                <div className="self-end text-gray-500">/ 5.0</div>
              </div>

              <div>
                <div className="mb-1">
                  <StarRating score={normalizeRating(course.avg_score)} size={"18px"} />
                </div>

                <div className="text-md text-gray-500">
                  基于 <strong> {course.eval_count ?? 0} </strong>条评价
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-start justify-evenly gap-1 text-center w-full">
              <RatingBar
                label={"推荐指数"}
                score={normalizeRating(course.avg_score)}
                maxScore={5.0}
                color={1}
              />
              <RatingBar
                label={"给分情况"}
                score={normalizeRating(course.avg_homework)}
                maxScore={5.0}
                color={1}
              />
              <RatingBar
                label={"任务量"}
                score={normalizeRating(course.avg_exam_diff)}
                maxScore={5.0}
                color={2}
              />
              <RatingBar
                label={"课程收获"}
                score={normalizeRating(course.avg_gain)}
                maxScore={5.0}
                color={2}
              />
            </div>
          </div>
          )}
        </div>
      </div>
    </>
  );
}
