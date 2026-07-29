"use client";

import React, { useId } from "react";
import styles from "./RatingStar.module.css";

interface RatingStarProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  name?: string;
  className?: string;
  disabled?: boolean;
  hint?: string;
}

const hintMap = {
  1: { tone: "low", text: "作业多 / 考试难 / 收获低" },
  2: { tone: "low", text: "作业偏多，考试偏难" },
  3: { tone: "mid", text: "作业与难度适中" },
  4: { tone: "high", text: "作业较少，考试较易" },
  5: { tone: "high", text: "作业少 / 考试易 / 收获高" },
} as const;

export default function RatingStar({
  label,
  value,
  onChange,
  name,
  className,
  disabled,
  hint,
}: RatingStarProps) {
  const generatedId = useId();
  const radioName = name || generatedId;

  // CSS structure relies on sibling selectors.
  // 5→1 with row-reverse lets `~` target everything visually to the left.
  const stars = [5, 4, 3, 2, 1];
  const currentHint =
    value > 0 ? (hint ?? hintMap[value as keyof typeof hintMap]?.text ?? "") : "";
  const currentTone = value <= 2 ? "low" : value >= 4 ? "high" : "neutral";

  return (
    <div
      className={[styles.wrapper, className].filter(Boolean).join(" ")}
      data-disabled={disabled ? "true" : "false"}
      data-tone={currentTone}
    >
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className={styles.rating}>
        {stars.map((star) => {
          const id = `${radioName}-star-${star}`;
          return (
            <React.Fragment key={star}>
              <input
                type="radio"
                id={id}
                name={radioName}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                disabled={disabled}
              />
              <label htmlFor={id}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    pathLength={360}
                    d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"
                  />
                </svg>
              </label>
            </React.Fragment>
          );
        })}
      </div>
      {currentHint ? (
        <span
          className={`${styles.hint} ${
            currentTone === "low" ? styles.hintLow : styles.hintHigh
          }`}
        >
          {currentHint}
        </span>
      ) : null}
    </div>
  );
}
