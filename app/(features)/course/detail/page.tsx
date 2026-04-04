"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createCourseEvaluation,
  createCourseEvaluationReply,
  deleteCourseEvaluation,
  getCourseDetail,
  listCourseEvaluations,
  updateCourseEvaluation,
  updateCourseEvaluationReply,
  deleteCourseEvaluationReply,
} from "@/api/detail";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import DetailBookHero from "@/components/detail/DetailBookHero";
import DetailEvaluationSection from "@/components/detail/DetailEvaluationSection";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import { DetailPageShell } from "@/components/detail/DetailScaffold";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import PageBreadcrumbs from "@/components/ui/PageBreadcrumbs";
import { useHasMounted } from "@/hooks/useHasMounted";
import { feedback } from "@/store/useFeedbackStore";
import type { CourseDetail, CourseEvaluation, CourseEvaluationInput } from "@/types/detail";

export default function CourseDetailPage() {
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const idStr = hasMounted ? searchParams.get("id") : null;
  const courseId = idStr ? parseInt(idStr, 10) : null;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>([]);
  const [evaluationTotal, setEvaluationTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerVersion, setComposerVersion] = useState(0);

  useEffect(() => {
    if (!hasMounted) return;
    if (!courseId) return;

    let mounted = true;

    Promise.all([getCourseDetail(courseId), listCourseEvaluations(courseId, 1, 10)])
      .then(([detail, evaluationData]) => {
        if (!mounted) return;
        setCourse(detail);
        setEvaluations(evaluationData.items);
        setEvaluationTotal(evaluationData.total);
      })
      .catch((error) => {
        console.error("Failed to load course details:", error);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [courseId, hasMounted]);

  const relatedTeachers = useMemo(
    () =>
      (course?.teachers || []).map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
      })),
    [course],
  );

  if (!hasMounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          <span className="text-sm text-slate-500">正在加载课程信息...</span>
        </div>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-500">
        请提供有效的课程 ID
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          <span className="text-sm text-slate-500">正在加载课程信息...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-500">
        课程不存在或已被删除
      </div>
    );
  }

  return (
    <>
      <DetailPageShell>
        <PageBreadcrumbs
          backHref="/course"
          backLabel="返回课程页"
          items={[
            { label: "课程", href: "/course" },
            { label: course.name },
          ]}
        />

        <DetailBookHero variant="course" data={course} />

        <div id="evaluations">
          <DetailEvaluationSection
            title="课程评价"
            description="看看大家对这门课的真实反馈。"
            evaluationType="course"
            relatedItems={relatedTeachers}
            initialItems={evaluations}
            initialTotal={evaluationTotal}
            initialPage={1}
            listEvaluations={(page, size, sort) => listCourseEvaluations(courseId, page, size, sort)}
            onReply={createCourseEvaluationReply}
            onUpdateEvaluation={(evaluationId, payload) =>
              updateCourseEvaluation(evaluationId, payload as CourseEvaluationInput)
            }
            onDeleteEvaluation={deleteCourseEvaluation}
            onUpdateReply={updateCourseEvaluationReply}
            onDeleteReply={deleteCourseEvaluationReply}
          />
        </div>
      </DetailPageShell>

      <DetailFloatingActionButton onClick={() => setIsComposerOpen(true)} label="写评价" tone="course" />

      <DetailComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        accent="course"
        badge="课程评价"
        title={`为 ${course.name} 写一条评价`}
        description="写下你对这门课的体验和看法。"
      >
        <EvaluationComposerForm
          key={`course-detail-form-${composerVersion}-${course.id}`}
          evaluationType="course"
          relatedItems={relatedTeachers}
          onSubmit={async (payload) => {
            try {
              const result = await createCourseEvaluation(course.id, payload as unknown as CourseEvaluationInput);
              if (!result) return;
              setEvaluations((prev) => [result, ...prev]);
              setEvaluationTotal((prev) => prev + 1);
              setComposerVersion((prev) => prev + 1);
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
