"use client";

import Link from "next/link";
import { useState } from "react";
import {
  deleteCourseEvaluation,
  updateCourseEvaluation,
} from "@/api/detail";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import ItemActionMenu from "@/components/ui/ItemActionMenu";
import StarRating from "@/components/ui/StarRating";
import { buildCoursePath } from "@/lib/paths";
import { feedback } from "@/store/useFeedbackStore";
import type { CourseEvaluationInput } from "@/types/detail";
import type { CourseEvaluation, PaginatedData } from "@/types/me";
import { formatDateTime } from "./shared/helpers";
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

function formatAvg(value: number | undefined | null) {
  if (value == null || !Number.isFinite(Number(value))) return "--";
  return Number(value).toFixed(1);
}

/**
 * Xiaohongshu-style note card in a CSS columns waterfall.
 * Comment is the cover content; height varies → natural masonry flow.
 */
function EvaluationWaterfallCard({
  item,
  onEdit,
  onDelete,
}: {
  item: CourseEvaluation;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const courseName = item.course_name || `课程 #${item.course_id}`;
  const teacherName = item.teacher_name?.trim() || null;
  const avg = Number(item.avg_rating);
  const avgText = formatAvg(item.avg_rating);
  const comment = item.comment?.trim() ?? "";
  const hasComment = Boolean(comment);

  return (
    <article className="mb-2.5 break-inside-avoid sm:mb-3">
      <Link
        href={buildCoursePath(item.course_id)}
        className="block rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300 hover:bg-slate-50/60 active:bg-slate-50"
      >
        <div className="p-3 sm:p-3.5">
          {/* Note body — primary, variable height drives waterfall */}
          {hasComment ? (
            <p className="line-clamp-8 whitespace-pre-wrap text-[13px] leading-6 text-slate-800 sm:text-sm sm:leading-7">
              {comment}
            </p>
          ) : (
            <p className="text-[13px] leading-6 text-slate-400 sm:text-sm">
              暂无文字评价
            </p>
          )}

          {/* Same band under comment, course name on the right (not in footer) */}
          <h4
            className="mt-2.5 truncate text-right text-[13px] font-semibold text-slate-900 sm:mt-3 sm:text-sm"
            title={courseName}
          >
            {courseName}
          </h4>

          {/* Footer: score + meta left, actions right */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="inline-flex shrink-0 items-center gap-1">
                <StarRating
                  score={Number.isFinite(avg) ? avg : 0}
                  size="10px"
                  fillClassName="text-amber-400"
                />
                <span className="text-xs font-semibold tabular-nums text-amber-600">
                  {avgText}
                </span>
              </span>
              <span className="truncate text-[11px] text-slate-400">
                {formatDateTime(item.created_at)}
                {teacherName ? ` · ${teacherName}` : ""}
                {item.is_anonymous ? " · 匿名" : ""}
              </span>
            </div>

            <div
              className="relative z-10 shrink-0"
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
                    onClick: onEdit,
                  },
                  {
                    key: "delete",
                    label: "删除评价",
                    destructive: true,
                    onClick: onDelete,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function MeEvaluations({
  courseEvaluations,
}: MeEvaluationsProps) {
  const [courseItems, setCourseItems] = useState(
    courseEvaluations.items ?? [],
  );
  const [editingCourseEvaluation, setEditingCourseEvaluation] =
    useState<CourseEvaluation | null>(null);

  return (
    <>
      {courseItems.length === 0 ? (
        <SectionEmptyState
          title="暂无评价记录"
          description="你发布的课程评价会汇总在这里。"
        />
      ) : (
        // CSS multi-column masonry (XHS / Pinterest style)
        <div className="columns-2 gap-2.5 sm:gap-3 lg:columns-3">
          {courseItems.map((item) => (
            <EvaluationWaterfallCard
              key={`course-${item.id}`}
              item={item}
              onEdit={() => setEditingCourseEvaluation(item)}
              onDelete={async () => {
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
              }}
            />
          ))}
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
    </>
  );
}
