"use client";

import { useRouter } from "next/navigation";
import { searchCourseSuggestions, searchTeacherSuggestions } from "@/api/resource";
import { createSupplementRequest } from "@/api/supplement";
import {
  AdvancedInput,
  AdvancedSelect,
  AdvancedTextarea,
} from "@/app/(features)/resource/components/AdvancedFormControls";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import { DEPARTMENTS } from "@/data/departments";
import { useDebounce } from "@/hooks/useDebounce";
import { requireAuthAction } from "@/lib/requireAuthAction";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";
import type { CourseSuggestionItem, TeacherSuggestionItem } from "@/types/resource";
import type {
  CreateSupplementRequestInput,
  SupplementRequestType,
} from "@/types/supplement";
import { useEffect, useState } from "react";

type FormState = {
  request_type: SupplementRequestType;
  contact: string;
  teacher_name: string;
  department_id: string;
  related_course_name: string;
  course_name: string;
  course_type: "" | "公选课" | "非公选课";
  remark: string;
};

function createInitialForm(
  initialRequestType: SupplementRequestType,
): FormState {
  return {
    request_type: initialRequestType,
    contact: "",
    teacher_name: "",
    department_id: "",
    related_course_name: "",
    course_name: "",
    course_type: "",
    remark: "",
  };
}

