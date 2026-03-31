"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createTeacherEvaluation,
  getTeacherDetail,
} from "@/api/detail";
import ComposePageShell from "@/components/detail/ComposePageShell";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import { buildTeacherPath } from "@/lib/paths";
import { feedback } from "@/store/useFeedbackStore";
import type { TeacherDetail, TeacherEvaluationInput } from "@/types/detail";

export default function TeacherEvaluationComposerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = Number(searchParams.get("id"));
  const isInvalidTeacherId = !Number.isFinite(teacherId) || teacherId <= 0;

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isInvalidTeacherId) {
      return;
    }

    let active = true;

    getTeacherDetail(teacherId)
      .then((detail) => {
        if (!active) {
          return;
        }
        setTeacher(detail);
      })
      .catch((error) => {
        console.error(error);
        feedback.error({ title: "教师信息加载失败", description: "请稍后重试。" });
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isInvalidTeacherId, teacherId]);

  const relatedCourses = useMemo(
    () =>
      (teacher?.courses || []).map((course) => ({
        id: course.id,
        name: course.name,
      })),
    [teacher],
  );

  if (isInvalidTeacherId) {
    return <div className="p-8 text-center text-slate-500">请提供有效的教师 ID</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">正在加载教师信息...</div>;
  }

  if (!teacher) {
    return <div className="p-8 text-center text-slate-500">教师不存在或已被删除</div>;
  }

  return (
    <ComposePageShell
      accent="teacher"
      badge="教师评价"
      title={`为 ${teacher.name} 写一条评价`}
      description="把它当成一条带评分的熟人圈动态来写。重点说清楚课堂体验、点名情况、给分感受和适合什么样的同学。"
      backHref={buildTeacherPath(teacher.id)}
      backLabel="返回教师详情"
      meta={
        <>
          {teacher.title ? (
            <div className="rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm">
              职称 {teacher.title}
            </div>
          ) : null}
          <div className="rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm">
            授课课程 {teacher.courses?.length || 0} 门
          </div>
        </>
      }
    >
      <EvaluationComposerForm
        evaluationType="teacher"
        relatedItems={relatedCourses}
        onSubmit={async (payload) => {
          try {
            await createTeacherEvaluation(teacher.id, payload as unknown as TeacherEvaluationInput);
            feedback.success({ title: "评价已发布" });
            router.push(`${buildTeacherPath(teacher.id)}#evaluations`);
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
