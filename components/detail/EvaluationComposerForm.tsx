"use client";

import { useMemo, useState } from "react";

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
    soft: "border-rose-200 bg-rose-50/80",
    active: "border-rose-300 bg-rose-100 text-rose-700",
    solid: "bg-rose-600 hover:bg-rose-700",
    focus: "focus:border-rose-300",
  },
  course: {
    accent: "text-sky-700",
    soft: "border-sky-200 bg-sky-50/80",
    active: "border-sky-300 bg-sky-100 text-sky-700",
    solid: "bg-sky-600 hover:bg-sky-700",
    focus: "focus:border-sky-300",
  },
} as const;

function RatingField({
  label,
  value,
  activeClassName,
  onChange,
}: {
  label: string;
  value: number;
  activeClassName: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-slate-700">{label}</div>
        <div className="text-sm font-semibold text-slate-500">{value > 0 ? `${value}.0` : "--"}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-base font-semibold transition ${
              star <= value
                ? activeClassName
                : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600"
            }`}
          >
            {star}
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
  onSubmit,
}: {
  evaluationType: "teacher" | "course";
  relatedItems?: RelatedItem[];
  submitLabel?: string;
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {primaryDimensions.map((dimension) => (
          <RatingField
            key={dimension.key}
            label={dimension.label}
            value={ratings[dimension.key] ?? 0}
            activeClassName={tone.active}
            onChange={(value) => setRatings((prev) => ({ ...prev, [dimension.key]: value }))}
          />
        ))}
      </div>

      {relatedItems.length > 0 ? (
        <div className={`rounded-[28px] border p-5 ${tone.soft}`}>
          <div className={`text-sm font-medium ${tone.accent}`}>{relatedLabel}</div>
          <p className="mt-1 text-sm text-slate-500">
            可选。若选择关联项，需要补齐另外三个维度。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRelatedId(null)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                relatedId === null
                  ? `${tone.active} shadow-sm`
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
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  relatedId === item.id
                    ? `${tone.active} shadow-sm`
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
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className={`text-sm font-medium ${tone.accent}`}>补充关联维度</div>
            <p className="mt-1 text-sm text-slate-500">请补充关联项对应的评分。</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {linkedDimensions.map((dimension) => (
              <RatingField
                key={dimension.key}
                label={dimension.label}
                value={ratings[dimension.key] ?? 0}
                activeClassName={tone.active}
                onChange={(value) => setRatings((prev) => ({ ...prev, [dimension.key]: value }))}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-800">评价内容</div>
            <p className="mt-1 text-sm text-slate-500">更适合写课堂感受、节奏判断、给分体验和避坑建议。</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(event) => setAnonymous(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            匿名发表
          </label>
        </div>
        <textarea
          rows={8}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="写下你的体验、建议或提醒。"
          className={`mt-4 w-full resize-none rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition ${tone.focus}`}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allRequiredRated || isSubmitting}
          className={`rounded-full px-6 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${tone.solid}`}
        >
          {isSubmitting ? "提交中..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
