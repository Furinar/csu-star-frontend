"use client";

/* eslint-disable @next/next/no-img-element */
import "@/app/(features)/course/components/style.css";
import Link from "next/link";
import styled from "styled-components";
import CollectButton from "@/components/ui/CollectButton";
import RatingBar from "@/components/ui/RatingBar";
import StarRating from "@/components/ui/StarRating";
import { getDepartmentNameById } from "@/data/departments";
import { isPublicCourseType } from "@/lib/courseType";
import {
  buildCoursePath,
  buildResourceCollectionPath,
  buildTeacherPath,
} from "@/lib/paths";
import { getPageTheme } from "@/lib/pageTheme";
import type { CourseDetail, TeacherDetail } from "@/types/detail";

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

  .homepage-button .svg-wrapper-1 {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .homepage-button .svg-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease-in-out;
    will-change: transform;
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
    transform: translateX(1.35em) rotate(45deg) scale(1.08);
  }

  .homepage-button:hover .button-label {
    transform: translateX(5.2em);
    opacity: 0;
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

type HeroScoreCardProps = {
  avgScore?: number | null;
  evalCount?: number | null;
  bars: Array<{
    label: string;
    score?: number | null;
    gradient: string;
  }>;
  compact?: boolean;
};

function HeroScoreCard({
  avgScore,
  evalCount,
  bars,
  compact = false,
}: HeroScoreCardProps) {
  return (
    <div className="course-rate flex h-full flex-col">
      <div
        className={`avg-rate flex w-full flex-nowrap items-center self-center ${
          compact ? "justify-between gap-2" : "justify-around"
        }`}
      >
        <div className="flex flex-nowrap items-baseline gap-1">
          <div className={`self-center font-bold ${compact ? "text-3xl" : "text-6xl"}`}>
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

      <div className={`flex w-full flex-1 flex-col items-start justify-evenly text-center ${compact ? "mt-2 gap-0.5" : "gap-1"}`}>
        {bars.map((bar) => (
          <RatingBar
            key={bar.label}
            label={bar.label}
            score={normalizeRating(bar.score)}
            maxScore={5}
            gradient={bar.gradient}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

type MobileResourceLinkProps = {
  href: string;
  count: number;
};

function MobileResourceLink({ href, count }: MobileResourceLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 md:hidden"
    >
      <i className="uil uil-file-alt text-sm text-[var(--first-color)]"></i>
      <span>关联资源</span>
      <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-600">{count}</span>
    </Link>
  );
}

export default function DetailBookHero(props: DetailBookHeroProps) {
  if (props.variant === "course") {
    const course = props.data;
    const teachers = course.teachers || [];
    const resourcePath = buildResourceCollectionPath(course.id);
    const resourceCount = course.resource_count ?? 0;
    const courseTypeChars = isPublicCourseType(course.course_type)
      ? ["公", "选"]
      : ["非", "公", "选"];

    return (
      <div
        className="random-book relative grid h-auto min-h-[220px] grid-cols-1 gap-3 p-3 md:min-h-[360px] md:gap-5 md:p-5 lg:grid-cols-[3fr_2fr]"
        style={COURSE_HERO_STYLE}
      >
        <div className="absolute top-0 left-4 flex flex-col rounded-b-sm bg-first px-1 py-0.5 text-xs font-bold text-white shadow-lg md:left-7 md:px-1.5 md:py-1 md:text-base">
          {courseTypeChars.map((char, index) => (
            <span key={`${course.id}-${index}-${char}`}>{char}</span>
          ))}
        </div>

        <div className="left flex flex-col gap-3 md:gap-4">
          <div className="course-info mt-2 flex flex-nowrap items-center justify-between gap-2 overflow-hidden md:mt-0 md:gap-4">
            <Link
              href={buildCoursePath(course.id)}
              className="course-name min-w-0 flex-1 truncate whitespace-nowrap pl-10 pb-1 text-2xl font-extrabold tracking-tight text-slate-950 drop-shadow-sm md:pl-15 md:text-4xl"
            >
              {course.name}
            </Link>

            <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap md:ml-0 md:gap-3">
              <MobileResourceLink href={resourcePath} count={resourceCount} />
              <CollectButton
                size="sm"
                targetId={course.id}
                targetType="course"
                initialStatus={course.is_favorited ?? false}
              />
            </div>
          </div>

          <div className="course-relate flex-1 grid grid-cols-1 gap-3 pt-3 md:grid-cols-2 md:gap-6 md:pt-4">
            <div
              className={`resource-card hidden flex-col justify-between rounded-xl p-4 transition-transform hover:-translate-y-1 md:flex md:rounded-2xl md:p-5 ${COURSE_CARD_CLASS}`}
            >
              <div className="mb-2 flex items-center gap-2 text-gray-500">
                <i className="uil uil-file-alt text-xl text-[var(--first-color)]"></i>
                <span className="text-sm font-medium text-gray-600">关联资源</span>
              </div>
              <div className="my-2 flex flex-1 items-center justify-center text-5xl font-bold tracking-tight text-gray-800">
                {resourceCount}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                  <i className="uil uil-import text-sm"></i>
                  课程资源
                </div>
                <Link
                  href={resourcePath}
                  className="rounded-md px-2 py-1 text-xs font-medium text-[var(--first-color)] transition-colors hover:bg-[var(--first-color)] hover:text-white"
                >
                  资源详情
                </Link>
              </div>
            </div>

            <div className="flex min-h-[176px] gap-3 md:contents md:min-h-0">
              <div
                className={`teacher-card flex min-w-0 flex-1 flex-col rounded-xl p-3 transition-transform hover:-translate-y-1 md:rounded-2xl md:p-5 ${COURSE_CARD_CLASS}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2 text-gray-500 md:mb-3 md:gap-3">
                  <div className="flex items-center gap-1 md:gap-2">
                    <i className="uil uil-user-circle text-base text-[var(--first-color)] md:text-xl"></i>
                    <span className="text-xs font-medium text-gray-600 md:text-sm">
                      授课教师 {teachers.length ? `(${teachers.length})` : ""}
                    </span>
                  </div>
                  {props.onAddRelation ? (
                    <button
                      type="button"
                      onClick={props.onAddRelation}
                      disabled={props.isAddingRelation}
                      className="whitespace-nowrap rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-sky-600 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-70 md:px-3 md:py-1 md:text-xs"
                    >
                      {props.isAddingRelation ? "..." : "+"}
                    </button>
                  ) : null}
                </div>

                <div className="custom-scrollbar content-start flex w-full flex-wrap gap-1.5 overflow-y-auto pr-1 md:gap-2">
                  {teachers.length > 0 ? (
                    teachers.map((teacher) => (
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
                      暂无授课教师
                    </div>
                  )}
                </div>
              </div>

              <div className={`right flex min-w-0 flex-1 flex-col rounded-xl p-3 md:hidden ${COURSE_CARD_CLASS}`}>
                <HeroScoreCard
                  avgScore={course.avg_score}
                  evalCount={course.eval_count}
                  compact
                  bars={[
                    {
                      label: "推荐指数",
                      score: course.avg_score,
                      gradient: courseTheme.ratingGradients[0],
                    },
                    {
                      label: "给分情况",
                      score: course.avg_homework,
                      gradient: courseTheme.ratingGradients[1],
                    },
                    {
                      label: "任务量",
                      score: course.avg_exam_diff,
                      gradient: courseTheme.ratingGradients[2],
                    },
                    {
                      label: "课程收获",
                      score: course.avg_gain,
                      gradient: courseTheme.ratingGradients[0],
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`right hidden h-80 rounded-[15px] p-4 md:block ${COURSE_CARD_CLASS}`}>
          <HeroScoreCard
            avgScore={course.avg_score}
            evalCount={course.eval_count}
            bars={[
              {
                label: "推荐指数",
                score: course.avg_score,
                gradient: courseTheme.ratingGradients[0],
              },
              {
                label: "给分情况",
                score: course.avg_homework,
                gradient: courseTheme.ratingGradients[1],
              },
              {
                label: "任务量",
                score: course.avg_exam_diff,
                gradient: courseTheme.ratingGradients[2],
              },
              {
                label: "课程收获",
                score: course.avg_gain,
                gradient: courseTheme.ratingGradients[0],
              },
            ]}
          />
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
      className="random-book relative grid h-auto min-h-[280px] grid-cols-1 gap-3 p-3 md:min-h-[360px] md:gap-5 md:p-5 lg:grid-cols-[3fr_2fr]"
      style={TEACHER_HERO_STYLE}
    >
      {teacher.title ? (
        <div className="absolute top-0 left-4 flex flex-col rounded-b-sm bg-rose-500 px-1 py-0.5 text-xs font-bold text-white shadow-lg md:left-7 md:px-1.5 md:py-1 md:text-base">
          <span>{teacher.title.slice(0, 1)}</span>
          {teacher.title.slice(1, 2) ? <span>{teacher.title.slice(1, 2)}</span> : null}
        </div>
      ) : null}

      <div className="left flex flex-col gap-3 md:gap-4">
        <div className="course-info flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-3xl font-bold text-rose-300 shadow-[10px_10px_22px_rgba(244,114,182,0.14),-10px_-10px_20px_rgba(255,255,255,0.95)] md:h-36 md:w-36 md:text-5xl">
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

            <div className="flex min-w-0 max-w-[520px] flex-col gap-1.5 md:gap-2">
              <div className="pb-0.5 text-2xl font-extrabold tracking-tight text-slate-950 drop-shadow-sm md:pb-1 md:text-4xl">
                {teacher.name}
              </div>
              {departmentName ? (
                <div className="text-xs text-gray-600 md:text-sm">{departmentName}</div>
              ) : null}
              {teacher.metadata?.tutor_type ? (
                <div className="text-xs text-gray-600 md:text-sm">
                  {teacher.metadata.tutor_type}
                </div>
              ) : null}
              {teacher.bio ? (
                <div className="max-h-[3.9rem] overflow-hidden text-xs leading-5 text-gray-600 md:max-h-[4.5rem] md:text-sm md:leading-6">
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
                    className="homepage-button scale-[0.92] origin-left md:scale-100"
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

          <div className="ml-auto flex items-center gap-2 md:ml-0 md:gap-3">
            <CollectButton
              size="sm"
              targetId={teacher.id}
              targetType="teacher"
              initialStatus={teacher.is_favorited ?? false}
            />
          </div>
        </div>

        <div className="course-relate flex-1 grid grid-cols-1 gap-3 pt-3 md:gap-6 md:pt-4">
          <div className="flex min-h-[176px] gap-3 md:contents md:min-h-0">
            <div
              className={`teacher-card flex min-w-0 flex-1 flex-col rounded-xl p-3 transition-transform hover:-translate-y-1 md:rounded-2xl md:p-5 ${TEACHER_CARD_CLASS}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2 text-gray-500 md:mb-3 md:gap-3">
                <div className="flex items-center gap-1 md:gap-2">
                  <i className="uil uil-book-open text-base text-rose-500 md:text-xl"></i>
                  <span className="text-xs font-medium text-gray-600 md:text-sm">
                    授课课程 {courses.length ? `(${courses.length})` : ""}
                  </span>
                </div>
                {props.onAddRelation ? (
                  <button
                    type="button"
                    onClick={props.onAddRelation}
                    disabled={props.isAddingRelation}
                    className="whitespace-nowrap rounded-full border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70 md:px-3 md:py-1 md:text-xs"
                  >
                    {props.isAddingRelation ? "处理中..." : "添加课程"}
                  </button>
                ) : null}
              </div>

              <div className="custom-scrollbar content-start flex w-full flex-wrap gap-1.5 overflow-y-auto pr-1 md:gap-2">
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <Link
                      key={`${teacher.id}-${course.id}`}
                      href={buildCoursePath(course.id)}
                      className="whitespace-nowrap rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600 transition-colors hover:bg-rose-500 hover:text-white md:px-3 md:text-xs"
                    >
                      {course.name}
                    </Link>
                  ))
                ) : (
                  <div className="rounded-full border border-dashed border-gray-200 px-2.5 py-1 text-[11px] text-gray-400 md:px-3 md:text-xs">
                    暂无授课课程
                  </div>
                )}
              </div>
            </div>

            <div className={`right flex min-w-0 flex-1 flex-col rounded-xl p-3 md:hidden ${TEACHER_CARD_CLASS}`}>
              <HeroScoreCard
                avgScore={teacher.avg_score}
                evalCount={teacher.eval_count}
                compact
                bars={[
                  {
                    label: "教学质量",
                    score: teacher.avg_quality,
                    gradient: teacherTheme.ratingGradients[0],
                  },
                  {
                    label: "给分情况",
                    score: teacher.avg_grading,
                    gradient: teacherTheme.ratingGradients[1],
                  },
                  {
                    label: "点名情况",
                    score: teacher.avg_attendance,
                    gradient: teacherTheme.ratingGradients[2],
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`right hidden h-80 rounded-[15px] p-4 md:block ${TEACHER_CARD_CLASS}`}>
        <HeroScoreCard
          avgScore={teacher.avg_score}
          evalCount={teacher.eval_count}
          bars={[
            {
              label: "教学质量",
              score: teacher.avg_quality,
              gradient: teacherTheme.ratingGradients[0],
            },
            {
              label: "给分情况",
              score: teacher.avg_grading,
              gradient: teacherTheme.ratingGradients[1],
            },
            {
              label: "点名情况",
              score: teacher.avg_attendance,
              gradient: teacherTheme.ratingGradients[2],
            },
          ]}
        />
      </div>
    </div>
  );
}
