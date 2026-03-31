"use client";

import { useEffect, useMemo, useState } from "react";

interface RelatedItem {
  id: number;
  name: string;
}

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationType: "teacher" | "course";
  relatedItems?: RelatedItem[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
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

function RatingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-100 bg-white/85 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-500">{value > 0 ? `${value}.0` : "--"}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-base transition ${
              star <= value
                ? "border-[var(--first-color)]/20 bg-[var(--first-color)]/10 text-[var(--first-color)]"
                : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:text-slate-600"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EvaluationModal({
  isOpen,
  onClose,
  evaluationType,
  relatedItems = [],
  onSubmit,
}: EvaluationModalProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [relatedId, setRelatedId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const primaryDimensions = evaluationType === "teacher" ? TEACHER_DIMENSIONS : COURSE_DIMENSIONS;
  const linkedDimensions = evaluationType === "teacher" ? COURSE_DIMENSIONS : TEACHER_DIMENSIONS;

  const requiredDimensions = useMemo(
    () => (relatedId ? [...primaryDimensions, ...linkedDimensions] : primaryDimensions),
    [linkedDimensions, primaryDimensions, relatedId],
  );

  useEffect(() => {
    if (!isOpen) {
      setRatings({});
      setRelatedId(null);
      setComment("");
      setAnonymous(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const relatedLabel = evaluationType === "teacher" ? "关联课程" : "关联教师";
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
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/70 bg-gradient-to-br from-white via-slate-50 to-sky-50/60 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.18)] md:p-7">
        <div className="absolute inset-x-0 top-0 h-24 rounded-t-[32px] bg-gradient-to-r from-sky-100/50 via-white/30 to-rose-100/50" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-[var(--first-color)] shadow-sm">
                {evaluationType === "teacher" ? "教师评价" : "课程评价"}
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">发布一条新评价</h3>
              <p className="mt-2 text-sm text-slate-500">
                默认填写当前页面对应的 3 个核心维度。若选择关联项，则需要补全另外 3 个维度。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-lg text-slate-500 shadow-sm transition hover:text-slate-800"
            >
              ×
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {primaryDimensions.map((dimension) => (
              <RatingField
                key={dimension.key}
                label={dimension.label}
                value={ratings[dimension.key] ?? 0}
                onChange={(value) => setRatings((prev) => ({ ...prev, [dimension.key]: value }))}
              />
            ))}
          </div>

          {relatedItems.length > 0 ? (
            <div className="mt-6 rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-sm">
              <div className="text-sm font-medium text-slate-700">{relatedLabel}</div>
              <p className="mt-1 text-sm text-slate-500">可选。若选择，将按关联评价补齐另外三个评分维度。</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRelatedId(null)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    relatedId === null
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  不关联
                </button>
                {relatedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRelatedId(item.id)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      relatedId === item.id
                        ? "bg-[var(--first-color)] text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {relatedId ? (
            <div className="mt-6 rounded-[28px] border border-[var(--first-color)]/10 bg-[var(--first-color)]/5 p-5">
              <div className="text-sm font-medium text-slate-700">已开启关联评价</div>
              <p className="mt-1 text-sm text-slate-500">请补充另外三个维度，提交后两侧详情页都会看到这条关联评价。</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {linkedDimensions.map((dimension) => (
                  <RatingField
                    key={dimension.key}
                    label={dimension.label}
                    value={ratings[dimension.key] ?? 0}
                    onChange={(value) => setRatings((prev) => ({ ...prev, [dimension.key]: value }))}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-700">文字评价</div>
            <textarea
              rows={5}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="可以补充课堂体验、作业节奏、给分感受、适用人群等。"
              className="mt-4 w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-[var(--first-color)]/30 focus:bg-white"
            />
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-500">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(event) => setAnonymous(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              匿名发表
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allRequiredRated || isSubmitting}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "提交中..." : "提交评价"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
