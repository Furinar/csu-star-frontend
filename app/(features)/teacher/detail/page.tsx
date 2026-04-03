"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createTeacherEvaluation,
  createTeacherEvaluationReply,
  getTeacherDetail,
  listTeacherEvaluations,
} from "@/api/detail";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import DetailBookHero from "@/components/detail/DetailBookHero";
import DetailEvaluationSection from "@/components/detail/DetailEvaluationSection";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import { DetailPageShell } from "@/components/detail/DetailScaffold";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import { useHasMounted } from "@/hooks/useHasMounted";
import { feedback } from "@/store/useFeedbackStore";
import type { TeacherDetail, TeacherEvaluation, TeacherEvaluationInput } from "@/types/detail";

export default function TeacherDetailPage() {
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const idStr = hasMounted ? searchParams.get("id") : null;
  const teacherId = idStr ? parseInt(idStr, 10) : null;

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
  const [evaluationTotal, setEvaluationTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  useEffect(() => {
    if (!hasMounted) return;
    if (!teacherId) return;

    let mounted = true;

    Promise.all([getTeacherDetail(teacherId), listTeacherEvaluations(teacherId, 1, 10)])
      .then(([detail, evaluationData]) => {
        if (!mounted) return;
        setTeacher(detail);
        setEvaluations(evaluationData.items);
        setEvaluationTotal(evaluationData.total);
      })
      .catch((error) => {
        console.error("Failed to load teacher details:", error);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [hasMounted, teacherId]);

  const relatedCourses = useMemo(
    () =>
      (teacher?.courses || []).map((course) => ({
        id: course.id,
        name: course.name,
      })),
    [teacher],
  );

  if (!hasMounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-rose-400" />
          <span className="text-sm text-slate-500">正在加载教师信息...</span>
        </div>
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-500">
        请提供有效的教师 ID
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-rose-400" />
          <span className="text-sm text-slate-500">正在加载教师信息...</span>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-500">
        教师不存在或已被删除
      </div>
    );
  }

  return (
    <>
      <DetailPageShell>
        <DetailBookHero variant="teacher" data={teacher} />

        <div id="evaluations">
          <DetailEvaluationSection
            title="教师评价"
            description="看看大家对这位老师的真实反馈。"
            evaluationType="teacher"
            initialItems={evaluations}
            initialTotal={evaluationTotal}
            initialPage={1}
            listEvaluations={(page, size) => listTeacherEvaluations(teacherId, page, size)}
            onReply={createTeacherEvaluationReply}
            
          />
        </div>
      </DetailPageShell>

      <DetailFloatingActionButton onClick={() => setIsComposerOpen(true)} label="写评价" tone="teacher" />

      <DetailComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        accent="teacher"
        badge="教师评价"
        title={`为 ${teacher.name} 写一条评价`}
        description="写下你对这位老师的体验和看法。"
      >
        <EvaluationComposerForm
          evaluationType="teacher"
          relatedItems={relatedCourses}
          onSubmit={async (payload) => {
            try {
              const result = await createTeacherEvaluation(teacher.id, payload as unknown as TeacherEvaluationInput);
              if (!result) return;
              setEvaluations((prev) => [result, ...prev]);
              setEvaluationTotal((prev) => prev + 1);
              setIsComposerOpen(false);
              feedback.success({ title: "评价已发布" });
            } catch (error) {
              console.error(error);
              feedback.error({ title: "发布失败", description: "请稍后重试。" });
              throw error;
            }
          }}
        />
      </DetailComposerModal>
    </>
  );
}
