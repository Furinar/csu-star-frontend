"use client";

import { useEffect, useMemo, useState } from "react";
import { submitCorrection, submitFeedback } from "@/api/me";
import { searchCourseSuggestions, searchTeacherSuggestions } from "@/api/resource";
import {
  AdvancedInput,
  AdvancedSelect,
  AdvancedTextarea,
} from "@/components/ui/AdvancedFormControls";
import { DEPARTMENTS } from "@/data/departments";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";
import type {
  CorrectionInput,
  CorrectionTargetType,
  FeedbackInput,
} from "@/types/me";
import type { CourseSuggestionItem, TeacherSuggestionItem } from "@/types/resource";
import {
  PANEL_PRIMARY_BUTTON_CLASS_NAME,
  PANEL_SECONDARY_BUTTON_CLASS_NAME,
  getErrorMessage,
} from "../shared/helpers";

const CORRECTION_TARGET_OPTIONS: Array<{
  value: CorrectionInput["target_type"];
  label: string;
}> = [
  { value: "course", label: "课程" },
  { value: "teacher", label: "教师" },
];

type CorrectionFieldOption = {
  value: string;
  label: string;
  placeholder: string;
  inputType?: "input" | "textarea" | "select";
  selectOptions?: Array<{ value: string; label: string }>;
};

const COURSE_CORRECTION_FIELDS: CorrectionFieldOption[] = [
  {
    value: "name",
    label: "课程名称",
    placeholder: "请输入正确的课程名称",
  },
  {
    value: "description",
    label: "课程简介",
    placeholder: "请输入更准确的课程简介",
    inputType: "textarea",
  },
  {
    value: "course_type",
    label: "课程类型",
    placeholder: "请选择正确的课程类型",
    inputType: "select",
    selectOptions: [
      { value: "公选课", label: "公选课" },
      { value: "非公选课", label: "非公选课" },
    ],
  },
];

const TEACHER_CORRECTION_FIELDS: CorrectionFieldOption[] = [
  {
    value: "name",
    label: "教师姓名",
    placeholder: "请输入正确的教师姓名",
  },
  {
    value: "title",
    label: "教师职称",
    placeholder: "请输入正确的教师职称",
  },
  {
    value: "avatar_url",
    label: "头像链接",
    placeholder: "请输入正确的头像链接",
  },
  {
    value: "department_id",
    label: "所属学院",
    placeholder: "请选择正确的所属学院",
    inputType: "select",
    selectOptions: DEPARTMENTS.map((department) => ({
      value: String(department.id),
      label: department.name,
    })),
  },
  {
    value: "bio",
    label: "教师简介",
    placeholder: "请输入更准确的教师简介",
    inputType: "textarea",
  },
  {
    value: "tutor_type",
    label: "导师类型",
    placeholder: "请输入正确的导师类型",
  },
  {
    value: "homepage_url",
    label: "个人主页",
    placeholder: "请输入正确的个人主页链接",
  },
];

const CORRECTION_FIELD_OPTIONS: Record<CorrectionTargetType, CorrectionFieldOption[]> = {
  course: COURSE_CORRECTION_FIELDS,
  teacher: TEACHER_CORRECTION_FIELDS,
};

export default function FeedbackPanel({
  mode,
  onClose,
}: {
  mode: "feedback" | "correction";
  onClose: () => void;
}) {
  if (mode === "feedback") {
    return <FeedbackForm onClose={onClose} />;
  }

  return <CorrectionForm onClose={onClose} />;
}

function FeedbackForm({ onClose }: { onClose: () => void }) {
  const accessToken = useAuthStore((state) => state.access_token);
  const [form, setForm] = useState<FeedbackInput>({
    type: "suggestion",
    title: "",
    content: "",
    screenshots: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!accessToken) {
      feedback.warning({
        title: "请先登录",
        description: "登录后才能提交意见反馈。",
      });
      onClose();
      return;
    }

    if (!form.title.trim() || !form.content.trim()) {
      feedback.warning({
        title: "内容不完整",
        description: "请至少填写标题和反馈内容。",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
      });
      onClose();
      feedback.success({
        title: "反馈已提交",
        description: "反馈已提交，可在通知中心查看处理结果。",
      });
    } catch (error) {
      feedback.error({
        title: "提交失败",
        description: getErrorMessage(error, "请稍后重试"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdvancedSelect
        label="反馈类型"
        value={form.type}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            type: event.target.value as FeedbackInput["type"],
          }))
        }
      >
        <option value="suggestion">建议</option>
        <option value="bug">问题反馈</option>
        <option value="complaint">投诉</option>
        <option value="other">其他</option>
      </AdvancedSelect>

      <AdvancedInput
        label="标题"
        value={form.title}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            title: event.target.value,
          }))
        }
      />

      <AdvancedTextarea
        label="内容"
        rows={6}
        value={form.content}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            content: event.target.value,
          }))
        }
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className={PANEL_SECONDARY_BUTTON_CLASS_NAME}
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={PANEL_PRIMARY_BUTTON_CLASS_NAME}
        >
          {isSubmitting ? "提交中..." : "提交反馈"}
        </button>
      </div>
    </div>
  );
}

