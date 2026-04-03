"use client";

import { useState } from "react";
import { submitCorrection, submitFeedback, submitReport } from "@/api/me";
import {
  AdvancedInput,
  AdvancedSelect,
  AdvancedTextarea,
} from "@/app/(features)/resource/components/AdvancedFormControls";
import { feedback } from "@/store/useFeedbackStore";
import type {
  CorrectionInput,
  FeedbackInput,
  ReportReason,
  ReportTargetType,
} from "@/types/me";
import {
  PANEL_PRIMARY_BUTTON_CLASS_NAME,
  PANEL_SECONDARY_BUTTON_CLASS_NAME,
  getErrorMessage,
} from "../shared/helpers";

const REPORT_TARGET_OPTIONS: Array<{
  value: ReportTargetType;
  label: string;
}> = [
  { value: "resource", label: "资源" },
  { value: "teacher_evaluation", label: "教师评价" },
  { value: "course_evaluation", label: "课程评价" },
  { value: "teacher_evaluation_reply", label: "教师评价回复" },
  { value: "course_evaluation_reply", label: "课程评价回复" },
  { value: "comment", label: "资源评论" },
];

const REPORT_REASON_OPTIONS: Array<{ value: ReportReason; label: string }> = [
  { value: "copyright", label: "侵权" },
  { value: "spam", label: "垃圾内容" },
  { value: "inappropriate", label: "不当内容" },
  { value: "other", label: "其他" },
];

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
  mode: "feedback" | "report";
  onClose: () => void;
}) {
  if (mode === "feedback") {
    return <FeedbackForm onClose={onClose} />;
  }

  return <ReportForm onClose={onClose} />;
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
        description: "感谢你的建议，我们会尽快处理。",
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

function ReportForm({ onClose }: { onClose: () => void }) {
  const [reportMode, setReportMode] = useState<"report" | "correction">(
    "report",
  );
  const [reportForm, setReportForm] = useState({
    target_type: "resource" as ReportTargetType,
    target_id: "",
    reason: "other" as ReportReason,
    description: "",
  });
  const [correctionForm, setCorrectionForm] = useState<CorrectionInput>({
    target_type: "course",
    target_id: "",
    field: "",
    suggested_value: "",
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const handleSubmitReport = async () => {
    const targetId = reportForm.target_id.trim();
    if (!/^\d+$/.test(targetId) || targetId === "0") {
      feedback.warning({
        title: "目标 ID 无效",
        description: "举报需要明确且有效的数字 ID。",
      });
      return;
    }

    if (reportForm.description.trim().length > 500) {
      feedback.warning({
        title: "补充说明过长",
        description: "补充说明请控制在 500 字以内。",
      });
      return;
    }

    setIsSubmittingReport(true);
    try {
      await submitReport({
        target_type: reportForm.target_type,
        target_id: targetId,
        reason: reportForm.reason,
        description: reportForm.description.trim() || null,
      });
      onClose();
      feedback.success({
        title: "举报已提交",
        description: "我们会结合内容与上下文尽快核查。",
      });
    } catch (error) {
      feedback.error({
        title: "提交失败",
        description: getErrorMessage(error, "请稍后重试"),
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

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
        description: "感谢协助完善平台内容。",
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
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: "report" as const, label: "举报" },
          { key: "correction" as const, label: "纠错" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setReportMode(item.key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              reportMode === item.key
                ? "border-first bg-first text-white shadow-md"
                : "border-gray-200/80 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {reportMode === "report" ? (
        <>
          <div className="space-y-4">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
              举报目标类型已按后端真实约束收敛，避免再出现前端可选但提交必失败的假选项。
            </div>

            <AdvancedSelect
              label="目标类型"
              value={reportForm.target_type}
              onChange={(event) =>
                setReportForm((current) => ({
                  ...current,
                  target_type: event.target.value as ReportTargetType,
                }))
              }
            >
              {REPORT_TARGET_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </AdvancedSelect>

            <AdvancedSelect
              label="原因"
              value={reportForm.reason}
              onChange={(event) =>
                setReportForm((current) => ({
                  ...current,
                  reason: event.target.value as ReportReason,
                }))
              }
            >
              {REPORT_REASON_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </AdvancedSelect>

            <AdvancedInput
              label="目标 ID"
              inputMode="numeric"
              value={reportForm.target_id}
              onChange={(event) =>
                setReportForm((current) => ({
                  ...current,
                  target_id: event.target.value,
                }))
              }
            />

            <AdvancedTextarea
              label="补充说明"
              rows={6}
              value={reportForm.description}
              onChange={(event) =>
                setReportForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingReport}
              className={PANEL_SECONDARY_BUTTON_CLASS_NAME}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmitReport}
              disabled={isSubmittingReport}
              className={PANEL_PRIMARY_BUTTON_CLASS_NAME}
            >
              {isSubmittingReport ? "提交中..." : "提交举报"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
              纠错当前仅支持课程和教师两个目标，且必须提交字段名与建议值，和后端约束完全一致。
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
      )}
    </>
  );
}
