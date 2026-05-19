"use client";

import {useEffect, useMemo, useState} from "react";
import ModernCheckbox from "@/components/ui/ModernCheckbox";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import {AdvancedTextarea} from "@/app/(features)/resource/components/AdvancedFormControls";
import RatingStar from "@/components/ui/RatingStar";
import type {EntityId} from "@/types/entity";

interface RelatedItem {
  id: EntityId;
  name: string;
}

interface Dimension {
  key: string;
  label: string;
}

const TEACHER_DIMENSIONS: Dimension[] = [
  {key: "rating_quality", label: "教学质量"},
  {key: "rating_grading", label: "给分好坏"},
  {key: "rating_attendance", label: "点名情况"},
];

const COURSE_DIMENSIONS: Dimension[] = [
  {key: "rating_homework", label: "作业量"},
  {key: "rating_gain", label: "收获感"},
  {key: "rating_exam_difficulty", label: "考试难度"},
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
    relatedId?: EntityId | null;
    comment?: string | null;
    anonymous?: boolean;
    ratings?: Record<string, number | null | undefined>;
  };
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [relatedId, setRelatedId] = useState<EntityId | null>(null);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const primaryDimensions =
      evaluationType === "teacher" ? TEACHER_DIMENSIONS : COURSE_DIMENSIONS;
  const linkedDimensions =
      evaluationType === "teacher" ? COURSE_DIMENSIONS : TEACHER_DIMENSIONS;
  const tone = toneMap[evaluationType];
  const supportsRelated = evaluationType === "teacher";

  const [enableRelated, setEnableRelated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isRelatedEnabled =
      supportsRelated && enableRelated && relatedItems.length > 0;
  const requiredDimensions = useMemo(
      () =>
          isRelatedEnabled
              ? [...primaryDimensions, ...linkedDimensions]
              : primaryDimensions,
      [isRelatedEnabled, linkedDimensions, primaryDimensions],
  );

  useEffect(() => {
    if (!supportsRelated) {
      setEnableRelated(false);
      setRelatedId(null);
      return;
    }

    if (!enableRelated) {
      setRelatedId(null);
      // Clear linked ratings
      setRatings((prev) => {
        const reset = {...prev};
        linkedDimensions.forEach((dim) => delete reset[dim.key]);
        return reset;
      });
    } else if (relatedItems.length > 0 && !relatedId) {
      // Auto-select first item when enabled if none selected
      setRelatedId(relatedItems[0].id);
    }
  }, [enableRelated, relatedItems, linkedDimensions, relatedId, supportsRelated]);

  useEffect(() => {
    setRatings(
        Object.fromEntries(
            Object.entries(initialValues?.ratings || {}).flatMap(([key, value]) =>
                typeof value === "number" && value > 0 ? [[key, value]] : [],
            ),
        ),
    );
    if (supportsRelated) {
      setRelatedId(initialValues?.relatedId ?? null);
      setEnableRelated(Boolean(initialValues?.relatedId));
    } else {
      setRelatedId(null);
      setEnableRelated(false);
    }
    setComment(initialValues?.comment ?? "");
    setAnonymous(initialValues?.anonymous ?? false);
  }, [initialValues, supportsRelated]);

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

      if (evaluationType === "teacher" && isRelatedEnabled && relatedId) {
        payload.course_id = relatedId;
      }

      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="mx-auto w-full max-w-4xl space-y-3 sm:space-y-5 md:space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {/* Left Side: Primary Item Evaluation */}
          <div className="flex h-full flex-col">
            <div className="mb-3 flex min-h-0 items-center sm:mb-4 sm:h-10">
              <h3 className={`text-lg font-semibold ${tone.accent}`}>
                {evaluationType === "teacher" ? "教师评分" : "课程评分"}
              </h3>
            </div>
            <div className="grid flex-1 gap-2 sm:gap-3">
              {primaryDimensions.map((dimension) => (
                  <RatingStar
                      key={dimension.key}
                      label={dimension.label}
                      value={ratings[dimension.key] ?? 0}
                      onChange={(value) =>
                          setRatings((prev) => ({...prev, [dimension.key]: value}))
                      }
                      hint={
                        dimension.key === "rating_homework"
                          ? {
                              1: "作业很多",
                              2: "作业偏多",
                              3: "作业适中",
                              4: "作业偏少",
                              5: "作业很少",
                            }[ratings[dimension.key] ?? 0]
                          : dimension.key === "rating_gain"
                            ? {
                                1: "收获有限",
                                2: "收获一般",
                                3: "有所收获",
                                4: "收获颇丰",
                                5: "收获满满",
                              }[ratings[dimension.key] ?? 0]
                            : dimension.key === "rating_exam_difficulty"
                              ? {
                                  1: "考试很难",
                                  2: "考试偏难",
                                  3: "难度适中",
                                  4: "考试偏易",
                                  5: "考试很易",
                                }[ratings[dimension.key] ?? 0]
                              : undefined
                      }
                  />
              ))}
            </div>
          </div>

          {evaluationType === "teacher" ? (
              <div className="flex h-full flex-col">
                <div
                    className="mb-3 flex flex-col gap-3 sm:mb-4 sm:h-10 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <h3
                        className={`text-lg font-semibold ${!enableRelated ? "text-slate-400" : "text-slate-700"}`}
                    >
                      关联课程
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
                      <div className="relative w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex w-full items-center justify-between gap-1 rounded-full border px-3 py-2 text-sm font-medium transition sm:min-w-[120px] sm:justify-center ${tone.chipActive}`}
                        >
                    <span className="max-w-[calc(100%-1.5rem)] truncate leading-tight sm:max-w-[120px]">
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
                              <div
                                  className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:left-auto sm:right-0 sm:min-w-[220px] sm:w-max">
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
                        <div className={`grid gap-2 sm:gap-3 h-full`}>
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
                                  hint={
                                    dimension.key === "rating_homework"
                                      ? {
                                          1: "作业很少",
                                          2: "作业偏少",
                                          3: "作业适中",
                                          4: "作业偏多",
                                          5: "作业很多",
                                        }[ratings[dimension.key] ?? 0]
                                      : dimension.key === "rating_gain"
                                        ? {
                                            1: "收获有限",
                                            2: "收获一般",
                                            3: "有所收获",
                                            4: "收获颇丰",
                                            5: "收获满满",
                                          }[ratings[dimension.key] ?? 0]
                                        : dimension.key === "rating_exam_difficulty"
                                          ? {
                                              1: "考试很易",
                                              2: "考试偏易",
                                              3: "难度适中",
                                              4: "考试偏难",
                                              5: "考试很难",
                                            }[ratings[dimension.key] ?? 0]
                                          : undefined
                                  }
                              />
                          ))}
                        </div>
                      </div>
                  ) : (
                      <div
                          className="h-full flex flex-col items-center justify-center py-8 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50">
                        <span className="text-sm text-slate-400">暂无课程可关联</span>
                      </div>
                  )}
                </div>
              </div>
          ) : (
              <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_16px_42px_rgba(15,23,42,0.05)] sm:p-5">
                <div className="flex flex-row items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-800">评价内容</div>
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
          )}
        </div>

        {evaluationType === "teacher" ? (
            <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_16px_42px_rgba(15,23,42,0.05)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-medium text-slate-800">评价内容</div>
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
        ) : null}

        <div className="flex items-center w-full justify-end">
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