export default function SupplementRequestModal({
  isOpen,
  onClose,
  initialRequestType,
  allowTypeSwitch = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialRequestType: SupplementRequestType;
  allowTypeSwitch?: boolean;
}) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const [form, setForm] = useState<FormState>(
    createInitialForm(initialRequestType),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relatedCourseOptions, setRelatedCourseOptions] = useState<CourseSuggestionItem[]>([]);
  const [selectedRelatedCourse, setSelectedRelatedCourse] = useState<CourseSuggestionItem | null>(null);
  const [isSearchingRelatedCourse, setIsSearchingRelatedCourse] = useState(false);
  const [relatedTeacherQuery, setRelatedTeacherQuery] = useState("");
  const [relatedTeacherOptions, setRelatedTeacherOptions] = useState<TeacherSuggestionItem[]>([]);
  const [selectedRelatedTeachers, setSelectedRelatedTeachers] = useState<TeacherSuggestionItem[]>([]);
  const [isSearchingRelatedTeachers, setIsSearchingRelatedTeachers] = useState(false);
  const debouncedRelatedCourseQuery = useDebounce(form.related_course_name, 300);
  const debouncedRelatedTeacherQuery = useDebounce(relatedTeacherQuery, 300);
  const currentType = form.request_type;

  useEffect(() => {
    if (!isOpen) {
      setForm(createInitialForm(initialRequestType));
      setRelatedCourseOptions([]);
      setSelectedRelatedCourse(null);
      setIsSearchingRelatedCourse(false);
      setRelatedTeacherQuery("");
      setRelatedTeacherOptions([]);
      setSelectedRelatedTeachers([]);
      setIsSearchingRelatedTeachers(false);
      setIsSubmitting(false);
      return;
    }

    setForm((current) =>
      current.request_type === initialRequestType && current.contact === ""
        ? current
        : {
            ...current,
            request_type: initialRequestType,
          },
    );
  }, [initialRequestType, isOpen]);

  useEffect(() => {
    if (form.request_type !== "teacher" || selectedRelatedCourse) {
      setRelatedCourseOptions([]);
      setIsSearchingRelatedCourse(false);
      return;
    }

    if (!debouncedRelatedCourseQuery.trim()) {
      setRelatedCourseOptions([]);
      setIsSearchingRelatedCourse(false);
      return;
    }

    let isActive = true;
    setIsSearchingRelatedCourse(true);

    searchCourseSuggestions(debouncedRelatedCourseQuery)
      .then((items) => {
        if (!isActive) return;
        setRelatedCourseOptions(items);
      })
      .catch((error) => {
        console.error(error);
        if (!isActive) return;
        setRelatedCourseOptions([]);
      })
      .finally(() => {
        if (!isActive) return;
        setIsSearchingRelatedCourse(false);
      });

    return () => {
      isActive = false;
    };
  }, [form.request_type, debouncedRelatedCourseQuery, selectedRelatedCourse]);

  useEffect(() => {
    if (form.request_type !== "course") {
      setRelatedTeacherOptions([]);
      setIsSearchingRelatedTeachers(false);
      return;
    }

    if (!debouncedRelatedTeacherQuery.trim()) {
      setRelatedTeacherOptions([]);
      setIsSearchingRelatedTeachers(false);
      return;
    }

    let isActive = true;
    setIsSearchingRelatedTeachers(true);

    searchTeacherSuggestions(debouncedRelatedTeacherQuery)
      .then((items) => {
        if (!isActive) return;
        const selectedIds = new Set(selectedRelatedTeachers.map((teacher) => teacher.id));
        setRelatedTeacherOptions(items.filter((teacher) => !selectedIds.has(teacher.id)));
      })
      .catch((error) => {
        console.error(error);
        if (!isActive) return;
        setRelatedTeacherOptions([]);
      })
      .finally(() => {
        if (!isActive) return;
        setIsSearchingRelatedTeachers(false);
      });

    return () => {
      isActive = false;
    };
  }, [form.request_type, debouncedRelatedTeacherQuery, selectedRelatedTeachers]);

  const accent = currentType === "teacher" ? "teacher" : "course";
  const modalTitle =
    currentType === "teacher" ? "提交老师补录申请" : "提交课程补录申请";
  const modalDescription =
    currentType === "teacher"
      ? "提交后我们会尽快审核，通过后会添加这位老师。"
      : "提交后我们会尽快审核，通过后会添加这门课程。";

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const buildPayload = (): CreateSupplementRequestInput | null => {
    const contact = form.contact.trim();
    if (!contact) {
      feedback.warning({
        title: "请填写联系方式",
        description: "至少填写一个便于审核联系你的方式。",
      });
      return null;
    }

    if (currentType === "teacher") {
      const teacherName = form.teacher_name.trim();
      const departmentId = Number(form.department_id);

      if (
        !teacherName ||
        !form.department_id ||
        !Number.isFinite(departmentId) ||
        !selectedRelatedCourse
      ) {
        feedback.warning({
          title: "教师补录信息不完整",
          description: "请填写老师姓名、学院，并从列表中选择一门相关课程。",
        });
        return null;
      }

      return {
        request_type: "teacher",
        contact,
        teacher_name: teacherName,
        department_id: departmentId,
        related_course_name: selectedRelatedCourse.name.trim(),
        remark: form.remark.trim() || null,
      };
    }

    const courseName = form.course_name.trim();
    if (!courseName || !form.course_type) {
      feedback.warning({
        title: "课程补录信息不完整",
        description: "请填写课程名称和课程类型。",
      });
      return null;
    }

    return {
      request_type: "course",
      contact,
      course_name: courseName,
      course_type: form.course_type,
      related_teacher_names: selectedRelatedTeachers.map((teacher) =>
        teacher.name.trim(),
      ),
      remark: form.remark.trim() || null,
    };
  };

  const handleSubmit = async () => {
    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description:
          currentType === "teacher"
            ? "登录后才能提交老师补录申请。"
            : "登录后才能提交课程补录申请。",
      })
    ) {
      onClose();
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      await createSupplementRequest(payload);
      onClose();
      setForm(createInitialForm(initialRequestType));
      feedback.success({
        title: "补录申请已提交",
        description: "补录申请已提交，可在通知中心查看处理结果。",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "提交失败，请稍后重试。";
      feedback.error({
        title: "提交失败",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailComposerModal
      isOpen={isOpen}
      onClose={() => {
        if (isSubmitting) return;
        onClose();
      }}
      accent={accent}
      badge="补录申请"
      title={modalTitle}
      description={modalDescription}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-1 sm:gap-6 sm:px-2">
        <div className="space-y-3">
          <div className={`text-2xl font-bold ${currentType === "teacher" ? "text-rose-800" : "text-sky-800"}`}>
            没有你想找的{currentType === "teacher" ? "老师" : "课程"}？
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-600 sm:px-5">
            提交后我们会尽快审核，通过后会添加到平台中。你也可以在通知中心查看处理结果。
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {allowTypeSwitch ? (
            <AdvancedSelect
              label="补录类型"
              value={form.request_type}
              onChange={(event) =>
                updateForm(
                  "request_type",
                  event.target.value as SupplementRequestType,
                )
              }
            >
              <option value="teacher">老师</option>
              <option value="course">课程</option>
            </AdvancedSelect>
          ) : null}

          <AdvancedInput
            label={
              <>
                联系方式 <span className="text-red-500">*</span>
              </>
            }
            value={form.contact}
            onChange={(event) => updateForm("contact", event.target.value)}
            placeholder="QQ / 微信 / 邮箱 / 手机号"
          />

          {currentType === "teacher" ? (
            <>
              <AdvancedInput
                label={
                  <>
                    老师姓名 <span className="text-red-500">*</span>
                  </>
                }
                value={form.teacher_name}
                onChange={(event) =>
                  updateForm("teacher_name", event.target.value)
                }
                placeholder="例如：张三"
              />

              <AdvancedSelect
                label={
                  <>
                    所属学院 <span className="text-red-500">*</span>
                  </>
                }
                value={form.department_id}
                onChange={(event) =>
                  updateForm("department_id", event.target.value)
                }
              >
                <option value="">请选择学院</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </AdvancedSelect>

              <div className="md:col-span-2">
                <div className="relative">
                  {selectedRelatedCourse ? (
                    <>
                      <label className="mb-1 block text-sm font-medium text-black">
                        相关课程 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                        <div className="min-w-0 flex-1">
                          <div className="break-words">{selectedRelatedCourse.name}</div>
                          {selectedRelatedCourse.course_type ? (
                            <div className="mt-1 text-xs text-rose-500/80">
                              {selectedRelatedCourse.course_type}
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRelatedCourse(null);
                            setRelatedCourseOptions([]);
                            updateForm("related_course_name", "");
                          }}
                          className="shrink-0 text-sm text-rose-500 transition hover:text-rose-700"
                        >
                          重新选择
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <AdvancedInput
                        label={
                          <>
                            相关课程 <span className="text-red-500">*</span>
                          </>
                        }
                        value={form.related_course_name}
                        maxLength={50}
                        onChange={(event) =>
                          updateForm("related_course_name", event.target.value)
                        }
                        placeholder="搜索并选择一门已存在课程"
                      />
                      {isSearchingRelatedCourse ? (
                        <div className="mt-2 text-sm text-slate-400">搜索中...</div>
                      ) : null}
                      {!isSearchingRelatedCourse && relatedCourseOptions.length > 0 ? (
                        <div className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                          {relatedCourseOptions.map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => {
                                setSelectedRelatedCourse(course);
                                setRelatedCourseOptions([]);
                                updateForm("related_course_name", course.name);
                              }}
                              className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-none hover:bg-slate-50 sm:px-5"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-slate-800">
                                  {course.name}
                                </div>
                                {course.course_type ? (
                                  <div className="mt-1 text-xs text-slate-400">
                                    {course.course_type}
                                  </div>
                                ) : null}
                              </div>
                              <span className="mt-0.5 text-xs font-medium text-rose-500/80">
                                选择
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {!isSearchingRelatedCourse &&
                      form.related_course_name.trim() &&
                      relatedCourseOptions.length === 0 ? (
                        <div className="mt-2 text-sm text-slate-400">未找到相关课程</div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <AdvancedInput
                label={
                  <>
                    课程名称 <span className="text-red-500">*</span>
                  </>
                }
                value={form.course_name}
                onChange={(event) =>
                  updateForm("course_name", event.target.value)
                }
                placeholder="例如：编译原理"
              />

              <AdvancedSelect
                label={
                  <>
                    课程类型 <span className="text-red-500">*</span>
                  </>
                }
                value={form.course_type}
                onChange={(event) =>
                  updateForm(
                    "course_type",
                    event.target.value as FormState["course_type"],
                  )
                }
              >
                <option value="">请选择课程类型</option>
                <option value="公选课">公选课</option>
                <option value="非公选课">非公选课</option>
              </AdvancedSelect>

              <div className="relative md:col-span-2">
                <AdvancedInput
                  label="关联教师（可选，可多选）"
                  value={relatedTeacherQuery}
                  maxLength={50}
                  onChange={(event) => setRelatedTeacherQuery(event.target.value)}
                  placeholder="搜索并选择已有教师"
                />
                {isSearchingRelatedTeachers ? (
                  <div className="mt-2 text-sm text-slate-400">搜索中...</div>
                ) : null}
                {!isSearchingRelatedTeachers && relatedTeacherOptions.length > 0 ? (
                  <div className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                    {relatedTeacherOptions.map((teacher) => (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() => {
                          setSelectedRelatedTeachers((current) => [...current, teacher]);
                          setRelatedTeacherOptions([]);
                          setRelatedTeacherQuery("");
                        }}
                        className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-none hover:bg-slate-50 sm:px-5"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800">
                            {teacher.name}
                          </div>
                          {teacher.department ? (
                            <div className="mt-1 text-xs text-slate-400">
                              {teacher.department}
                            </div>
                          ) : null}
                        </div>
                        <span className="mt-0.5 text-xs font-medium text-sky-500/80">
                          添加
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {!isSearchingRelatedTeachers &&
                relatedTeacherQuery.trim() &&
                relatedTeacherOptions.length === 0 ? (
                  <div className="mt-2 text-sm text-slate-400">未找到相关教师</div>
                ) : null}
              </div>

              {selectedRelatedTeachers.length > 0 ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-black">
                    已选关联教师
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRelatedTeachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() =>
                          setSelectedRelatedTeachers((current) =>
                            current.filter((item) => item.id !== teacher.id),
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm text-sky-900 transition hover:border-sky-300 hover:bg-sky-100"
                      >
                        <span>{teacher.name}</span>
                        <span className="text-sky-500">移除</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}

          <div className="md:col-span-2">
            <AdvancedTextarea
              label="补充说明"
              rows={6}
              value={form.remark}
              onChange={(event) => updateForm("remark", event.target.value)}
              placeholder="可补充你知道的信息，方便我们更快核实。"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={`w-full rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto ${
              currentType === "teacher"
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-sky-500 hover:bg-sky-600"
            }`}
          >
            {isSubmitting
              ? "提交中..."
              : currentType === "teacher"
                ? "提交老师补录申请"
                : "提交课程补录申请"}
          </button>
        </div>
      </div>
    </DetailComposerModal>
  );
}
