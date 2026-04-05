"use client";

import { useEffect, useMemo, useState } from "react";
import { submitReport } from "@/api/me";
import { AdvancedSelect, AdvancedTextarea } from "@/app/(features)/resource/components/AdvancedFormControls";
import DetailComposerModal from "@/components/detail/DetailComposerModal";
import { feedback } from "@/store/useFeedbackStore";
import type { ReportReason, ReportTargetType } from "@/types/me";

const REPORT_REASON_OPTIONS: Array<{ value: ReportReason; label: string }> = [
  { value: "copyright", label: "侵权" },
  { value: "spam", label: "垃圾内容" },
  { value: "inappropriate", label: "不当内容" },
  { value: "other", label: "其他" },
];

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  target: {
    type: ReportTargetType;
    id: string;
    label: string;
  } | null;
  successDescription?: string;
}

export default function ReportDialog({
  open,
  onClose,
  target,
  successDescription = "感谢反馈，管理员会尽快处理。",
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("other");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("other");
    setDescription("");
  }, [open, target?.id, target?.type]);

  const helperText = useMemo(() => {
    if (!target) return "";
    return `请说明举报${target.label}的具体原因，提交后管理员可以直接看到你的分类和理由。`;
  }, [target]);

  const handleSubmit = async () => {
    if (!target) return;

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      feedback.warning({
        title: "请填写举报理由",
        description: "举报时需要提供具体说明，便于管理员核查。",
      });
      return;
    }

    if (trimmedDescription.length > 500) {
      feedback.warning({
        title: "举报理由过长",
        description: "请将举报理由控制在 500 字以内。",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport({
        target_type: target.type,
        target_id: target.id,
        reason,
        description: trimmedDescription,
      });
      onClose();
      feedback.success({
        title: "举报已提交",
        description: successDescription,
      });
    } catch (error) {
      console.error(error);
      feedback.error({
        title: "举报失败",
        description: "请稍后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailComposerModal
      isOpen={open && target !== null}
      onClose={onClose}
      accent="resource"
      badge="举报"
      title="提交举报"
      description="补充举报原因，方便管理员核查。"
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
          <div className="font-medium text-rose-700">举报对象：{target?.label ?? "—"}</div>
          <div className="mt-1 text-slate-600">{helperText}</div>
        </div>

        <AdvancedSelect
          label="举报分类"
          value={reason}
          onChange={(event) => setReason(event.target.value as ReportReason)}
        >
          {REPORT_REASON_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </AdvancedSelect>

        <AdvancedTextarea
          label="举报理由"
          rows={7}
          value={description}
          maxLength={500}
          onChange={(event) => setDescription(event.target.value)}
        />

        <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
          <span>请结合上下文说明问题，空泛内容会影响处理效率。</span>
          <span>{description.trim().length}/500</span>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="rounded-2xl bg-rose-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "提交中..." : "提交举报"}
          </button>
        </div>
      </div>
    </DetailComposerModal>
  );
}
