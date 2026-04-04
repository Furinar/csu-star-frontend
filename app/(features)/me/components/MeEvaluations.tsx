"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import GlassCard from "@/components/ui/GlassCard";
import { buildCoursePath, buildTeacherPath } from "@/lib/paths";
import type {
  CourseEvaluation,
  PaginatedData,
  TeacherEvaluation,
} from "@/types/me";
import {formatDateTime, formatNumber} from "./shared/helpers";

interface MeEvaluationsProps {
  teacherEvaluations: PaginatedData<TeacherEvaluation>;
  courseEvaluations: PaginatedData<CourseEvaluation>;
}

export default function MeEvaluations({
  teacherEvaluations,
  courseEvaluations,
}: MeEvaluationsProps) {
  const router = useRouter();
  const [evaluationFilter, setEvaluationFilter] = useState<
      "all" | "teacher" | "course"
  >("all");

  const teacherEvaluationItems = teacherEvaluations.items ?? [];
  const courseEvaluationItems = courseEvaluations.items ?? [];

  const filteredTeacherEvaluations =
      evaluationFilter === "all" || evaluationFilter === "teacher"
          ? teacherEvaluationItems
          : [];
  const filteredCourseEvaluations =
      evaluationFilter === "all" || evaluationFilter === "course"
          ? courseEvaluationItems
          : [];

  return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            {key: "all" as const, label: "全部"},
            {key: "teacher" as const, label: "教师评价"},
            {key: "course" as const, label: "课程评价"},
          ].map((item) => (
              <button
                  key={item.key}
                  type="button"
                  onClick={() => setEvaluationFilter(item.key)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                      evaluationFilter === item.key
                          ? "bg-first text-white"
                          : "border border-gray-200/70 bg-white/50 text-gray-600 hover:bg-white/70"
                  }`}
              >
                {item.label}
              </button>
          ))}
        </div>

        {filteredTeacherEvaluations.length === 0 &&
        filteredCourseEvaluations.length === 0 ? (
            <SectionEmptyState
                title="暂无评价记录"
                description="你发布的教师评价和课程评价会汇总在这里。"
            />
        ) : (
            <div className="space-y-4">
              {filteredTeacherEvaluations.map((item) => {
                const linkedCourseName = item.course_name || (item.course_id ? `课程 #${item.course_id}` : null);
                const cardContent = (
                    <GlassCard
                        className="p-5 transition-all hover:bg-white/55 hover:shadow-[0_12px_36px_0_rgba(31,38,135,0.18)]">
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-xs text-gray-600">
                              教师评价
                            </span>
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                              {item.mode === "linked" || item.course_id ? "关联评价" : "单独评价"}
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              教师 #{item.teacher_id}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            发布于 {formatDateTime(item.created_at)}
                          </p>
                          {linkedCourseName ? (
                              <div className="mt-2 text-sm text-gray-600">
                                关联课程：
                                <span
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      if (item.course_id) {
                                        router.push(buildCoursePath(Number(item.course_id)));
                                      }
                                    }}
                                    className="ml-1 cursor-pointer font-medium text-gray-800 hover:text-first hover:underline"
                                >
                                  {linkedCourseName}
                                </span>
                              </div>
                          ) : null}
                        </div>
                      </div>
                      <p className="mb-3 text-sm leading-6 text-gray-700">
                        {item.comment || "未填写文字评价"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-star text-lg text-amber-500"></i>
                          <span>综合 {item.avg_rating}</span>
                        </div>
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-presentation-line text-lg text-sky-500"></i>
                          <span>教学 {item.rating_quality ?? "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-file-check-alt text-lg text-emerald-500"></i>
                          <span>给分 {item.rating_grading ?? "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-user-check text-lg text-rose-500"></i>
                          <span>考勤 {item.rating_attendance ?? "-"}</span>
                        </div>
                        {item.course_id ? (
                            <div className="flex items-center gap-1.5 transition-colors">
                              <i className="uil uil-edit text-lg text-violet-500"></i>
                              <span>作业 {item.rating_homework ?? "-"}</span>
                            </div>
                        ) : null}
                        {item.course_id ? (
                            <div className="flex items-center gap-1.5 transition-colors">
                              <i className="uil uil-book-reader text-lg text-cyan-500"></i>
                              <span>收获 {item.rating_gain ?? "-"}</span>
                            </div>
                        ) : null}
                        {item.course_id ? (
                            <div className="flex items-center gap-1.5 transition-colors">
                              <i className="uil uil-chart-down text-lg text-orange-500"></i>
                              <span>考试 {item.rating_exam_difficulty ?? "-"}</span>
                            </div>
                        ) : null}
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-thumbs-up text-lg text-rose-500"></i>
                          <span>点赞 {formatNumber(item.likes)}</span>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        点击查看教师详情
                      </div>
                    </GlassCard>
                );

                return (
                    <Link
                        key={`teacher-${item.id}`}
                        href={buildTeacherPath(item.teacher_id)}
                        className="block"
                    >
                      {cardContent}
                    </Link>
                );
              })}

              {filteredCourseEvaluations.map((item) => {
                const linkedTeacherName = item.teacher_name || (item.teacher_id ? `教师 #${item.teacher_id}` : null);
                const cardContent = (
                    <GlassCard
                        className="p-5 transition-all hover:bg-white/55 hover:shadow-[0_12px_36px_0_rgba(31,38,135,0.18)]">
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-xs text-gray-600">
                              课程评价
                            </span>
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                              {item.mode === "linked" || item.teacher_id ? "关联评价" : "单独评价"}
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              课程 #{item.course_id}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            发布于 {formatDateTime(item.created_at)}
                          </p>
                          {linkedTeacherName ? (
                              <div className="mt-2 text-sm text-gray-600">
                                关联教师：
                                <span
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      if (item.teacher_id) {
                                        router.push(buildTeacherPath(Number(item.teacher_id)));
                                      }
                                    }}
                                    className="ml-1 cursor-pointer font-medium text-gray-800 hover:text-first hover:underline"
                                >
                                  {linkedTeacherName}
                                </span>
                              </div>
                          ) : null}
                        </div>
                      </div>
                      <p className="mb-3 text-sm leading-6 text-gray-700">
                        {item.comment || "未填写文字评价"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-star text-lg text-amber-500"></i>
                          <span>综合 {item.avg_rating}</span>
                        </div>
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-edit text-lg text-violet-500"></i>
                          <span>作业 {item.rating_homework ?? "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-book-reader text-lg text-cyan-500"></i>
                          <span>收获 {item.rating_gain ?? "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-chart-down text-lg text-orange-500"></i>
                          <span>考试 {item.rating_exam_difficulty ?? "-"}</span>
                        </div>
                        {item.teacher_id ? (
                            <div className="flex items-center gap-1.5 transition-colors">
                              <i className="uil uil-presentation-line text-lg text-sky-500"></i>
                              <span>教学 {item.rating_quality ?? "-"}</span>
                            </div>
                        ) : null}
                        {item.teacher_id ? (
                            <div className="flex items-center gap-1.5 transition-colors">
                              <i className="uil uil-file-check-alt text-lg text-emerald-500"></i>
                              <span>给分 {item.rating_grading ?? "-"}</span>
                            </div>
                        ) : null}
                        {item.teacher_id ? (
                            <div className="flex items-center gap-1.5 transition-colors">
                              <i className="uil uil-user-check text-lg text-rose-500"></i>
                              <span>考勤 {item.rating_attendance ?? "-"}</span>
                            </div>
                        ) : null}
                        <div className="flex items-center gap-1.5 transition-colors">
                          <i className="uil uil-thumbs-up text-lg text-rose-500"></i>
                          <span>点赞 {formatNumber(item.likes)}</span>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        点击查看课程详情
                      </div>
                    </GlassCard>
                );

                return (
                    <Link
                        key={`course-${item.id}`}
                        href={buildCoursePath(item.course_id)}
                        className="block"
                    >
                      {cardContent}
                    </Link>
                );
              })}
            </div>
        )}
      </div>
  );
}

function SectionEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
      <GlassCard className="border-dashed p-12 text-center">
        <img
            src="/undraw_mcp-server_7kvc.svg"
            alt="空状态插画"
            className="mx-auto mb-4 h-24 w-auto opacity-90"
        />
        <h3 className="mb-2 text-xl font-medium text-gray-800">{title}</h3>
        <p className="mx-auto max-w-md text-gray-500">{description}</p>
      </GlassCard>
  );
}
