"use client";

import React from "react";
import styled from "styled-components";

interface LikeBurstEffectProps {
  triggerKey: number | string | null | undefined;
  className?: string;
}

const ANIMATION_DURATION_MS = 520;

export default function LikeBurstEffect({
  triggerKey,
  className = "",
}: LikeBurstEffectProps) {
  const [instanceKey, setInstanceKey] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (triggerKey == null) {
      return;
    }

    setInstanceKey((prev) => prev + 1);
    setIsVisible(true);
    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, ANIMATION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [triggerKey]);

  if (!isVisible) {
    return null;
  }

  return (
    <StyledWrapper
      key={instanceKey}
      aria-hidden="true"
      className={`${className} is-active`}
    >
      <div className="burst-core" />
      <svg className="burst-rays" width={100} height={100} viewBox="0 0 100 100">
        <polygon points="50,8 54,24 46,24" />
        <polygon points="78,18 70,31 64,25" />
        <polygon points="92,50 76,54 76,46" />
        <polygon points="82,78 69,70 75,64" />
        <polygon points="50,92 46,76 54,76" />
        <polygon points="18,82 25,69 31,75" />
        <polygon points="8,50 24,46 24,54" />
        <polygon points="18,18 31,25 25,31" />
      </svg>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 92px;
  height: 92px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  opacity: 1;
  z-index: 20;
  overflow: visible;

  .burst-core {
    position: absolute;
    inset: 28px;
    border-radius: 9999px;
    background:
      radial-gradient(circle, rgba(255, 115, 160, 0.8) 0%, rgba(255, 115, 160, 0.32) 38%, rgba(255, 115, 160, 0) 72%);
    transform: scale(0.16);
  }

  .burst-rays {
    position: absolute;
    inset: 0;
    overflow: visible;
    fill: rgba(255, 115, 160, 1);
    filter: drop-shadow(0 0 10px rgba(255, 115, 160, 0.6));
    transform: scale(0.28);
  }

  &.is-active {
    animation: burst-fade ${ANIMATION_DURATION_MS}ms ease-out forwards;
  }

  &.is-active .burst-core {
    animation: burst-core ${ANIMATION_DURATION_MS}ms ease-out forwards;
  }

  &.is-active .burst-rays {
    animation: burst-rays ${ANIMATION_DURATION_MS}ms ease-out forwards;
  }

  @keyframes burst-fade {
    0% {
      opacity: 0.1;
    }
    18% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes burst-core {
    0% {
      opacity: 0.95;
      transform: scale(0.08);
    }
    38% {
      opacity: 0.55;
      transform: scale(1.1);
    }
    100% {
      opacity: 0;
      transform: scale(1.7);
    }
  }

  @keyframes burst-rays {
    0% {
      opacity: 0;
      transform: scale(0.22) rotate(-10deg);
    }
    20% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
    100% {
      opacity: 0;
      transform: scale(1.6) rotate(12deg);
    }
  }
`;
