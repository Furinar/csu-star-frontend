"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {
  deleteCourseEvaluation,
  updateCourseEvaluation,
} from "@/api/detail";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import GlassCard from "@/components/ui/GlassCard";
import EntityTypeBadge from "@/components/ui/EntityTypeBadge";
import ItemActionMenu from "@/components/ui/ItemActionMenu";
import { buildCoursePath, buildTeacherPath } from "@/lib/paths";
import { feedback } from "@/store/useFeedbackStore";
import type { CourseEvaluationInput } from "@/types/detail";
import type {
  CourseEvaluation,
  PaginatedData,
} from "@/types/me";
import {formatDateTime, formatNumber} from "./shared/helpers";

interface MeEvaluationsProps {
  courseEvaluations: PaginatedData<CourseEvaluation>;
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
  courseEvaluations,
}: MeEvaluationsProps) {
  const router = useRouter();
  const [courseItems, setCourseItems] = useState(courseEvaluations.items ?? []);
  const [editingCourseEvaluation, setEditingCourseEvaluation] = useState<CourseEvaluation | null>(null);

  const filteredCourseEvaluations = courseItems;

  return (
      <div className="space-y-3 sm:space-y-4">
        {filteredCourseEvaluations.length === 0 ? (
            <SectionEmptyState
                title="暂无评价记录"
                description="你发布的课程评价会汇总在这里。"
            />
        ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredCourseEvaluations.map((item) => {
                const linkedTeacherName = item.teacher_name || (item.teacher_id ? `教师 #${item.teacher_id}` : null);
                const courseName = item.course_name || `课程 #${item.course_id}`;
                const cardContent = (
                    <GlassCard
                        className="rounded-xl p-3 sm:rounded-2xl sm:p-5 transition-all hover:bg-white/55 hover:shadow-[0_12px_36px_0_rgba(31,38,135,0.18)]">
                      <div className="mb-2.5 flex flex-col gap-2.5 sm:mb-3 sm:gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex w-full items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-[15px] font-semibold leading-6 text-gray-900 sm:text-base">
                                {courseName}
                              </h4>
                            </div>
                            <EntityTypeBadge
                              type="course"
                              label="课程评价"
                              className="shrink-0 scale-90 origin-top-right sm:scale-100"
                            />
                          </div>
                          <p className="mt-2 text-xs text-gray-500 sm:mt-3 sm:text-sm">
                            发布于 {formatDateTime(item.created_at)}
                          </p>
                          {linkedTeacherName ? (
                              <div className="mt-1.5 text-xs text-gray-600 sm:mt-2 sm:text-sm">
                                关联教师：
                                <span
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      if (item.teacher_id) {
                                        router.push(buildTeacherPath(item.teacher_id));
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
                      {item.comment ? (
                        <div className="mb-2.5 rounded-xl bg-slate-100/90 px-3 py-2.5 text-xs leading-5 text-gray-700 sm:mb-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
                          {item.comment}
                        </div>
                      ) : (
                        <div className="mb-2.5 sm:mb-3"></div>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-600 sm:gap-x-5 sm:gap-y-2 sm:text-sm">
                        <div className="flex items-center gap-1 transition-colors sm:gap-1.5">
                          <i className="uil uil-star text-base text-amber-500 sm:text-lg"></i>
                          <span>综合 {item.avg_rating}</span>
                        </div>
                        <div className="flex items-center gap-1 transition-colors sm:gap-1.5">
                          <i className="uil uil-edit text-base text-violet-500 sm:text-lg"></i>
                          <span>作业 {item.rating_homework ?? "-"}</span>
                        </div>
                        <div className="flex items-center gap-1 transition-colors sm:gap-1.5">
                          <i className="uil uil-book-reader text-base text-cyan-500 sm:text-lg"></i>
                          <span>收获 {item.rating_gain ?? "-"}</span>
                        </div>
                        <div className="flex items-center gap-1 transition-colors sm:gap-1.5">
                          <i className="uil uil-chart-down text-base text-orange-500 sm:text-lg"></i>
                          <span>考试 {item.rating_exam_difficulty ?? "-"}</span>
                        </div>
                        {item.teacher_id ? (
                            <div className="flex items-center gap-1 transition-colors sm:gap-1.5">
                              <i className="uil uil-presentation-line text-base text-sky-500 sm:text-lg"></i>
                              <span>教学 {item.rating_quality ?? "-"}</span>
                            </div>
                        ) : null}
                        {item.teacher_id ? (
                            <div className="flex items-center gap-1 transition-colors sm:gap-1.5">
                              <i className="uil uil-file-check-alt text-base text-emerald-500 sm:text-lg"></i>
                              <span>给分 {item.rating_grading ?? "-"}</span>
                            </div>
                        ) : null}
                        {item.teacher_id ? (
                            <div className="flex items-center gap-1 transition-colors sm:gap-1.5">
                              <i className="uil uil-user-check text-base text-rose-500 sm:text-lg"></i>
                              <span>考勤 {item.rating_attendance ?? "-"}</span>
                            </div>
                        ) : null}
                        <div className="flex items-center gap-1 transition-colors sm:gap-1.5">
                          <i className="uil uil-thumbs-up text-base text-rose-500 sm:text-lg"></i>
                          <span>点赞 {formatNumber(item.likes)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-y-2 text-xs text-gray-500 sm:mt-4 sm:gap-3 sm:text-sm">
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
                            id: editingCourseEvaluation.teacher_id,
                            name: editingCourseEvaluation.teacher_name || `教师 #${editingCourseEvaluation.teacher_id}`,
                          },
                        ]
                        : []
                  }
                  submitLabel="保存修改"
                  initialValues={{
                    relatedId: editingCourseEvaluation.teacher_id ?? null,
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
      <GlassCard className="rounded-xl border-dashed p-6 text-center sm:rounded-2xl sm:p-12">
        <img
            src="/undraw_mcp-server_7kvc.svg"
            alt="空状态插画"
            className="mx-auto mb-3 h-20 w-auto opacity-90 sm:mb-4 sm:h-24"
        />
        <h3 className="mb-1.5 text-lg font-medium text-gray-800 sm:mb-2 sm:text-xl">{title}</h3>
        <p className="mx-auto max-w-md text-sm text-gray-500 sm:text-base">{description}</p>
      </GlassCard>
  );
}
