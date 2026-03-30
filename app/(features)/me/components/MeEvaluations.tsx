"use client";

import {useState} from "react";
import GlassCard from "@/components/ui/GlassCard";
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
  const [evaluationFilter, setEvaluationFilter] = useState<
      "all" | "teacher" | "course"
  >("all");

  const filteredTeacherEvaluations =
      evaluationFilter === "all" || evaluationFilter === "teacher"
          ? teacherEvaluations.items
          : [];
  const filteredCourseEvaluations =
      evaluationFilter === "all" || evaluationFilter === "course"
          ? courseEvaluations.items
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
              {filteredTeacherEvaluations.map((item) => (
                  <GlassCard key={`teacher-${item.id}`} className="p-5">
                    <div
                        className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                        <span
                            className="rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-xs text-gray-600">
                          教师评价
                        </span>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                          {item.mode === "linked" || item.course_id ? "关联评价" : "单独评价"}
                        </span>
                          <span className="text-sm text-gray-500">
                          #{item.teacher_id}
                        </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          发布于 {formatDateTime(item.created_at)}
                        </p>
                        {item.course_id ? (
                            <p className="mt-1 text-sm text-gray-500">
                              关联课程：{item.course_name || `#${item.course_id}`}
                            </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="mb-3 text-sm leading-6 text-gray-700">
                      {item.comment || "未填写文字评价"}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <StatPill
                          label="综合评分"
                          value={`${item.avg_rating}`}
                      />
                      <StatPill
                          label="教学质量"
                          value={`${item.rating_quality ?? "-"}`}
                      />
                      <StatPill
                          label="给分宽松"
                          value={`${item.rating_grading ?? "-"}`}
                      />
                      <StatPill
                          label="考勤要求"
                          value={`${item.rating_attendance ?? "-"}`}
                      />
                      {item.course_id ? (
                          <StatPill
                              label="作业量"
                              value={`${item.rating_homework ?? "-"}`}
                          />
                      ) : null}
                      {item.course_id ? (
                          <StatPill
                              label="收获感"
                              value={`${item.rating_gain ?? "-"}`}
                          />
                      ) : null}
                      {item.course_id ? (
                          <StatPill
                              label="考试难度"
                              value={`${item.rating_exam_difficulty ?? "-"}`}
                          />
                      ) : null}
                      <StatPill
                          label="点赞"
                          value={formatNumber(item.likes)}
                      />
                    </div>
                  </GlassCard>
              ))}

              {filteredCourseEvaluations.map((item) => (
                  <GlassCard key={`course-${item.id}`} className="p-5">
                    <div
                        className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                        <span
                            className="rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-xs text-gray-600">
                          课程评价
                        </span>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                          {item.mode === "linked" || item.teacher_id ? "关联评价" : "单独评价"}
                        </span>
                          <span className="text-sm text-gray-500">
                          #{item.course_id}
                        </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          发布于 {formatDateTime(item.created_at)}
                        </p>
                        {item.teacher_id ? (
                            <p className="mt-1 text-sm text-gray-500">
                              关联教师：{item.teacher_name || `#${item.teacher_id}`}
                            </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="mb-3 text-sm leading-6 text-gray-700">
                      {item.comment || "未填写文字评价"}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <StatPill
                          label="综合评分"
                          value={`${item.avg_rating}`}
                      />
                      <StatPill
                          label="作业量"
                          value={`${item.rating_homework ?? "-"}`}
                      />
                      <StatPill
                          label="收获感"
                          value={`${item.rating_gain ?? "-"}`}
                      />
                      <StatPill
                          label="考试难度"
                          value={`${item.rating_exam_difficulty ?? "-"}`}
                      />
                      {item.teacher_id ? (
                          <StatPill
                              label="教学质量"
                              value={`${item.rating_quality ?? "-"}`}
                          />
                      ) : null}
                      {item.teacher_id ? (
                          <StatPill
                              label="给分宽松"
                              value={`${item.rating_grading ?? "-"}`}
                          />
                      ) : null}
                      {item.teacher_id ? (
                          <StatPill
                              label="考勤要求"
                              value={`${item.rating_attendance ?? "-"}`}
                          />
                      ) : null}
                      <StatPill
                          label="点赞"
                          value={formatNumber(item.likes)}
                      />
                    </div>
                  </GlassCard>
              ))}
            </div>
        )}
      </div>
  );
}

function StatPill({label, value}: { label: string; value: string }) {
  return (
      <div className="rounded-full border border-gray-200/70 bg-white/55 px-3 py-1.5 text-xs text-gray-600">
        <span className="mr-2 text-gray-400">{label}</span>
        <span className="font-medium text-gray-800">{value}</span>
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
