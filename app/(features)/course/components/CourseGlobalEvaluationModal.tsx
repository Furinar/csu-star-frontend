"use client";

import { useEffect, useState } from "react";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import { useDebounce } from "@/hooks/useDebounce";
import { searchCourseSuggestions } from "@/api/resource";
import type { CourseSuggestionItem } from "@/types/resource";
import { createCourseEvaluation } from "@/api/detail";
import type { CourseEvaluationInput } from "@/types/detail";
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
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[26px] border border-sky-100 bg-white p-5">
            <div className="text-sm font-medium text-sky-700">课程检索</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              输入课程名称并从结果中选择一门课程。
            </p>
            <div className="relative mt-4">
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
                <div className="mt-3 text-sm text-slate-500">搜索中...</div>
              ) : null}
              {!isSearching && options.length > 0 ? (
                <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                  {options.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => {
                        setSelectedCourse(course);
                        setOptions([]);
                        setQuery("");
                      }}
                      className="flex w-full items-start justify-between border-b border-slate-100 px-4 py-3 text-left transition last:border-none hover:bg-slate-50"
                    >
                      <div>
                        <div className="font-medium text-slate-800">{course.name}</div>
                        {course.course_type ? (
                          <div className="mt-1 text-xs text-slate-400">{course.course_type}</div>
                        ) : null}
                      </div>
                      <span className="text-xs text-slate-400">选择</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {!isSearching && query.trim() && options.length === 0 ? (
              <div className="mt-3 text-sm text-slate-500">
                未找到相关课程
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-5">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 rounded-[24px] border border-sky-100 bg-white px-5 py-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-sky-500">Selected</div>
              <div className="mt-1 font-medium text-sky-900">{selectedCourse.name}</div>
            </div>
            <button
              type="button"
              className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 transition hover:border-sky-300"
              onClick={() => setSelectedCourse(null)}
            >
              重新选择
            </button>
          </div>
          <EvaluationComposerForm
            key={`course-global-form-${formVersion}-${selectedCourse.id}`}
            evaluationType="course"
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </DetailComposerModal>
  );
}
