"use client";

import { useEffect, useState } from "react";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import { useDebounce } from "@/hooks/useDebounce";
import { searchCourseSuggestions } from "@/api/resource";
import type { CourseSuggestionItem } from "@/types/resource";
import { createCourseEvaluation, getCourseDetail } from "@/api/detail";
import type { CourseEvaluationInput } from "@/types/detail";
import type { EntityId } from "@/types/entity";
import { feedback } from "@/store/useFeedbackStore";
import { AdvancedInput } from "@/app/(features)/resource/components/AdvancedFormControls";

interface CourseGlobalEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseGlobalEvaluationModal({
  isOpen,
  onClose,
}: CourseGlobalEvaluationModalProps) {
  const [formVersion, setFormVersion] = useState(0);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseSuggestionItem | null>(null);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CourseSuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [relatedTeachers, setRelatedTeachers] = useState<
    Array<{ id: EntityId; name: string }>
  >([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      const timer = setTimeout(() => {
        setOptions([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isActive = true;
    const timer = setTimeout(() => {
      setIsSearching(true);
      searchCourseSuggestions(debouncedQuery)
        .then((res) => {
          if (isActive) {
            setOptions(res);
          }
        })
        .catch((error) => {
          console.error(error);
          if (isActive) {
            setOptions([]);
          }
        })
        .finally(() => {
          if (isActive) {
            setIsSearching(false);
          }
        });
    }, 0);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (!selectedCourse) return;

    let isActive = true;

    getCourseDetail(selectedCourse.id)
      .then((detail) => {
        if (!isActive) return;
        setRelatedTeachers(
          (detail.teachers || []).map((teacher) => ({
            id: teacher.id,
            name: teacher.name,
          })),
        );
      })
      .catch((error) => {
        console.error(error);
        if (!isActive) return;
        setRelatedTeachers([]);
      });

    return () => {
      isActive = false;
    };
  }, [selectedCourse]);

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (!selectedCourse) return;
    try {
      await createCourseEvaluation(
        selectedCourse.id,
        payload as unknown as CourseEvaluationInput,
      );
      feedback.success("评价提交成功！");
      setFormVersion((prev) => prev + 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "提交失败";
      feedback.error(msg);
    }
  };

  const handleClose = () => {
    setSelectedCourse(null);
    setRelatedTeachers([]);
    setQuery("");
    setOptions([]);
    onClose();
  };

  return (
    <DetailComposerModal
      isOpen={isOpen}
      onClose={handleClose}
      accent="course"
      badge="课程评价"
      title={
        selectedCourse
          ? `为 ${selectedCourse.name} 写一条评价`
          : "先选择课程"
      }
      description={
        selectedCourse
          ? "你的评价会直接展示在课程详情页，帮助后来的同学更快判断课程体验。"
          : "选定课程后即可填写评价表单。"
      }
    >
      {!selectedCourse ? (
        <div className="mx-auto max-w-2xl px-1 sm:px-2">
          <div className="text-xl font-bold text-sky-800">课程检索</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            输入课程名称并从结果中选择一门课程。
          </p>
          <div className="relative mt-6">
            <AdvancedInput
              label={
                <>
                  课程名称 <span className="text-red-500">*</span>
                </>
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索课程名称"
            />
            {isSearching ? (
              <div className="mt-4 text-sm text-slate-400">搜索中...</div>
            ) : null}
            {!isSearching && options.length > 0 ? (
              <div className="mt-4 rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                <div className="h-full">
                  {options.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => {
                        setSelectedCourse(course);
                        setOptions([]);
                        setQuery("");
                        setRelatedTeachers([]);
                      }}
                      className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-none hover:bg-slate-50 sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800">{course.name}</div>
                        {course.course_type ? (
                          <div className="mt-1 text-xs text-slate-400">{course.course_type}</div>
                        ) : null}
                      </div>
                      <span className="text-xs font-medium text-[var(--first-color)] opacity-80 mt-0.5">选择</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {!isSearching && query.trim() && options.length === 0 ? (
            <div className="mt-4 text-sm text-slate-400">
              未找到相关课程
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-500/80 mb-0.5">SELECTED COURSE</div>
              <div className="font-semibold text-slate-800">{selectedCourse.name}</div>
            </div>
            <button
              type="button"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto sm:py-1.5"
              onClick={() => {
                setSelectedCourse(null);
                setRelatedTeachers([]);
              }}
            >
              重新选择
            </button>
          </div>
          <EvaluationComposerForm
            key={`course-global-form-${formVersion}-${selectedCourse.id}`}
            evaluationType="course"
            relatedItems={relatedTeachers}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </DetailComposerModal>
  );
}
