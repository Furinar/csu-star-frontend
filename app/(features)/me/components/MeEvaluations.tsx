"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {
  deleteCourseEvaluation,
  deleteTeacherEvaluation,
  updateCourseEvaluation,
  updateTeacherEvaluation,
} from "@/api/detail";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import GlassCard from "@/components/ui/GlassCard";
import EntityTypeBadge from "@/components/ui/EntityTypeBadge";
import ItemActionMenu from "@/components/ui/ItemActionMenu";
import { buildCoursePath, buildTeacherPath } from "@/lib/paths";
import { feedback } from "@/store/useFeedbackStore";
import type { CourseEvaluationInput, TeacherEvaluationInput } from "@/types/detail";
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

function mergeTeacherEvaluation(
    current: TeacherEvaluation,
    updated: Awaited<ReturnType<typeof updateTeacherEvaluation>>,
): TeacherEvaluation {
  if (!updated) return current;

  return {
    ...current,
    id: updated.id,
    teacher_id: updated.teacher_id,
    teacher_name: current.teacher_name,
    mode: updated.mode,
    course_id: updated.course_id,
    course_name: updated.course_name,
    rating_quality: updated.rating_quality ?? undefined,
    rating_grading: updated.rating_grading ?? undefined,
    rating_attendance: updated.rating_attendance ?? undefined,
    rating_homework: updated.rating_homework ?? undefined,
    rating_gain: updated.rating_gain ?? undefined,
    rating_exam_difficulty: updated.rating_exam_difficulty ?? undefined,
    avg_rating: updated.avg_rating ?? current.avg_rating,
    comment: updated.comment,
    is_anonymous: updated.is_anonymous,
    likes: updated.likes ?? current.likes,
    is_liked: updated.is_liked ?? current.is_liked,
    created_at: updated.created_at || current.created_at,
  };
}

function mergeCourseEvaluation(
    current: CourseEvaluation,
    updated: Awaited<ReturnType<typeof updateCourseEvaluation>>,
): CourseEvaluation {
  if (!updated) return current;

  return {
    ...current,
    id: updated.id,
    course_id: updated.course_id,
    course_name: current.course_name,
    mode: updated.mode,
    teacher_id: updated.teacher_id,
    teacher_name: updated.teacher_name,
    rating_homework: updated.rating_homework ?? undefined,
    rating_gain: updated.rating_gain ?? undefined,
    rating_exam_difficulty: updated.rating_exam_difficulty ?? undefined,
    rating_quality: updated.rating_quality ?? undefined,
    rating_grading: updated.rating_grading ?? undefined,
    rating_attendance: updated.rating_attendance ?? undefined,
    avg_rating: updated.avg_rating ?? current.avg_rating,
    comment: updated.comment,
    is_anonymous: updated.is_anonymous,
    likes: updated.likes ?? current.likes,
    is_liked: updated.is_liked ?? current.is_liked,
    created_at: updated.created_at || current.created_at,
  };
}

