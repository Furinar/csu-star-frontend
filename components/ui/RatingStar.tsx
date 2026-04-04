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
}

const StyledWrapper = styled.div<{ $disabled?: boolean }>`
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

  .rating {
    display: flex;
    flex-direction: row-reverse;
    gap: 0.3rem;
    --stroke: #94a3b8;
    --fill: #ffc73a;
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

export default function RatingStar({
  label,
  value,
  onChange,
  name,
  className,
  disabled,
}: RatingStarProps) {
  const generatedId = useId();
  const radioName = name || generatedId;

  // CSS structure heavily relies on siblings combinatorial selectors.
  // Using 5 down to 1 structure alongside CSS row-reverse lets CSS `~` gracefully target everything "visually to the left".
  const stars = [5, 4, 3, 2, 1];

  return (
    <StyledWrapper className={className} $disabled={disabled}>
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
    </StyledWrapper>
  );
}
