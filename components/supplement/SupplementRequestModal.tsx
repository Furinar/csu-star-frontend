"use client";

import { useRouter } from "next/navigation";
import { createSupplementRequest } from "@/api/supplement";
import {
  AdvancedInput,
  AdvancedSelect,
  AdvancedTextarea,
} from "@/app/(features)/resource/components/AdvancedFormControls";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import { DEPARTMENTS } from "@/data/departments";
import { requireAuthAction } from "@/lib/requireAuthAction";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";
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
  course_name: string;
  course_type: "" | "public" | "non_public";
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
  const currentType = form.request_type;

  useEffect(() => {
    if (!isOpen) {
      setForm(createInitialForm(initialRequestType));
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

      if (!teacherName || !form.department_id || !Number.isFinite(departmentId)) {
        feedback.warning({
          title: "教师补录信息不完整",
          description: "请填写老师姓名和学院。",
        });
        return null;
      }

      return {
        request_type: "teacher",
        contact,
        teacher_name: teacherName,
        department_id: departmentId,
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
                <option value="public">公选课</option>
                <option value="non_public">非公选课</option>
              </AdvancedSelect>
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
