"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { AdvancedInput } from "@/app/(features)/resource/components/AdvancedFormControls";
import { createCourseTeacherRelation } from "@/api/detail";
import { searchCourseSuggestions, searchTeacherSuggestions } from "@/api/resource";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import { useDebounce } from "@/hooks/useDebounce";
import { feedback } from "@/store/useFeedbackStore";
import type { CourseSuggestionItem, TeacherSuggestionItem } from "@/types/resource";
import type { EntityId } from "@/types/entity";

type CourseRelationLinkModalProps = {
  variant: "course";
  isOpen: boolean;
  onClose: () => void;
  course: { id: EntityId; name: string };
  currentTeachers: Array<{ id: EntityId; name: string }>;
  onLinked?: () => Promise<void> | void;
};

type TeacherRelationLinkModalProps = {
  variant: "teacher";
  isOpen: boolean;
  onClose: () => void;
  teacher: { id: EntityId; name: string };
  currentCourses: Array<{ id: EntityId; name: string }>;
  onLinked?: () => Promise<void> | void;
};

type RelationLinkModalProps = CourseRelationLinkModalProps | TeacherRelationLinkModalProps;

type RelationOption = CourseSuggestionItem | TeacherSuggestionItem;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function extractErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return null;

  const payload = error.response?.data;
  if (!isRecord(payload)) return null;

  if (typeof payload.msg === "string" && payload.msg.trim()) {
    return payload.msg;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  return null;
}

export default function RelationLinkModal(props: RelationLinkModalProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<RelationOption[]>([]);
  const [selectedItem, setSelectedItem] = useState<RelationOption | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const isCourseVariant = props.variant === "course";
  const accent = isCourseVariant ? "course" : "teacher";
  const existingIds = useMemo(() => {
    const items = props.variant === "course" ? props.currentTeachers : props.currentCourses;
    return new Set(items.map((item) => item.id));
  }, [props]);

  useEffect(() => {
    if (!props.isOpen) {
      setQuery("");
      setOptions([]);
      setSelectedItem(null);
      setIsSearching(false);
      setIsSubmitting(false);
      return;
    }

    if (!debouncedQuery.trim()) {
      setOptions([]);
      setIsSearching(false);
      return;
    }

    let isActive = true;
    setIsSearching(true);

    const searchPromise = isCourseVariant
      ? searchTeacherSuggestions(debouncedQuery)
      : searchCourseSuggestions(debouncedQuery);

    searchPromise
      .then((items) => {
        if (!isActive) return;

        setOptions(items.filter((item) => !existingIds.has(item.id)));
      })
      .catch((error) => {
        console.error(error);
        if (!isActive) return;
        setOptions([]);
      })
      .finally(() => {
        if (isActive) {
          setIsSearching(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [debouncedQuery, existingIds, isCourseVariant, props.isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    props.onClose();
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    try {
      setIsSubmitting(true);

      if (isCourseVariant) {
        await createCourseTeacherRelation(props.course.id, selectedItem.id);
      } else {
        await createCourseTeacherRelation(selectedItem.id, props.teacher.id);
      }

      await props.onLinked?.();
      feedback.success({
        title: isCourseVariant ? "教师已添加" : "课程已添加",
      });
      props.onClose();
    } catch (error) {
      console.error(error);
      feedback.error({
        title: "添加失败",
        description: extractErrorMessage(error) ?? "请稍后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailComposerModal
      isOpen={props.isOpen}
      onClose={handleClose}
      accent={accent}
      badge={isCourseVariant ? "添加教师" : "添加课程"}
      title={isCourseVariant ? `为 ${props.course.name} 添加授课教师` : `为 ${props.teacher.name} 添加授课课程`}
      description="搜索并选择一个尚未关联的对象，确认后会立即建立关联。"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-2">
        <div>
          <div className={`text-xl font-bold ${isCourseVariant ? "text-sky-800" : "text-rose-800"}`}>
            {isCourseVariant ? "教师检索" : "课程检索"}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isCourseVariant ? "输入教师姓名并选择要关联的授课教师。" : "输入课程名称并选择要关联的授课课程。"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Selected
            </div>
            <div className="mt-1 font-semibold text-slate-800">
              {selectedItem?.name ?? `请选择一个${isCourseVariant ? "教师" : "课程"}`}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedItem || isSubmitting}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
              isCourseVariant ? "bg-sky-500 hover:bg-sky-600" : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {isSubmitting ? "添加中..." : isCourseVariant ? "添加教师" : "添加课程"}
          </button>
        </div>

        <div className="relative">
          <AdvancedInput
            label={
              <>
                {isCourseVariant ? "教师姓名" : "课程名称"} <span className="text-red-500">*</span>
              </>
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isCourseVariant ? "搜索教师姓名" : "搜索课程名称"}
          />

          {isSearching ? <div className="mt-4 text-sm text-slate-400">搜索中...</div> : null}

          {!isSearching && options.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
              {options.map((item) => {
                const isSelected = selectedItem?.id === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`flex w-full items-start justify-between border-b border-slate-100 px-5 py-4 text-left transition last:border-none ${
                      isSelected ? "bg-slate-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-800">{item.name}</div>
                      {"department" in item && item.department ? (
                        <div className="mt-1 text-xs text-slate-400">{item.department}</div>
                      ) : null}
                      {"course_type" in item && item.course_type ? (
                        <div className="mt-1 text-xs text-slate-400">{item.course_type}</div>
                      ) : null}
                    </div>
                    <span
                      className={`mt-0.5 text-xs font-medium ${
                        isSelected ? (isCourseVariant ? "text-sky-600" : "text-rose-500") : "text-slate-400"
                      }`}
                    >
                      {isSelected ? "已选择" : "选择"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {!isSearching && query.trim() && options.length === 0 ? (
            <div className="mt-4 text-sm text-slate-400">
              未找到可添加的{isCourseVariant ? "教师" : "课程"}，或搜索结果均已关联。
            </div>
          ) : null}
        </div>
      </div>
    </DetailComposerModal>
  );
}