function CorrectionForm({ onClose }: { onClose: () => void }) {
  const accessToken = useAuthStore((state) => state.access_token);
  const [correctionForm, setCorrectionForm] = useState<CorrectionInput>({
    target_type: "course",
    target_id: "",
    field: "",
    suggested_value: "",
  });
  const [targetQuery, setTargetQuery] = useState("");
  const [courseOptions, setCourseOptions] = useState<CourseSuggestionItem[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherSuggestionItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseSuggestionItem | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherSuggestionItem | null>(null);
  const [isSearchingTarget, setIsSearchingTarget] = useState(false);
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const debouncedTargetQuery = useDebounce(targetQuery, 300);

  const fieldOptions = CORRECTION_FIELD_OPTIONS[correctionForm.target_type];
  const selectedFieldOption = useMemo(
    () =>
      fieldOptions.find((item) => item.value === correctionForm.field) ?? null,
    [correctionForm.field, fieldOptions],
  );
  const selectedTarget = correctionForm.target_type === "course"
    ? selectedCourse
    : selectedTeacher;

  useEffect(() => {
    setCorrectionForm((current) => ({
      ...current,
      target_id: "",
      field: "",
      suggested_value: "",
    }));
    setTargetQuery("");
    setCourseOptions([]);
    setTeacherOptions([]);
    setSelectedCourse(null);
    setSelectedTeacher(null);
    setIsSearchingTarget(false);
  }, [correctionForm.target_type]);

  useEffect(() => {
    if (!debouncedTargetQuery.trim()) {
      setCourseOptions([]);
      setTeacherOptions([]);
      setIsSearchingTarget(false);
      return;
    }

    let isActive = true;
    setIsSearchingTarget(true);

    const searchPromise =
      correctionForm.target_type === "course"
        ? searchCourseSuggestions(debouncedTargetQuery)
        : searchTeacherSuggestions(debouncedTargetQuery);

    searchPromise
      .then((items) => {
        if (!isActive) return;

        if (correctionForm.target_type === "course") {
          setCourseOptions(items as CourseSuggestionItem[]);
        } else {
          setTeacherOptions(items as TeacherSuggestionItem[]);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!isActive) return;
        setCourseOptions([]);
        setTeacherOptions([]);
      })
      .finally(() => {
        if (isActive) {
          setIsSearchingTarget(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [correctionForm.target_type, debouncedTargetQuery]);

  const handleSubmitCorrection = async () => {
    if (!accessToken) {
      feedback.warning({
        title: "请先登录",
        description: "登录后才能提交信息纠错。",
      });
      onClose();
      return;
    }

    if (!selectedTarget || !correctionForm.target_id) {
      feedback.warning({
        title: "请先选择纠错对象",
        description:
          correctionForm.target_type === "course"
            ? "请先搜索并选择需要纠错的课程。"
            : "请先搜索并选择需要纠错的老师。",
      });
      return;
    }

    if (!correctionForm.field.trim() || !correctionForm.suggested_value.trim()) {
      feedback.warning({
        title: "纠错信息不完整",
        description: "请选择需要纠正的信息，并填写建议内容。",
      });
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      await submitCorrection({
        target_type: correctionForm.target_type,
        target_id: correctionForm.target_id,
        field: correctionForm.field.trim(),
        suggested_value: correctionForm.suggested_value.trim(),
      });
      onClose();
      feedback.success({
        title: "纠错已提交",
        description: "纠错已提交，可在通知中心查看处理结果。",
      });
    } catch (error) {
      feedback.error({
        title: "提交失败",
        description: getErrorMessage(error, "请稍后重试"),
      });
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdvancedSelect
        label="目标类型"
        value={correctionForm.target_type}
        onChange={(event) =>
          setCorrectionForm((current) => ({
            ...current,
            target_type: event.target.value as CorrectionInput["target_type"],
          }))
        }
      >
        {CORRECTION_TARGET_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </AdvancedSelect>

      {selectedTarget ? (
        <div className="td-me-list-item">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs text-slate-500">
                已选择
                {correctionForm.target_type === "course" ? "课程" : "老师"}
              </div>
              <div className="mt-0.5 font-medium text-slate-800">
                {selectedTarget.name}
              </div>
              {"course_type" in selectedTarget && selectedTarget.course_type ? (
                <div className="mt-0.5 text-xs text-slate-500">
                  {selectedTarget.course_type}
                </div>
              ) : null}
              {"department" in selectedTarget && selectedTarget.department ? (
                <div className="mt-0.5 text-xs text-slate-500">
                  {selectedTarget.department}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setCorrectionForm((current) => ({
                  ...current,
                  target_id: "",
                  field: "",
                  suggested_value: "",
                }));
                setTargetQuery("");
                setCourseOptions([]);
                setTeacherOptions([]);
                setSelectedCourse(null);
                setSelectedTeacher(null);
              }}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              重新选择
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <AdvancedInput
            label={
              <>
                {correctionForm.target_type === "course"
                  ? "选择课程"
                  : "选择老师"}{" "}
                <span className="text-red-500">*</span>
              </>
            }
            value={targetQuery}
            maxLength={50}
            onChange={(event) => setTargetQuery(event.target.value)}
            placeholder={
              correctionForm.target_type === "course"
                ? "输入课程名称进行搜索"
                : "输入老师姓名进行搜索"
            }
          />

          {isSearchingTarget ? (
            <div className="text-sm text-slate-400">搜索中...</div>
          ) : null}

          {!isSearchingTarget &&
          (correctionForm.target_type === "course"
            ? courseOptions.length > 0
            : teacherOptions.length > 0) ? (
            <div className="overflow-hidden rounded-md border border-slate-200">
              {(correctionForm.target_type === "course"
                ? courseOptions
                : teacherOptions
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (correctionForm.target_type === "course") {
                      setSelectedCourse(item as CourseSuggestionItem);
                    } else {
                      setSelectedTeacher(item as TeacherSuggestionItem);
                    }

                    setCorrectionForm((current) => ({
                      ...current,
                      target_id: item.id,
                      field: "",
                      suggested_value: "",
                    }));
                    setTargetQuery("");
                    setCourseOptions([]);
                    setTeacherOptions([]);
                  }}
                  className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-none hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800">{item.name}</div>
                    {"course_type" in item && item.course_type ? (
                      <div className="mt-0.5 text-xs text-slate-400">
                        {item.course_type}
                      </div>
                    ) : null}
                    {"department" in item && item.department ? (
                      <div className="mt-0.5 text-xs text-slate-400">
                        {item.department}
                      </div>
                    ) : null}
                  </div>
                  <span className="mt-0.5 text-xs font-medium text-first">
                    选择
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {!isSearchingTarget &&
          targetQuery.trim() &&
          (correctionForm.target_type === "course"
            ? courseOptions.length === 0
            : teacherOptions.length === 0) ? (
            <div className="text-sm text-slate-400">
              {correctionForm.target_type === "course"
                ? "未找到相关课程"
                : "未找到相关老师"}
            </div>
          ) : null}
        </div>
      )}

      <AdvancedSelect
        label="需要纠正的信息"
        value={correctionForm.field}
        onChange={(event) =>
          setCorrectionForm((current) => ({
            ...current,
            field: event.target.value,
            suggested_value: "",
          }))
        }
      >
        <option value="">请选择需要纠正的信息</option>
        {fieldOptions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </AdvancedSelect>

      {selectedFieldOption?.inputType === "select" ? (
        <AdvancedSelect
          label="建议修改为"
          value={correctionForm.suggested_value}
          onChange={(event) =>
            setCorrectionForm((current) => ({
              ...current,
              suggested_value: event.target.value,
            }))
          }
        >
          <option value="">{selectedFieldOption.placeholder}</option>
          {selectedFieldOption.selectOptions?.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </AdvancedSelect>
      ) : selectedFieldOption?.inputType === "textarea" ? (
        <AdvancedTextarea
          label="建议修改为"
          rows={5}
          placeholder={selectedFieldOption.placeholder}
          value={correctionForm.suggested_value}
          onChange={(event) =>
            setCorrectionForm((current) => ({
              ...current,
              suggested_value: event.target.value,
            }))
          }
        />
      ) : (
        <AdvancedInput
          label="建议修改为"
          placeholder={selectedFieldOption?.placeholder ?? "请输入建议内容"}
          value={correctionForm.suggested_value}
          onChange={(event) =>
            setCorrectionForm((current) => ({
              ...current,
              suggested_value: event.target.value,
            }))
          }
        />
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmittingCorrection}
          className={PANEL_SECONDARY_BUTTON_CLASS_NAME}
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmitCorrection}
          disabled={isSubmittingCorrection}
          className={PANEL_PRIMARY_BUTTON_CLASS_NAME}
        >
          {isSubmittingCorrection ? "提交中..." : "提交纠错"}
        </button>
      </div>
    </div>
  );
}
