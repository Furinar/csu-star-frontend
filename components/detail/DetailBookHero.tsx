"use client";

/* eslint-disable @next/next/no-img-element */
import "@/app/(features)/course/components/style.css";
import { getDepartmentNameById } from "@/data/departments";
import Link from "next/link";
import styled from "styled-components";
import CollectButton from "@/components/ui/CollectButton";
import RatingBar from "@/components/ui/RatingBar";
import StarRating from "@/components/ui/StarRating";
import { getPageTheme } from "@/lib/pageTheme";
import { isPublicCourseType } from "@/lib/courseType";
import type { CourseDetail, TeacherDetail } from "@/types/detail";
import {
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

const COURSE_HERO_STYLE = {
  background: "linear-gradient(135deg, #d9ecff 0%, #ffffff 48%, #d8eaff 100%)",
  boxShadow:
    "14px 14px 30px rgba(125, 163, 214, 0.26), -14px -14px 30px rgba(255, 255, 255, 0.96)",
};

const TEACHER_HERO_STYLE = {
  background: "linear-gradient(135deg, #ffe2ef 0%, #ffffff 48%, #fff1c9 100%)",
  boxShadow:
    "14px 14px 30px rgba(224, 164, 189, 0.24), -14px -14px 30px rgba(255, 255, 255, 0.96)",
};

const COURSE_CARD_CLASS =
  "border border-sky-100/80 bg-white/90 shadow-[10px_10px_22px_rgba(147,197,253,0.18)]";

const TEACHER_CARD_CLASS =
  "border border-rose-100/80 bg-white/92 shadow-[10px_10px_22px_rgba(244,114,182,0.14)]";

const courseTheme = getPageTheme("/course");
const teacherTheme = getPageTheme("/teacher");

const TeacherHomepageButtonShell = styled.div<{
  $accentGradient: string;
  $shadowColor: string;
}>`
  .homepage-button {
    font-size: 0.8rem;
    font-weight: 600;
    background: ${({ $accentGradient }) => $accentGradient};
    color: #fff;
    padding: 0.56em 0.82em 0.56em 0.72em;
    display: inline-flex;
    align-items: center;
    border: none;
    border-radius: 14px;
    overflow: hidden;
    transition: all 0.2s;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 10px 24px ${({ $shadowColor }) => $shadowColor};
  }

  .homepage-button .button-label {
    display: block;
    margin-left: 0.26em;
    transition: all 0.3s ease-in-out;
    white-space: nowrap;
  }

  .homepage-button svg {
    display: block;
    transform-origin: center center;
    transition: transform 0.3s ease-in-out;
  }

  .homepage-button:hover .svg-wrapper {
    animation: fly-1 0.6s ease-in-out infinite alternate;
  }

  .homepage-button:hover svg {
    transform: translateX(0.8em) rotate(45deg) scale(1.05);
  }

  .homepage-button:hover .button-label {
    transform: translateX(3.3em);
  }

  .homepage-button:active {
    transform: scale(0.95);
  }

  @keyframes fly-1 {
    from {
      transform: translateY(0.08em);
    }

    to {
      transform: translateY(-0.08em);
    }
  }
`;

type DetailBookHeroProps =
  | {
      variant: "course";
      data: CourseDetail;
      onAddRelation?: () => void;
      isAddingRelation?: boolean;
    }
  | {
      variant: "teacher";
      data: TeacherDetail;
      onAddRelation?: () => void;
      isAddingRelation?: boolean;
    };

export default function DetailBookHero(props: DetailBookHeroProps) {
  if (props.variant === "course") {
    const course = props.data;
    const teachers = course.teachers || [];
    const resourcePath = buildResourceCollectionPath(course.id);
    const courseTypeChars = isPublicCourseType(course.course_type)
      ? ["公", "选"]
      : ["非", "公", "选"];

    return (
      <div
        className="random-book relative grid h-auto min-h-[360px] grid-cols-1 gap-5 p-5 lg:grid-cols-[3fr_2fr]"
        style={COURSE_HERO_STYLE}
      >
        <div className="absolute top-0 left-7 flex flex-col rounded-b-sm bg-first px-1.5 py-1 text-white font-bold shadow-lg">
          {courseTypeChars.map((char, index) => (
            <span key={`${course.id}-${index}-${char}`}>{char}</span>
          ))}
        </div>

        <div className="left flex flex-col gap-4">
          <div className="course-info flex flex-wrap items-center justify-between gap-4">
            <Link
              href={buildCoursePath(course.id)}
              className="course-name pl-15 pb-1 text-4xl font-extrabold tracking-tight text-slate-950 drop-shadow-sm"
            >
              {course.name}
            </Link>

            <CollectButton
              size="sm"
              targetId={course.id}
              targetType="course"
              initialStatus={course.is_favorited ?? false}
            />
          </div>

          <div className="course-relate flex-1 grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
            <div
              className={`resource-card flex flex-col justify-between rounded-2xl p-5 transition-transform hover:-translate-y-1 ${COURSE_CARD_CLASS}`}
            >
              <div className="mb-2 flex items-center gap-2 text-gray-500">
                <i className="uil uil-file-alt text-xl text-[var(--first-color)]"></i>
                <span className="text-sm font-medium text-gray-600">
                  关联资源
                </span>
              </div>
              <div className="my-2 flex flex-1 items-center justify-center text-5xl font-bold tracking-tight text-gray-800">
                {course.resource_count ?? 0}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                  <i className="uil uil-import text-sm"></i> 课程资源
                </div>
                <Link
                  href={resourcePath}
                  className="rounded-md px-2 py-1 text-xs font-medium text-[var(--first-color)] transition-colors hover:bg-[var(--first-color)] hover:text-white"
                >
                  资源详情
                </Link>
              </div>
            </div>

            <div
              className={`teacher-card flex flex-col rounded-2xl p-5 transition-transform hover:-translate-y-1 ${COURSE_CARD_CLASS}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3 text-gray-500">
                <div className="flex items-center gap-2">
                  <i className="uil uil-user-circle text-xl text-[var(--first-color)]"></i>
                  <span className="text-sm font-medium text-gray-600">
                    授课教师 {teachers.length ? `(${teachers.length})` : ""}
                  </span>
                </div>
                {props.onAddRelation ? (
                  <button
                    type="button"
                    onClick={props.onAddRelation}
                    disabled={props.isAddingRelation}
                    className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-600 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {props.isAddingRelation ? "处理中..." : "添加教师"}
                  </button>
                ) : null}
              </div>

              <div className="custom-scrollbar content-start flex w-full flex-wrap gap-2 overflow-y-auto pr-1">
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <Link
                      key={`${course.id}-${teacher.id}`}
                      href={buildTeacherPath(teacher.id)}
                      className="whitespace-nowrap rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-[var(--first-color)] hover:text-white"
                    >
                      {teacher.name}
                    </Link>
                  ))
                ) : (
                  <div className="rounded-full border border-dashed border-gray-200 px-3 py-1 text-xs text-gray-400">
                    暂无授课教师
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`right h-80 rounded-[15px] p-4 ${COURSE_CARD_CLASS}`}>
          <div className="course-rate flex h-full flex-col">
            <div className="avg-rate flex w-full items-center justify-around self-center">
              <div className="flex">
                <div className="self-center text-6xl font-bold">
                  {formatScore(course.avg_score)}
                </div>
                <div className="self-end text-gray-500">/ 5.0</div>
              </div>

              <div>
                <div className="mb-1">
                  <StarRating
                    score={normalizeRating(course.avg_score)}
                    size="18px"
                    fillClassName="text-[var(--first-color)]"
                  />
                </div>

                <div className="text-md text-gray-500">
                  基于 <strong>{course.eval_count ?? 0}</strong> 条评价
                </div>
              </div>
            </div>

            <div className="flex w-full flex-1 flex-col items-start justify-evenly gap-1 text-center">
              <RatingBar
                label="推荐指数"
                score={normalizeRating(course.avg_score)}
                maxScore={5}
                gradient={courseTheme.ratingGradients[0]}
              />
              <RatingBar
                label="给分情况"
                score={normalizeRating(course.avg_homework)}
                maxScore={5}
                gradient={courseTheme.ratingGradients[1]}
              />
              <RatingBar
                label="任务量"
                score={normalizeRating(course.avg_exam_diff)}
                maxScore={5}
                gradient={courseTheme.ratingGradients[2]}
              />
              <RatingBar
                label="课程收获"
                score={normalizeRating(course.avg_gain)}
                maxScore={5}
                gradient={courseTheme.ratingGradients[0]}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const teacher = props.data;
  const courses = teacher.courses || [];
  const avatarInitial = teacher.name.slice(0, 1) || "?";
  const departmentName =
    teacher.department_name || getDepartmentNameById(teacher.department_id);

  return (
    <div
      className="random-book relative grid h-auto min-h-[360px] grid-cols-1 gap-5 p-5 lg:grid-cols-[3fr_2fr]"
      style={TEACHER_HERO_STYLE}
    >
      {teacher.title ? (
        <div className="absolute top-0 left-7 flex flex-col rounded-b-sm bg-rose-500 px-1.5 py-1 text-white font-bold shadow-lg">
          <span>{teacher.title.slice(0, 1)}</span>
          {teacher.title.slice(1, 2) ? (
            <span>{teacher.title.slice(1, 2)}</span>
          ) : null}
        </div>
      ) : null}

      <div className="left flex flex-col gap-4">
        <div className="course-info flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-5xl font-bold text-rose-300 shadow-[10px_10px_22px_rgba(244,114,182,0.14),-10px_-10px_20px_rgba(255,255,255,0.95)]">
              {teacher.avatar_url ? (
                <img
                  src={teacher.avatar_url}
                  alt={teacher.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{avatarInitial}</span>
              )}
            </div>

            <div className="flex max-w-[520px] flex-col gap-2">
              <div className="pb-1 text-4xl font-extrabold tracking-tight text-slate-950 drop-shadow-sm">
                {teacher.name}
              </div>
              {departmentName ? (
                <div className="text-sm text-gray-600">{departmentName}</div>
              ) : null}
              {teacher.metadata?.tutor_type ? (
                <div className="text-sm text-gray-600">
                  {teacher.metadata.tutor_type}
                </div>
              ) : null}
              {teacher.bio ? (
                <div className="max-h-[4.5rem] overflow-hidden text-sm leading-6 text-gray-600">
                  {teacher.bio}
                </div>
              ) : null}
              {teacher.metadata?.homepage_url ? (
                <TeacherHomepageButtonShell
                  $accentGradient={teacherTheme.pageAccentGradient}
                  $shadowColor={teacherTheme.pageAccentSoftStrong}
                >
                  <Link
                    href={teacher.metadata.homepage_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="homepage-button"
                  >
                    <span className="svg-wrapper-1" aria-hidden="true">
                      <span className="svg-wrapper">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width={18}
                          height={18}
                        >
                          <path fill="none" d="M0 0h24v24H0z" />
                          <path
                            fill="currentColor"
                            d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                          />
                        </svg>
                      </span>
                    </span>
                    <span className="button-label">教师主页</span>
                  </Link>
                </TeacherHomepageButtonShell>
              ) : null}
            </div>
          </div>

          <CollectButton
            size="sm"
            targetId={teacher.id}
            targetType="teacher"
            initialStatus={teacher.is_favorited ?? false}
          />
        </div>

        <div className="course-relate flex-1 grid grid-cols-1 gap-6 pt-4">
          <div
            className={`teacher-card flex flex-col rounded-2xl p-5 transition-transform hover:-translate-y-1 ${TEACHER_CARD_CLASS}`}
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-gray-500">
              <div className="flex items-center gap-2">
                <i className="uil uil-book-open text-xl text-rose-500"></i>
                <span className="text-sm font-medium text-gray-600">
                  授课课程 {courses.length ? `(${courses.length})` : ""}
                </span>
              </div>
              {props.onAddRelation ? (
                <button
                  type="button"
                  onClick={props.onAddRelation}
                  disabled={props.isAddingRelation}
                  className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {props.isAddingRelation ? "处理中..." : "添加课程"}
                </button>
              ) : null}
            </div>

            <div className="custom-scrollbar content-start flex w-full flex-wrap gap-2 overflow-y-auto pr-1">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <Link
                    key={`${teacher.id}-${course.id}`}
                    href={buildCoursePath(course.id)}
                    className="whitespace-nowrap rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-rose-500 hover:text-white"
                  >
                    {course.name}
                  </Link>
                ))
              ) : (
                <div className="rounded-full border border-dashed border-gray-200 px-3 py-1 text-xs text-gray-400">
                  暂无授课课程
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`right h-80 rounded-[15px] p-4 ${TEACHER_CARD_CLASS}`}>
        <div className="course-rate flex h-full flex-col">
          <div className="avg-rate flex w-full items-center justify-around self-center">
            <div className="flex">
              <div className="self-center text-6xl font-bold">
                {formatScore(teacher.avg_score)}
              </div>
              <div className="self-end text-gray-500">/ 5.0</div>
            </div>

            <div>
              <div className="mb-1">
                <StarRating
                  score={normalizeRating(teacher.avg_score)}
                  size="18px"
                  fillClassName="text-[var(--first-color)]"
                />
              </div>

              <div className="text-md text-gray-500">
                基于 <strong>{teacher.eval_count ?? 0}</strong> 条评价
              </div>
            </div>
          </div>

          <div className="flex w-full flex-1 flex-col items-start justify-evenly gap-1 text-center">
            <RatingBar
              label="教学质量"
              score={normalizeRating(teacher.avg_quality)}
              maxScore={5}
              gradient={teacherTheme.ratingGradients[0]}
            />
            <RatingBar
              label="给分情况"
              score={normalizeRating(teacher.avg_grading)}
              maxScore={5}
              gradient={teacherTheme.ratingGradients[1]}
            />
            <RatingBar
              label="点名情况"
              score={normalizeRating(teacher.avg_attendance)}
              maxScore={5}
              gradient={teacherTheme.ratingGradients[2]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
