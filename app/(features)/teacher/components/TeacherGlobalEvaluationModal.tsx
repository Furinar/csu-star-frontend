"use client";

import { useEffect, useState } from "react";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import EvaluationComposerForm from "@/components/detail/EvaluationComposerForm";
import { useDebounce } from "@/hooks/useDebounce";
import { searchTeacherSuggestions } from "@/api/resource";
import type { TeacherSuggestionItem } from "@/types/resource";
import { createTeacherEvaluation } from "@/api/detail";
import type { TeacherEvaluationInput } from "@/types/detail";
import { feedback } from "@/store/useFeedbackStore";
import { AdvancedInput } from "@/app/(features)/resource/components/AdvancedFormControls";

interface TeacherGlobalEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TeacherGlobalEvaluationModal({
  isOpen,
  onClose,
}: TeacherGlobalEvaluationModalProps) {
  const [formVersion, setFormVersion] = useState(0);
  const [selectedTeacher, setSelectedTeacher] =
    useState<TeacherSuggestionItem | null>(null);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<TeacherSuggestionItem[]>([]);
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
      searchTeacherSuggestions(debouncedQuery)
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
    if (!selectedTeacher) return;
    try {
      await createTeacherEvaluation(
        selectedTeacher.id,
        payload as unknown as TeacherEvaluationInput,
      );
      feedback.success("评价提交成功！");
      setFormVersion((prev) => prev + 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "提交失败";
      feedback.error(msg);
    }
  };

  const handleClose = () => {
    setSelectedTeacher(null);
    setQuery("");
    setOptions([]);
    onClose();
  };

  return (
    <DetailComposerModal
      isOpen={isOpen}
      onClose={handleClose}
      accent="teacher"
      badge="教师评价"
      title={
        selectedTeacher
          ? `为 ${selectedTeacher.name} 写一条评价`
          : "写一条教师评价"
      }
      description={
        selectedTeacher ? "你的评价会直接展示在教师详情页，帮助同学快速判断授课体验和风格。" : "先搜索并选择想评价的教师，再填写统一的评价表单。"
      }
    >
      {!selectedTeacher ? (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[26px] border border-rose-100 bg-white p-5">
            <div className="text-sm font-medium text-rose-700">选择教师</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              搜索并选择教师后，再进入统一的授课体验评价表单。
            </p>
            <div className="relative mt-4">
              <AdvancedInput
                label={
                  <>
                    搜索教师 <span className="text-red-500">*</span>
                  </>
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入教师名称"
              />
              {isSearching ? (
                <div className="mt-3 text-sm text-slate-500">搜索中...</div>
              ) : null}
              {!isSearching && options.length > 0 ? (
                <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                  {options.map((teacher) => (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setOptions([]);
                        setQuery("");
                      }}
                      className="flex w-full items-start justify-between border-b border-slate-100 px-4 py-3 text-left transition last:border-none hover:bg-slate-50"
                    >
                      <div>
                        <div className="font-medium text-slate-800">{teacher.name}</div>
                        {teacher.department ? (
                          <div className="mt-1 text-xs text-slate-400">{teacher.department}</div>
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
                未找到相关教师
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-5">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 rounded-[24px] border border-rose-100 bg-white px-5 py-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-rose-500">Selected</div>
              <div className="mt-1 font-medium text-rose-900">{selectedTeacher.name}</div>
            </div>
            <button
              type="button"
              className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300"
              onClick={() => setSelectedTeacher(null)}
            >
              重新选择
            </button>
          </div>
          <EvaluationComposerForm
            key={`teacher-global-form-${formVersion}-${selectedTeacher.id}`}
            evaluationType="teacher"
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </DetailComposerModal>
  );
}
