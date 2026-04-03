"use client";

import { useState } from "react";
import { submitCorrection, submitFeedback, submitReport } from "@/api/me";
import { feedback } from "@/store/useFeedbackStore";
import type {
  CorrectionInput,
  FeedbackInput,
  ReportReason,
  ReportTargetType,
} from "@/types/me";
import {
  FORM_INPUT_CLASS_NAME,
  FORM_TEXTAREA_CLASS_NAME,
  getErrorMessage,
} from "../shared/helpers";

export default function FeedbackPanel({
  initialContact,
  mode,
  onClose,
}: {
  initialContact: string;
  mode: "feedback" | "report";
  onClose: () => void;
}) {
  if (mode === "feedback") {
    return <FeedbackForm initialContact={initialContact} onClose={onClose} />;
  }

  return <ReportForm onClose={onClose} />;
}

function FeedbackForm({
  initialContact,
  onClose,
}: {
  initialContact: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FeedbackInput>({
    type: "suggestion",
    title: "",
    content: "",
    contact: initialContact,
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
        contact: form.contact?.trim() || null,
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
        <label className="block space-y-2 text-sm text-gray-600">
          <span>反馈类型</span>
          <select
            className={FORM_INPUT_CLASS_NAME}
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
          </select>
        </label>
        <label className="block space-y-2 text-sm text-gray-600">
          <span>标题</span>
          <input
            className={FORM_INPUT_CLASS_NAME}
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
        </label>
        <label className="block space-y-2 text-sm text-gray-600">
          <span>内容</span>
          <textarea
            className={FORM_TEXTAREA_CLASS_NAME}
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                content: event.target.value,
              }))
            }
          />
        </label>
        <label className="block space-y-2 text-sm text-gray-600">
          <span>联系方式</span>
          <input
            className={FORM_INPUT_CLASS_NAME}
            value={form.contact ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contact: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-xl border border-gray-200/70 bg-white/70 px-6 py-2.5 shadow-sm hover:bg-white text-sm font-medium text-gray-700"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-xl bg-first px-6 py-2.5 shadow-md text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
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
    target_type: "resource",
    target_id: "",
    field_name: "",
    original_value: "",
    correct_value: "",
    description: "",
  });
  const [correctionTargetIdInput, setCorrectionTargetIdInput] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const handleSubmitReport = async () => {
    if (!reportForm.target_id.trim()) {
      feedback.warning({
        title: "请填写目标 ID",
        description: "举报需要明确的对象编号。",
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
        target_id: reportForm.target_id.trim(),
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
    const targetId = correctionTargetIdInput.trim();

    if (!/^\d+$/.test(targetId) || targetId === "0") {
      feedback.warning({
        title: "目标 ID 无效",
        description: "纠错需要有效的字符串 ID。",
      });
      return;
    }

    if (
      !correctionForm.correct_value?.trim() &&
      !correctionForm.description?.trim()
    ) {
      feedback.warning({
        title: "纠错信息不完整",
        description: "请至少填写正确值或补充说明。",
      });
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      await submitCorrection({
        ...correctionForm,
        target_id: targetId,
        field_name: correctionForm.field_name?.trim() || null,
        original_value: correctionForm.original_value?.trim() || null,
        correct_value: correctionForm.correct_value?.trim() || null,
        description: correctionForm.description?.trim() || null,
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
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              reportMode === item.key
                ? "bg-first text-white"
                : "border border-gray-200/70 bg-white/50 text-gray-600 hover:bg-white/70"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {reportMode === "report" ? (
        <>
          <div className="space-y-4 md:grid-cols-2">
            <label className="block space-y-2 text-sm text-gray-600">
              <span>目标类型</span>
              <select
                className={FORM_INPUT_CLASS_NAME}
                value={reportForm.target_type}
                onChange={(event) =>
                  setReportForm((current) => ({
                    ...current,
                    target_type: event.target.value as ReportTargetType,
                  }))
                }
              >
                <option value="resource">资源</option>
                <option value="evaluation">评价</option>
                <option value="comment">评论</option>
                <option value="user">用户</option>
              </select>
            </label>
            <label className="block space-y-2 text-sm text-gray-600">
              <span>原因</span>
              <select
                className={FORM_INPUT_CLASS_NAME}
                value={reportForm.reason}
                onChange={(event) =>
                  setReportForm((current) => ({
                    ...current,
                    reason: event.target.value as ReportReason,
                  }))
                }
              >
                <option value="copyright">侵权</option>
                <option value="spam">垃圾内容</option>
                <option value="inappropriate">不当内容</option>
                <option value="other">其他</option>
              </select>
            </label>
            <label className="block space-y-2 text-sm text-gray-600 md:col-span-2">
              <span>目标 ID</span>
              <input
                className={FORM_INPUT_CLASS_NAME}
                value={reportForm.target_id}
                onChange={(event) =>
                  setReportForm((current) => ({
                    ...current,
                    target_id: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block space-y-2 text-sm text-gray-600 md:col-span-2">
              <span>补充说明</span>
              <textarea
                className={FORM_TEXTAREA_CLASS_NAME}
                value={reportForm.description}
                onChange={(event) =>
                  setReportForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingReport}
              className="rounded-xl border border-gray-200/70 bg-white/70 px-6 py-2.5 shadow-sm hover:bg-white text-sm font-medium text-gray-700"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmitReport}
              disabled={isSubmittingReport}
              className="rounded-xl bg-first px-6 py-2.5 shadow-md text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingReport ? "提交中..." : "提交举报"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4 md:grid-cols-2">
            <label className="block space-y-2 text-sm text-gray-600">
              <span>目标类型</span>
              <select
                className={FORM_INPUT_CLASS_NAME}
                value={correctionForm.target_type}
                onChange={(event) =>
                  setCorrectionForm((current) => ({
                    ...current,
                    target_type: event.target
                      .value as CorrectionInput["target_type"],
                  }))
                }
              >
                <option value="resource">资源</option>
                <option value="course">课程</option>
                <option value="teacher">教师</option>
              </select>
            </label>
            <label className="block space-y-2 text-sm text-gray-600">
              <span>目标 ID</span>
              <input
                type="number"
                min={1}
                className={FORM_INPUT_CLASS_NAME}
                value={correctionTargetIdInput}
                onChange={(event) =>
                  setCorrectionTargetIdInput(event.target.value)
                }
              />
            </label>
            <label className="block space-y-2 text-sm text-gray-600">
              <span>字段名</span>
              <input
                className={FORM_INPUT_CLASS_NAME}
                value={correctionForm.field_name ?? ""}
                onChange={(event) =>
                  setCorrectionForm((current) => ({
                    ...current,
                    field_name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block space-y-2 text-sm text-gray-600">
              <span>原始值</span>
              <input
                className={FORM_INPUT_CLASS_NAME}
                value={correctionForm.original_value ?? ""}
                onChange={(event) =>
                  setCorrectionForm((current) => ({
                    ...current,
                    original_value: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block space-y-2 text-sm text-gray-600">
              <span>正确值</span>
              <input
                className={FORM_INPUT_CLASS_NAME}
                value={correctionForm.correct_value ?? ""}
                onChange={(event) =>
                  setCorrectionForm((current) => ({
                    ...current,
                    correct_value: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block space-y-2 text-sm text-gray-600 md:col-span-2">
              <span>补充说明</span>
              <textarea
                className={FORM_TEXTAREA_CLASS_NAME}
                value={correctionForm.description ?? ""}
                onChange={(event) =>
                  setCorrectionForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingCorrection}
              className="rounded-xl border border-gray-200/70 bg-white/70 px-6 py-2.5 shadow-sm hover:bg-white text-sm font-medium text-gray-700"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmitCorrection}
              disabled={isSubmittingCorrection}
              className="rounded-xl bg-first px-6 py-2.5 shadow-md text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingCorrection ? "提交中..." : "提交纠错"}
            </button>
          </div>
        </>
      )}
    </>
  );
}