export default function MeEvaluations({
  teacherEvaluations,
  courseEvaluations,
}: MeEvaluationsProps) {
  const router = useRouter();
  const [teacherItems, setTeacherItems] = useState(teacherEvaluations.items ?? []);
  const [courseItems, setCourseItems] = useState(courseEvaluations.items ?? []);
  const [evaluationFilter, setEvaluationFilter] = useState<
      "all" | "teacher" | "course"
  >("all");
  const [editingTeacherEvaluation, setEditingTeacherEvaluation] = useState<TeacherEvaluation | null>(null);
  const [editingCourseEvaluation, setEditingCourseEvaluation] = useState<CourseEvaluation | null>(null);

  const teacherEvaluationItems = teacherItems;
  const courseEvaluationItems = courseItems;

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
                const teacherName = item.teacher_name || `教师 #${item.teacher_id}`;
                const cardContent = (
                    <GlassCard
                        className="p-5 transition-all hover:bg-white/55 hover:shadow-[0_12px_36px_0_rgba(31,38,135,0.18)]">
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex w-full items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-900">
                                {teacherName}
                              </h4>
                            </div>
                            <EntityTypeBadge type="teacher" label="教师评价" />
                          </div>
                          <p className="mt-3 text-sm text-gray-500">
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
                      <div className="mb-3 rounded-2xl bg-slate-100/90 px-4 py-3 text-sm leading-6 text-gray-700">
                        {item.comment || "未填写文字评价"}
                      </div>
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
                      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-500">
                        <span>点击查看教师详情</span>
                        <div
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                        >
                          <ItemActionMenu
                              items={[
                                {
                                  key: "edit",
                                  label: "修改评价",
                                  onClick: async () => {
                                    setEditingTeacherEvaluation(item);
                                  },
                                },
                                {
                                  key: "delete",
                                  label: "删除评价",
                                  destructive: true,
                                  onClick: async () => {
                                    try {
                                      await deleteTeacherEvaluation(item.id);
                                      setTeacherItems((prev) => prev.filter((entry) => entry.id !== item.id));
                                      feedback.success({ title: "评价已删除" });
                                    } catch (error) {
                                      console.error(error);
                                      feedback.error({ title: "删除失败", description: "请稍后重试。" });
                                    }
                                  },
                                },
                              ]}
                          />
                        </div>
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
                const courseName = item.course_name || `课程 #${item.course_id}`;
                const cardContent = (
                    <GlassCard
                        className="p-5 transition-all hover:bg-white/55 hover:shadow-[0_12px_36px_0_rgba(31,38,135,0.18)]">
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex w-full items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-900">
                                {courseName}
                              </h4>
                            </div>
                            <EntityTypeBadge type="course" label="课程评价" />
                          </div>
                          <p className="mt-3 text-sm text-gray-500">
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
                      <div className="mb-3 rounded-2xl bg-slate-100/90 px-4 py-3 text-sm leading-6 text-gray-700">
                        {item.comment || "未填写文字评价"}
                      </div>
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
                      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-500">
                        <span>点击查看课程详情</span>
                        <div
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                        >
                          <ItemActionMenu
                              items={[
                                {
                                  key: "edit",
                                  label: "修改评价",
                                  onClick: async () => {
                                    setEditingCourseEvaluation(item);
                                  },
                                },
                                {
                                  key: "delete",
                                  label: "删除评价",
                                  destructive: true,
                                  onClick: async () => {
                                    try {
                                      await deleteCourseEvaluation(item.id);
                                      setCourseItems((prev) => prev.filter((entry) => entry.id !== item.id));
                                      feedback.success({ title: "评价已删除" });
                                    } catch (error) {
                                      console.error(error);
                                      feedback.error({ title: "删除失败", description: "请稍后重试。" });
                                    }
                                  },
                                },
                              ]}
                          />
                        </div>
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

        <DetailComposerModal
            isOpen={editingTeacherEvaluation !== null}
            onClose={() => setEditingTeacherEvaluation(null)}
            accent="teacher"
            badge="教师评价"
            title="修改教师评价"
            description="更新你的教师评价内容和评分。"
        >
          {editingTeacherEvaluation ? (
              <EvaluationComposerForm
                  key={`edit-teacher-${editingTeacherEvaluation.id}`}
                  evaluationType="teacher"
                  relatedItems={
                    editingTeacherEvaluation.course_id
                        ? [
                          {
                            id: Number(editingTeacherEvaluation.course_id),
                            name: editingTeacherEvaluation.course_name || `课程 #${editingTeacherEvaluation.course_id}`,
                          },
                        ]
                        : []
                  }
                  submitLabel="保存修改"
                  initialValues={{
                    relatedId: editingTeacherEvaluation.course_id ? Number(editingTeacherEvaluation.course_id) : null,
                    comment: editingTeacherEvaluation.comment ?? "",
                    anonymous: editingTeacherEvaluation.is_anonymous ?? false,
                    ratings: {
                      rating_quality: editingTeacherEvaluation.rating_quality,
                      rating_grading: editingTeacherEvaluation.rating_grading,
                      rating_attendance: editingTeacherEvaluation.rating_attendance,
                      rating_homework: editingTeacherEvaluation.rating_homework,
                      rating_gain: editingTeacherEvaluation.rating_gain,
                      rating_exam_difficulty: editingTeacherEvaluation.rating_exam_difficulty,
                    },
                  }}
                  onSubmit={async (payload) => {
                    try {
                      const updated = await updateTeacherEvaluation(
                          editingTeacherEvaluation.id,
                          payload as unknown as TeacherEvaluationInput,
                      );
                      if (!updated) return;
                      setTeacherItems((prev) =>
                          prev.map((entry) =>
                              entry.id === editingTeacherEvaluation.id
                                  ? mergeTeacherEvaluation(entry, updated)
                                  : entry,
                          ),
                      );
                      setEditingTeacherEvaluation(null);
                      feedback.success({ title: "评价已更新" });
                    } catch (error) {
                      console.error(error);
                      feedback.error({ title: "更新失败", description: "请稍后重试。" });
                      throw error;
                    }
                  }}
              />
          ) : null}
        </DetailComposerModal>

        <DetailComposerModal
            isOpen={editingCourseEvaluation !== null}
            onClose={() => setEditingCourseEvaluation(null)}
            accent="course"
            badge="课程评价"
            title="修改课程评价"
            description="更新你的课程评价内容和评分。"
        >
          {editingCourseEvaluation ? (
              <EvaluationComposerForm
                  key={`edit-course-${editingCourseEvaluation.id}`}
                  evaluationType="course"
                  relatedItems={
                    editingCourseEvaluation.teacher_id
                        ? [
                          {
                            id: Number(editingCourseEvaluation.teacher_id),
                            name: editingCourseEvaluation.teacher_name || `教师 #${editingCourseEvaluation.teacher_id}`,
                          },
                        ]
                        : []
                  }
                  submitLabel="保存修改"
                  initialValues={{
                    relatedId: editingCourseEvaluation.teacher_id ? Number(editingCourseEvaluation.teacher_id) : null,
                    comment: editingCourseEvaluation.comment ?? "",
                    anonymous: editingCourseEvaluation.is_anonymous ?? false,
                    ratings: {
                      rating_homework: editingCourseEvaluation.rating_homework,
                      rating_gain: editingCourseEvaluation.rating_gain,
                      rating_exam_difficulty: editingCourseEvaluation.rating_exam_difficulty,
                      rating_quality: editingCourseEvaluation.rating_quality,
                      rating_grading: editingCourseEvaluation.rating_grading,
                      rating_attendance: editingCourseEvaluation.rating_attendance,
                    },
                  }}
                  onSubmit={async (payload) => {
                    try {
                      const updated = await updateCourseEvaluation(
                          editingCourseEvaluation.id,
                          payload as unknown as CourseEvaluationInput,
                      );
                      if (!updated) return;
                      setCourseItems((prev) =>
                          prev.map((entry) =>
                              entry.id === editingCourseEvaluation.id
                                  ? mergeCourseEvaluation(entry, updated)
                                  : entry,
                          ),
                      );
                      setEditingCourseEvaluation(null);
                      feedback.success({ title: "评价已更新" });
                    } catch (error) {
                      console.error(error);
                      feedback.error({ title: "更新失败", description: "请稍后重试。" });
                      throw error;
                    }
                  }}
              />
          ) : null}
        </DetailComposerModal>
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
