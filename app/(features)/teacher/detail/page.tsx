"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {
  getTeacherDetail,
} from "@/api/detail";
import DetailBookHero from "@/components/detail/DetailBookHero";
import RelationLinkModal from "@/components/detail/RelationLinkModal";
import {DetailPageShell} from "@/components/detail/DetailScaffold";
import {useHasMounted} from "@/hooks/useHasMounted";
import {requireAuthAction} from "@/lib/requireAuthAction";
import {useAuthStore} from "@/store/useAuthStore";
import {feedback} from "@/store/useFeedbackStore";
import type {TeacherDetail} from "@/types/detail";

export default function TeacherDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const accessToken = useAuthStore((state) => state.access_token);
  const teacherId = hasMounted ? searchParams.get("id") : null;

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
  const [isReloadingTeacher, setIsReloadingTeacher] = useState(false);

  useEffect(() => {
    if (!hasMounted) return;
    if (!teacherId) return;

    let mounted = true;

    getTeacherDetail(teacherId)
        .then((detail) => {
          if (!mounted) return;
          setTeacher(detail);
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
      feedback.error({title: "教师信息刷新失败", description: "请稍后重试。"});
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

  if (!hasMounted) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-rose-400"/>
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-rose-400"/>
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
              className="mb-0 md:mb-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--page-accent-text)] transition hover:opacity-80 cursor-pointer"
          >
            <i className="uil uil-arrow-left text-base"/>
            返回上一页
          </button>

          <DetailBookHero
              variant="teacher"
              data={teacher}
              showRating={false}
              onAddRelation={handleOpenRelationModal}
              isAddingRelation={isReloadingTeacher}
          />
        </DetailPageShell>

        <RelationLinkModal
            variant="teacher"
            isOpen={isRelationModalOpen}
            onClose={() => setIsRelationModalOpen(false)}
            teacher={{id: teacher.id, name: teacher.name}}
            currentCourses={relatedCourses}
            onLinked={reloadTeacherDetail}
        />
      </>
  );
}
