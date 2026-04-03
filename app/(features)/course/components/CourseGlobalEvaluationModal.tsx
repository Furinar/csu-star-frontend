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
  const [selectedCourse, setSelectedCourse] =
    useState<CourseSuggestionItem | null>(null);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CourseSuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setOptions([]);
      setIsSearching(false);
      return;
    }

    let isActive = true;
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

    return () => {
      isActive = false;
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
      handleClose();
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
          : "写一条课程评价"
      }
      description={
        selectedCourse ? "您的评价将帮助更多同学" : "搜索并选择你想评价的课程"
      }
    >
      {!selectedCourse ? (
        <div className="relative mt-4 h-64">
          <AdvancedInput
            label={
              <>
                搜索课程 <span className="text-red-500">*</span>
              </>
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入课程名称..."
          />
          {isSearching && (
            <div className="text-sm text-slate-500 mt-2 px-2">搜索中...</div>
          )}
          {!isSearching && options.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {options.map((course) => (
                <div
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    setOptions([]);
                    setQuery("");
                  }}
                  className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm transition-colors border-b border-slate-100 last:border-none"
                >
                  <div className="font-medium text-slate-700">
                    {course.name}
                  </div>
                  {course.course_type && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      {course.course_type}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {!isSearching && query.trim() && options.length === 0 && (
            <div className="text-sm text-slate-500 mt-2 px-2">
              未找到相关课程
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <div className="flex items-center justify-between bg-sky-50 px-4 py-3 rounded-xl border border-sky-100">
            <span className="font-medium text-sky-800">
              已选课程：{selectedCourse.name}
            </span>
            <button
              type="button"
              className="text-sm text-sky-600 hover:text-sky-700"
              onClick={() => setSelectedCourse(null)}
            >
              重新选择
            </button>
          </div>
          <EvaluationComposerForm
            evaluationType="course"
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </DetailComposerModal>
  );
}
