"use client";

import { useEffect, useMemo, useState } from "react";
import ModernCheckbox from "@/components/ui/ModernCheckbox";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import { AdvancedTextarea } from "@/app/(features)/resource/components/AdvancedFormControls";

interface RelatedItem {
  id: number;
  name: string;
}

interface Dimension {
  key: string;
  label: string;
}

const TEACHER_DIMENSIONS: Dimension[] = [
  { key: "rating_quality", label: "教学质量" },
  { key: "rating_grading", label: "给分好坏" },
  { key: "rating_attendance", label: "点名情况" },
];

const COURSE_DIMENSIONS: Dimension[] = [
  { key: "rating_homework", label: "作业量" },
  { key: "rating_gain", label: "收获感" },
  { key: "rating_exam_difficulty", label: "考试难度" },
];

const toneMap = {
  teacher: {
    accent: "text-rose-700",
    panel: "border-rose-100 bg-rose-50/75",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    chipActive: "border-rose-300 bg-rose-600 text-white shadow-[0_12px_30px_rgba(225,29,72,0.18)]",
    scoreIdle: "border-rose-100 bg-white text-rose-500 hover:border-rose-200 hover:bg-rose-50",
    scoreActive: "border-rose-300 bg-rose-600 text-white shadow-sm",
  },
  course: {
    accent: "text-sky-700",
    panel: "border-sky-100 bg-sky-50/75",
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    chipActive: "border-sky-300 bg-sky-600 text-white shadow-[0_12px_30px_rgba(2,132,199,0.18)]",
    scoreIdle: "border-sky-100 bg-white text-sky-500 hover:border-sky-200 hover:bg-sky-50",
    scoreActive: "border-sky-300 bg-sky-600 text-white shadow-sm",
  },
} as const;

function RatingField({
  label,
  value,
  accentClassName,
  idleClassName,
  activeClassName,
  onChange,
}: {
  label: string;
  value: number;
  accentClassName: string;
  idleClassName: string;
  activeClassName: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-800">{label}</div>
          <p className="mt-1 text-xs leading-5 text-slate-500">请选择 1 到 5 分。</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${accentClassName}`}>
          {value > 0 ? `${value}.0` : "未评分"}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`rounded-2xl border px-0 py-3 text-sm font-semibold transition ${
              score === value ? activeClassName : idleClassName
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EvaluationComposerForm({
  evaluationType,
  relatedItems = [],
  submitLabel = "提交评价",
  initialValues,
  onSubmit,
}: {
  evaluationType: "teacher" | "course";
  relatedItems?: RelatedItem[];
  submitLabel?: string;
  initialValues?: {
    relatedId?: number | null;
    comment?: string | null;
    anonymous?: boolean;
    ratings?: Record<string, number | null | undefined>;
  };
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [relatedId, setRelatedId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const primaryDimensions = evaluationType === "teacher" ? TEACHER_DIMENSIONS : COURSE_DIMENSIONS;
  const linkedDimensions = evaluationType === "teacher" ? COURSE_DIMENSIONS : TEACHER_DIMENSIONS;
  const relatedLabel = evaluationType === "teacher" ? "关联课程" : "关联教师";
  const tone = toneMap[evaluationType];

  const requiredDimensions = useMemo(
    () => (relatedId ? [...primaryDimensions, ...linkedDimensions] : primaryDimensions),
    [linkedDimensions, primaryDimensions, relatedId],
  );

  useEffect(() => {
    setRatings(
      Object.fromEntries(
        Object.entries(initialValues?.ratings || {}).flatMap(([key, value]) =>
          typeof value === "number" && value > 0 ? [[key, value]] : [],
        ),
      ),
    );
    setRelatedId(initialValues?.relatedId ?? null);
    setComment(initialValues?.comment ?? "");
    setAnonymous(initialValues?.anonymous ?? false);
  }, [initialValues]);

  const allRequiredRated = requiredDimensions.every((dimension) => (ratings[dimension.key] ?? 0) > 0);

  const handleSubmit = async () => {
    if (!allRequiredRated || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        ...ratings,
        comment: comment.trim() || undefined,
        is_anonymous: anonymous,
      };

      if (evaluationType === "teacher" && relatedId) {
        payload.course_id = relatedId;
      }

      if (evaluationType === "course" && relatedId) {
        payload.teacher_id = relatedId;
      }

      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className={`rounded-[26px] border p-5 ${tone.panel}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={`text-sm font-medium ${tone.accent}`}>核心评分</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              先完成当前评价对象的三个核心维度，整体风格与资源上传表单保持同一套简洁输入节奏。
            </p>
          </div>
          <div className="text-xs text-slate-500">必填 3 项</div>
        </div>
      </div>

      <div className="grid gap-3">
        {primaryDimensions.map((dimension) => (
          <RatingField
            key={dimension.key}
            label={dimension.label}
            value={ratings[dimension.key] ?? 0}
            accentClassName={tone.chip}
            idleClassName={tone.scoreIdle}
            activeClassName={tone.scoreActive}
            onChange={(value) => setRatings((prev) => ({ ...prev, [dimension.key]: value }))}
          />
        ))}
      </div>

      {relatedItems.length > 0 ? (
        <div className={`rounded-[26px] border p-5 ${tone.panel}`}>
          <div className={`text-sm font-medium ${tone.accent}`}>{relatedLabel}</div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            可选。如果选择关联项，需要补齐另外三个维度后才能发布。
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setRelatedId(null)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                relatedId === null
                  ? tone.chipActive
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              不关联
            </button>
            {relatedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRelatedId(item.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  relatedId === item.id
                    ? tone.chipActive
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {relatedId ? (
        <div className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.05)]">
          <div>
            <div className={`text-sm font-medium ${tone.accent}`}>补充关联维度</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">当前已开启关联评价，请补充对应的三个维度评分。</p>
          </div>
          <div className="grid gap-3">
            {linkedDimensions.map((dimension) => (
              <RatingField
                key={dimension.key}
                label={dimension.label}
                value={ratings[dimension.key] ?? 0}
                accentClassName={tone.chip}
                idleClassName={tone.scoreIdle}
                activeClassName={tone.scoreActive}
                onChange={(value) => setRatings((prev) => ({ ...prev, [dimension.key]: value }))}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-800">评价内容</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">更适合写课堂感受、节奏判断、给分体验和避坑建议。</p>
          </div>
          <ModernCheckbox
            checked={anonymous}
            onChange={setAnonymous}
            label="匿名发表"
          />
        </div>
        <AdvancedTextarea
          className="mt-4"
          rows={9}
          label="输入评价正文"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="写下你的体验、建议或提醒。"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <ActionSubmitButton
          defaultText={submitLabel}
          sentText="提交中..."
          isSent={isSubmitting}
          onClick={handleSubmit}
          disabled={!allRequiredRated || isSubmitting}
        />
      </div>
    </div>
  );
}
