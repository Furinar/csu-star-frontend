"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createCourseEvaluation,
  getCourseDetail,
} from "@/api/detail";
import ComposePageShell from "@/components/detail/ComposePageShell";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import { buildCourseEvaluationAnchor, buildCoursePath } from "@/lib/paths";
import { feedback } from "@/store/useFeedbackStore";
import type { CourseDetail, CourseEvaluationInput } from "@/types/detail";

export default function CourseEvaluationComposerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = Number(searchParams.get("id"));
  const isInvalidCourseId = !Number.isFinite(courseId) || courseId <= 0;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInvalidCourseId) {
      return;
    }

    let active = true;

    getCourseDetail(courseId)
      .then((detail) => {
        if (!active) {
          return;
        }
        setCourse(detail);
      })
      .catch((error) => {
        console.error(error);
        feedback.error({ title: "课程信息加载失败", description: "请稍后重试。" });
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [courseId, isInvalidCourseId]);

  const relatedTeachers = useMemo(
    () =>
      (course?.teachers || []).map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
      })),
    [course],
  );

  if (isInvalidCourseId) {
    return <div className="p-8 text-center text-slate-500">请提供有效的课程 ID</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">正在加载课程信息...</div>;
  }

  if (!course) {
    return <div className="p-8 text-center text-slate-500">课程不存在或已被删除</div>;
  }

  return (
    <ComposePageShell
      accent="course"
      badge="课程评价"
      title={`为 ${course.name} 写一条评价`}
      description="首条信息是你的总判断，后面的文字更像一条熟人圈动态。尽量直接、具体，避免重复罗列分数。"
      backHref={buildCoursePath(course.id)}
      backLabel="返回课程详情"
      meta={
        <>
          <div className="rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm">
            课程类型 {course.course_type || "未标注"}
          </div>
          <div className="rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm">
            授课教师 {course.teachers?.length || 0} 位
          </div>
        </>
      }
    >
      <EvaluationComposerForm
        evaluationType="course"
        relatedItems={relatedTeachers}
        onSubmit={async (payload) => {
          try {
            await createCourseEvaluation(course.id, payload as unknown as CourseEvaluationInput);
            feedback.success({ title: "评价已发布" });
            router.push(buildCourseEvaluationAnchor(course.id));
          } catch (error) {
            console.error(error);
            feedback.error({ title: "发布失败", description: "请稍后重试。" });
            throw error;
          }
        }}
      />
    </ComposePageShell>
  );
}
