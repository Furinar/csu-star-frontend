"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteCourseEvaluation,
  updateCourseEvaluation,
} from "@/api/detail";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import EntityTypeBadge from "@/components/ui/EntityTypeBadge";
import ItemActionMenu from "@/components/ui/ItemActionMenu";
import { buildCoursePath, buildTeacherPath } from "@/lib/paths";
import { feedback } from "@/store/useFeedbackStore";
import type { CourseEvaluationInput } from "@/types/detail";
import type { CourseEvaluation, PaginatedData } from "@/types/me";
import { formatDateTime, formatNumber } from "./shared/helpers";
import {
  ME_LIST_STACK,
  ME_META,
  ME_METRIC_ROW,
  ME_ROW_INTERACTIVE,
  ME_TITLE,
} from "./shared/styles";
import { SectionEmptyState } from "./SectionStates";

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
  const [courseItems, setCourseItems] = useState(
    courseEvaluations.items ?? [],
  );
  const [editingCourseEvaluation, setEditingCourseEvaluation] =
    useState<CourseEvaluation | null>(null);

  const filteredCourseEvaluations = courseItems;

  return (
    <div className={ME_LIST_STACK}>
      {filteredCourseEvaluations.length === 0 ? (
        <SectionEmptyState
          title="暂无评价记录"
          description="你发布的课程评价会汇总在这里。"
        />
      ) : (
        filteredCourseEvaluations.map((item) => {
          const linkedTeacherName =
            item.teacher_name ||
            (item.teacher_id ? `教师 #${item.teacher_id}` : null);
          const courseName =
            item.course_name || `课程 #${item.course_id}`;
          const cardContent = (
            <div className={ME_ROW_INTERACTIVE}>
              <div className="mb-2 flex flex-col gap-2 sm:mb-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex w-full items-start justify-between gap-3">
                    <h4 className={ME_TITLE}>{courseName}</h4>
                    <EntityTypeBadge
                      type="course"
                      label="课程评价"
                      className="shrink-0 scale-90 origin-top-right sm:scale-100"
                    />
                  </div>
                  <p className={`mt-1.5 ${ME_META}`}>
                    发布于 {formatDateTime(item.created_at)}
                  </p>
                  {linkedTeacherName ? (
                    <div className={`mt-1 ${ME_META}`}>
                      关联教师：
                      <span
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (item.teacher_id) {
                            router.push(buildTeacherPath(item.teacher_id));
                          }
                        }}
                        className="ml-1 cursor-pointer font-medium text-slate-800 hover:text-first hover:underline"
                      >
                        {linkedTeacherName}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              {item.comment ? (
                <div className="mb-2.5 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700 sm:mb-3 sm:px-3.5 sm:py-2.5 sm:text-sm sm:leading-6">
                  {item.comment}
                </div>
              ) : null}
              <div className={ME_METRIC_ROW}>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <i className="uil uil-star text-base text-amber-500 sm:text-lg" />
                  <span>综合 {item.avg_rating}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <i className="uil uil-edit text-base text-violet-500 sm:text-lg" />
                  <span>作业 {item.rating_homework ?? "-"}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <i className="uil uil-book-reader text-base text-cyan-500 sm:text-lg" />
                  <span>收获 {item.rating_gain ?? "-"}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <i className="uil uil-chart-down text-base text-orange-500 sm:text-lg" />
                  <span>考试 {item.rating_exam_difficulty ?? "-"}</span>
                </div>
                {item.teacher_id ? (
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="uil uil-presentation-line text-base text-sky-500 sm:text-lg" />
                    <span>教学 {item.rating_quality ?? "-"}</span>
                  </div>
                ) : null}
                {item.teacher_id ? (
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="uil uil-file-check-alt text-base text-emerald-500 sm:text-lg" />
                    <span>给分 {item.rating_grading ?? "-"}</span>
                  </div>
                ) : null}
                {item.teacher_id ? (
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="uil uil-user-check text-base text-rose-500 sm:text-lg" />
                    <span>考勤 {item.rating_attendance ?? "-"}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <i className="uil uil-thumbs-up text-base text-rose-500 sm:text-lg" />
                  <span>点赞 {formatNumber(item.likes)}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-y-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500 sm:mt-3.5 sm:gap-3 sm:pt-3 sm:text-sm">
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
                            setCourseItems((prev) =>
                              prev.filter((entry) => entry.id !== item.id),
                            );
                            feedback.success({ title: "评价已删除" });
                          } catch (error) {
                            console.error(error);
                            feedback.error({
                              title: "删除失败",
                              description: "请稍后重试。",
                            });
                          }
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
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
        })
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
                      name:
                        editingCourseEvaluation.teacher_name ||
                        `教师 #${editingCourseEvaluation.teacher_id}`,
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
                rating_exam_difficulty:
                  editingCourseEvaluation.rating_exam_difficulty,
                rating_quality: editingCourseEvaluation.rating_quality,
                rating_grading: editingCourseEvaluation.rating_grading,
                rating_attendance:
                  editingCourseEvaluation.rating_attendance,
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
                feedback.error({
                  title: "更新失败",
                  description: "请稍后重试。",
                });
                throw error;
              }
            }}
          />
        ) : null}
      </DetailComposerModal>
    </div>
  );
}
