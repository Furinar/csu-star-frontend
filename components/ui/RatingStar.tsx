"use client";

import React, { useId } from "react";
import styled from "styled-components";

interface RatingStarProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  name?: string;
  className?: string;
  disabled?: boolean;
  hint?: string;
}

const StyledWrapper = styled.div<{ $disabled?: boolean; $tone?: "low" | "high" | "neutral" }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  transition: all 0.2s ease;
  height: 48px;

  opacity: ${(props) => (props.$disabled ? "0.4" : "1")};
  pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};
  filter: ${(props) =>
    props.$disabled ? "grayscale(100%) blur(0.5px)" : "none"};

  .hint {
    position: absolute;
    right: 14px;
    bottom: -14px;
    font-size: 11px;
    line-height: 1.2;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    transform: translateY(1px);
  }

  @media (max-width: 640px) {
    height: 40px;
    padding: 6px 12px;

    .hint {
      font-size: 10px;
      bottom: -12px;
    }

    .rating svg {
      width: 1.6rem;
      height: 1.6rem;
    }
  }

  .hint-low {
    color: #dc2626;
  }

  .hint-high {
    color: #ca8a04;
  }

  .hint-neutral {
    color: #ca8a04;
  }

  .rating {
    display: flex;
    flex-direction: row-reverse;
    gap: 0.3rem;
    --stroke: ${(props) =>
      props.$tone === "low"
        ? "#ef4444"
        : props.$tone === "high"
          ? "#facc15"
          : "#94a3b8"};
    --fill: ${(props) =>
      props.$tone === "low" ? "#ef4444" : props.$tone === "high" ? "#facc15" : "#facc15"};
  }

  .rating input {
    appearance: unset;
    display: none;
  }

  .rating label {
    cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  }

  .rating svg {
    width: 2rem;
    height: 2rem;
    overflow: visible;
    fill: transparent;
    stroke: var(--stroke);
    stroke-linejoin: bevel;
    stroke-dasharray: 12;
    animation: idle 4s linear infinite;
    transition:
      stroke 0.2s,
      fill 0.5s;
  }

  @keyframes idle {
    from {
      stroke-dashoffset: 24;
    }
  }

  .rating label:hover svg,
  .rating label:hover ~ label svg {
    stroke: var(--fill);
  }

  .rating input:checked ~ label svg {
    transition: 0s;
    animation:
      idle 4s linear infinite,
      yippee 0.75s backwards;
    fill: var(--fill);
    stroke: var(--fill);
    stroke-opacity: 0;
    stroke-dasharray: 0;
    stroke-linejoin: miter;
    stroke-width: 8px;
  }

  @keyframes yippee {
    0% {
      transform: scale(1);
      fill: var(--fill);
      fill-opacity: 0;
      stroke-opacity: 1;
      stroke: var(--stroke);
      stroke-dasharray: 10;
      stroke-width: 1px;
      stroke-linejoin: bevel;
    }
    30% {
      transform: scale(0);
      fill: var(--fill);
      fill-opacity: 0;
      stroke-opacity: 1;
      stroke: var(--stroke);
      stroke-dasharray: 10;
      stroke-width: 1px;
      stroke-linejoin: bevel;
    }
    30.1% {
      stroke: var(--fill);
      stroke-dasharray: 0;
      stroke-linejoin: miter;
      stroke-width: 8px;
    }
    60% {
      transform: scale(1.2);
      fill: var(--fill);
    }
  }
`;

const hintMap = {
  1: {tone: "low", text: "作业多 / 考试难 / 收获低"},
  2: {tone: "low", text: "作业偏多，考试偏难"},
  3: {tone: "mid", text: "作业与难度适中"},
  4: {tone: "high", text: "作业较少，考试较易"},
  5: {tone: "high", text: "作业少 / 考试易 / 收获高"},
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

  // CSS structure heavily relies on siblings combinatorial selectors.
  // Using 5 down to 1 structure alongside CSS row-reverse lets CSS `~` gracefully target everything "visually to the left".
  const stars = [5, 4, 3, 2, 1];
  const currentHint = value > 0 ? hint ?? hintMap[value as keyof typeof hintMap]?.text ?? "" : "";
  const currentTone = value <= 2 ? "low" : value >= 4 ? "high" : "neutral";

  return (
    <StyledWrapper className={className} $disabled={disabled} $tone={currentTone}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="rating">
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
        <span className={`hint ${currentTone === "low" ? "hint-low" : "hint-high"}`}>
          {currentHint}
        </span>
      ) : null}
    </StyledWrapper>
  );
}
