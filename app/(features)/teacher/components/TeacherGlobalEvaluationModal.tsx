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

export default function TeacherGlobalEvaluationModal({ isOpen, onClose }: TeacherGlobalEvaluationModalProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherSuggestionItem | null>(null);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<TeacherSuggestionItem[]>([]);
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

    return () => {
      isActive = false;
    };
  }, [debouncedQuery]);

  const handleSubmit = async (payload: Record<string, unknown>) => {
    if (!selectedTeacher) return;
    try {
      await createTeacherEvaluation(selectedTeacher.id, payload as unknown as TeacherEvaluationInput);
      feedback.success("评价提交成功！");
      handleClose();
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
      title={selectedTeacher ? `为 ${selectedTeacher.name} 写一条评价` : "写一条教师评价"}
      description={selectedTeacher ? "您的评价将帮助更多同学" : "搜索并选择你想评价的教师"}
    >
      {!selectedTeacher ? (
        <div className="relative mt-4 h-64">
          <AdvancedInput
            label={<>搜索教师 <span className="text-red-500">*</span></>}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入教师名称..."
          />
          {isSearching && <div className="text-sm text-slate-500 mt-2 px-2">搜索中...</div>}
          {!isSearching && options.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {options.map((teacher) => (
                <div
                  key={teacher.id}
                  onClick={() => {
                    setSelectedTeacher(teacher);
                    setOptions([]);
                    setQuery("");
                  }}
                  className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm transition-colors border-b border-slate-100 last:border-none"
                >
                  <div className="font-medium text-slate-700">{teacher.name}</div>
                  {teacher.department && <div className="text-xs text-slate-400 mt-0.5">{teacher.department}</div>}
                </div>
              ))}
            </div>
          )}
          {!isSearching && query.trim() && options.length === 0 && (
            <div className="text-sm text-slate-500 mt-2 px-2">未找到相关教师</div>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <div className="flex items-center justify-between bg-rose-50 px-4 py-3 rounded-xl border border-rose-100">
            <span className="font-medium text-rose-800">已选教师：{selectedTeacher.name}</span>
            <button
              type="button"
              className="text-sm text-rose-600 hover:text-rose-700"
              onClick={() => setSelectedTeacher(null)}
            >
              重新选择
            </button>
          </div>
          <EvaluationComposerForm
            evaluationType="teacher"
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </DetailComposerModal>
  );
}
