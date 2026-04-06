"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createTeacherEvaluation,
  createTeacherEvaluationReply,
  deleteTeacherEvaluation,
  deleteTeacherEvaluationReply,
  getTeacherDetail,
  listTeacherEvaluations,
  updateTeacherEvaluation,
  updateTeacherEvaluationReply,
} from "@/api/detail";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import DetailBookHero from "@/components/detail/DetailBookHero";
import DetailEvaluationSection from "@/components/detail/DetailEvaluationSection";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import RelationLinkModal from "@/components/detail/RelationLinkModal";
import { DetailPageShell } from "@/components/detail/DetailScaffold";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import { useHasMounted } from "@/hooks/useHasMounted";
import { requireAuthAction } from "@/lib/requireAuthAction";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";
import type { TeacherDetail, TeacherEvaluation, TeacherEvaluationInput } from "@/types/detail";

export default function TeacherDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const accessToken = useAuthStore((state) => state.access_token);
  const teacherId = hasMounted ? searchParams.get("id") : null;
  const highlightEvaluationId = hasMounted
    ? searchParams.get("evaluation_id")
    : null;
  const highlightReplyId = hasMounted ? searchParams.get("reply_id") : null;

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
  const [evaluationTotal, setEvaluationTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [isReloadingTeacher, setIsReloadingTeacher] = useState(false);
  const [composerVersion, setComposerVersion] = useState(0);

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

  const reloadTeacherDetail = async () => {
    if (!teacherId) return;

    try {
      setIsReloadingTeacher(true);
      const detail = await getTeacherDetail(teacherId);
      setTeacher(detail);
    } catch (error) {
      console.error(error);
      feedback.error({ title: "教师信息刷新失败", description: "请稍后重试。" });
      throw error;
    } finally {
      setIsReloadingTeacher(false);
    }
  };

  const handleOpenRelationModal = () => {
    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能主动添加授课课程。",
      })
    ) {
      return;
    }

    setIsRelationModalOpen(true);
  };

  const handleOpenComposer = () => {
    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能发表教师评价。",
      })
    ) {
      return;
    }

    setIsComposerOpen(true);
  };

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
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--page-accent-text)] transition hover:opacity-80"
        >
          <i className="uil uil-arrow-left text-base" />
          返回上一页
        </button>

        <DetailBookHero
          variant="teacher"
          data={teacher}
          onAddRelation={handleOpenRelationModal}
          isAddingRelation={isReloadingTeacher}
        />

        <div id="evaluations">
          <DetailEvaluationSection
            title="教师评价"
            description="看看大家对这位老师的真实反馈。"
            evaluationType="teacher"
            relatedItems={relatedCourses}
            initialItems={evaluations}
            initialTotal={evaluationTotal}
            initialPage={1}
            initialHighlightEvaluationId={highlightEvaluationId}
            initialHighlightReplyId={highlightReplyId}
            listEvaluations={(page, size, sort) => listTeacherEvaluations(teacherId, page, size, sort)}
            onReply={createTeacherEvaluationReply}
            onUpdateEvaluation={(evaluationId, payload) =>
              updateTeacherEvaluation(evaluationId, payload as TeacherEvaluationInput)
            }
            onDeleteEvaluation={deleteTeacherEvaluation}
            onUpdateReply={updateTeacherEvaluationReply}
            onDeleteReply={deleteTeacherEvaluationReply}
          />
        </div>
      </DetailPageShell>

      <DetailFloatingActionButton onClick={handleOpenComposer} label="写评价" tone="teacher" />

      <DetailComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        accent="teacher"
        badge="教师评价"
        title={`为 ${teacher.name} 写一条评价`}
        description="写下你对这位老师的体验和看法。"
      >
        <EvaluationComposerForm
          key={`teacher-detail-form-${composerVersion}-${teacher.id}`}
          evaluationType="teacher"
          relatedItems={relatedCourses}
          onSubmit={async (payload) => {
            try {
              const result = await createTeacherEvaluation(teacher.id, payload as unknown as TeacherEvaluationInput);
              if (!result) return;
              setEvaluations((prev) => [result, ...prev]);
              setEvaluationTotal((prev) => prev + 1);
              setComposerVersion((prev) => prev + 1);
              feedback.success({
                title: "评价已发布",
                description: "发表评价获得 1 积分。",
              });
            } catch (error) {
              console.error(error);
              feedback.error({ title: "发布失败", description: "请稍后重试。" });
              throw error;
            }
          }}
        />
      </DetailComposerModal>

      <RelationLinkModal
        variant="teacher"
        isOpen={isRelationModalOpen}
        onClose={() => setIsRelationModalOpen(false)}
        teacher={{ id: teacher.id, name: teacher.name }}
        currentCourses={relatedCourses}
        onLinked={reloadTeacherDetail}
      />
    </>
  );
}
