"use client";

import { useState } from "react";
import { submitCorrection, submitFeedback } from "@/api/me";
import {
  AdvancedInput,
  AdvancedSelect,
  AdvancedTextarea,
} from "@/app/(features)/resource/components/AdvancedFormControls";
import { feedback } from "@/store/useFeedbackStore";
import type { CorrectionInput, FeedbackInput } from "@/types/me";
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
  const [form, setForm] = useState<FeedbackInput>({
    type: "suggestion",
    title: "",
    content: "",
    screenshots: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
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
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
          当前反馈系统只会提交真正被后端接收的字段：类型、标题和内容。截图上传与独立联系方式暂未开放。
        </div>

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
          rows={8}
          value={form.content}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              content: event.target.value,
            }))
          }
        />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
    </>
  );
}

function CorrectionForm({ onClose }: { onClose: () => void }) {
  const [correctionForm, setCorrectionForm] = useState<CorrectionInput>({
    target_type: "course",
    target_id: "",
    field: "",
    suggested_value: "",
  });
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const handleSubmitCorrection = async () => {
    const targetId = correctionForm.target_id.trim();
    if (!/^\d+$/.test(targetId) || targetId === "0") {
      feedback.warning({
        title: "目标 ID 无效",
        description: "纠错需要有效的数字 ID。",
      });
      return;
    }

    if (!correctionForm.field.trim() || !correctionForm.suggested_value.trim()) {
      feedback.warning({
        title: "纠错信息不完整",
        description: "字段名和建议值都不能为空。",
      });
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      await submitCorrection({
        target_type: correctionForm.target_type,
        target_id: targetId,
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
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
          纠错当前仅支持课程和教师两个目标，提交时请尽量提供准确的目标 ID、字段名和建议值。
        </div>

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

        <AdvancedInput
          label="目标 ID"
          inputMode="numeric"
          value={correctionForm.target_id}
          onChange={(event) =>
            setCorrectionForm((current) => ({
              ...current,
              target_id: event.target.value,
            }))
          }
        />

        <AdvancedInput
          label="字段名"
          placeholder="例如：name / title / department_name"
          value={correctionForm.field}
          onChange={(event) =>
            setCorrectionForm((current) => ({
              ...current,
              field: event.target.value,
            }))
          }
        />

        <AdvancedTextarea
          label="建议值"
          rows={6}
          value={correctionForm.suggested_value}
          onChange={(event) =>
            setCorrectionForm((current) => ({
              ...current,
              suggested_value: event.target.value,
            }))
          }
        />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
    </>
  );
}
