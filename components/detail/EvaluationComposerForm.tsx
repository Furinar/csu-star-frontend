"use client";

import { useEffect, useMemo, useState } from "react";
import ModernCheckbox from "@/components/ui/ModernCheckbox";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import { AdvancedTextarea } from "@/app/(features)/resource/components/AdvancedFormControls";
import RatingStar from "@/components/ui/RatingStar";

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
    chipActive:
      "border-rose-300 bg-rose-600 text-white shadow-[0_12px_30px_rgba(225,29,72,0.18)]",
  },
  course: {
    accent: "text-sky-700",
    chipActive:
      "border-sky-300 bg-sky-600 text-white shadow-[0_12px_30px_rgba(2,132,199,0.18)]",
  },
} as const;

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

  const primaryDimensions =
    evaluationType === "teacher" ? TEACHER_DIMENSIONS : COURSE_DIMENSIONS;
  const linkedDimensions =
    evaluationType === "teacher" ? COURSE_DIMENSIONS : TEACHER_DIMENSIONS;
  const tone = toneMap[evaluationType];

  const requiredDimensions = useMemo(
    () =>
      relatedId
        ? [...primaryDimensions, ...linkedDimensions]
        : primaryDimensions,
    [linkedDimensions, primaryDimensions, relatedId],
  );

  const [enableRelated, setEnableRelated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!enableRelated) {
      setRelatedId(null);
      // Clear linked ratings
      setRatings((prev) => {
        const reset = { ...prev };
        linkedDimensions.forEach((dim) => delete reset[dim.key]);
        return reset;
      });
    } else if (relatedItems.length > 0 && !relatedId) {
      // Auto-select first item when enabled if none selected
      setRelatedId(relatedItems[0].id);
    }
  }, [enableRelated, relatedItems, linkedDimensions, relatedId]);

  useEffect(() => {
    setRatings(
      Object.fromEntries(
        Object.entries(initialValues?.ratings || {}).flatMap(([key, value]) =>
          typeof value === "number" && value > 0 ? [[key, value]] : [],
        ),
      ),
    );
    setRelatedId(initialValues?.relatedId ?? null);
    if (initialValues?.relatedId) {
      setEnableRelated(true);
    }
    setComment(initialValues?.comment ?? "");
    setAnonymous(initialValues?.anonymous ?? false);
  }, [initialValues]);

  const allRequiredRated = requiredDimensions.every(
    (dimension) => (ratings[dimension.key] ?? 0) > 0,
  );

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
    <div className="mx-auto max-w-4xl space-y-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Primary Item Evaluation */}
        <div className="flex flex-col h-full">
          <div className="mb-4 h-10 flex items-center">
            <h3 className={`text-lg font-semibold ${tone.accent}`}>
              {evaluationType === "teacher" ? "教师评分" : "课程评分"}
            </h3>
          </div>
          <div className="grid gap-3 flex-1">
            {primaryDimensions.map((dimension) => (
              <RatingStar
                key={dimension.key}
                label={dimension.label}
                value={ratings[dimension.key] ?? 0}
                onChange={(value) =>
                  setRatings((prev) => ({ ...prev, [dimension.key]: value }))
                }
              />
            ))}
          </div>
        </div>

        {/* Right Side: Related Item Evaluation */}
        <div className="flex flex-col h-full pl-0 md:pl-2">
          <div className="mb-4 h-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3
                className={`text-lg font-semibold ${!enableRelated ? "text-slate-400" : "text-slate-700"}`}
              >
                关联{evaluationType === "teacher" ? "课程" : "教师"}
              </h3>
              {relatedItems.length > 0 && (
                <ModernCheckbox
                  checked={enableRelated}
                  onChange={(checked) => {
                    setEnableRelated(checked);
                    if (!checked) setIsDropdownOpen(false);
                  }}
                  label=""
                />
              )}
            </div>

            {enableRelated && relatedItems.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition flex items-center gap-1 min-w-[90px] justify-center ${tone.chipActive}`}
                >
                  <span className="max-w-[120px] truncate leading-tight">
                    {relatedItems.find((i) => i.id === relatedId)?.name ||
                      "请选择"}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute top-full mt-2 right-0 w-max min-w-[200px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                      <div className="flex flex-col gap-1">
                        {relatedItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setRelatedId(item.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition ${
                              relatedId === item.id
                                ? "bg-slate-50 text-[var(--first-color)] font-semibold"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 transition-all duration-300">
            {relatedItems.length > 0 ? (
              <div
                className={`h-full ${!enableRelated ? "opacity-40 grayscale blur-[1px] pointer-events-none" : ""}`}
              >
                <div className={`grid gap-3 h-full`}>
                  {linkedDimensions.map((dimension) => (
                    <RatingStar
                      key={dimension.key}
                      disabled={!enableRelated}
                      label={dimension.label}
                      value={ratings[dimension.key] ?? 0}
                      onChange={(value) =>
                        setRatings((prev) => ({
                          ...prev,
                          [dimension.key]: value,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50">
                <span className="text-sm text-slate-400">
                  暂无{evaluationType === "teacher" ? "课程" : "教师"}可关联
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Comment and Action */}
      <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-800">评价内容</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              更适合写课堂感受、节奏判断、给分体验和避坑建议。
            </p>
          </div>
          <ModernCheckbox
            checked={anonymous}
            onChange={setAnonymous}
            label="匿名发表"
          />
        </div>
        <AdvancedTextarea
          className="mt-4"
          rows={5}
          label="输入评价正文"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="写下你的体验、建议或提醒。"
        />
      </div>

      <div className="flex items-center justify-end">
        <ActionSubmitButton
          defaultText={submitLabel}
          sentText="提交中..."
          isSent={isSubmitting}
          onClick={() => {
            handleSubmit().catch(console.error);
          }}
          disabled={!allRequiredRated || isSubmitting}
        />
      </div>
    </div>
  );
}
