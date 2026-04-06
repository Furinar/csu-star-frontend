"use client";

import styled from "styled-components";

export type DownloadStatus = "idle" | "loading" | "success";

interface DownloadButtonProps {
  status?: DownloadStatus;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function DownloadButton({
  status = "idle",
  disabled = false,
  onClick,
  className = "",
}: DownloadButtonProps) {
  return (
    <StyledWrapper className={className}>
      <button
        type="button"
        disabled={disabled}
        data-status={status}
        className="download-button"
        onClick={onClick}
      >
        <span className="circle">
          <svg
            className="icon icon-download"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 19V5m0 14-4-4m4 4 4-4"
            />
          </svg>
          <div className="square" />
        </span>
        <span className="title title-idle">下载文件</span>
        <span className="title title-loading">下载中</span>
        <span className="title title-success">已开始</span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .download-button {
    --download-accent: var(--page-accent-text, #047857);
    --download-accent-strong: var(--first-color, #10b981);
    --download-accent-soft: var(
      --page-accent-soft-strong,
      rgba(16, 185, 129, 0.12)
    );
    --download-border: var(--page-accent-border, rgba(16, 185, 129, 0.18));
    --download-gradient: var(
      --page-accent-gradient,
      linear-gradient(135deg, #34d399 0%, #10b981 56%, #0f766e 100%)
    );

    position: relative;
    display: inline-flex;
    align-items: center;
    width: 164px;
    padding: 5px;
    border: 1px solid var(--download-border);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    cursor: pointer;
    transition: all 0.35s ease;
    overflow: hidden;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  }

  .download-button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .download-button .circle {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: var(--download-gradient);
    color: #fff;
    box-shadow: 0 10px 20px var(--download-accent-soft);
    overflow: hidden;
    flex-shrink: 0;
  }

  .download-button .circle::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.12);
    transform: translateY(-100%);
    transition: transform 0.35s ease;
  }

  .download-button .icon,
  .download-button .square {
    position: absolute;
    transition: all 0.35s ease;
  }

  .download-button .icon {
    width: 24px;
    height: 24px;
  }

  .download-button .square {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    background: #fff;
    opacity: 0;
    transform: scale(0.5);
  }

  .download-button .title {
    position: absolute;
    right: 18px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--download-accent);
    transition: all 0.25s ease;
  }

  .download-button .title-loading,
  .download-button .title-success {
    opacity: 0;
    visibility: hidden;
  }

  .download-button[data-status="idle"]:not(:disabled):hover {
    border-color: color-mix(
      in srgb,
      var(--download-accent-strong) 40%,
      white
    );
    background: rgba(255, 255, 255, 0.98);
  }

  .download-button[data-status="idle"]:not(:disabled):hover .circle::before {
    transform: translateY(0);
  }

  .download-button[data-status="loading"] {
    width: 138px;
  }

  .download-button[data-status="loading"] .title-idle,
  .download-button[data-status="loading"] .title-success {
    opacity: 0;
    visibility: hidden;
  }

  .download-button[data-status="loading"] .title-loading {
    opacity: 1;
    visibility: visible;
  }

  .download-button[data-status="loading"] .circle {
    animation: pulse 1s ease-in-out infinite;
  }

  .download-button[data-status="loading"] .circle::before {
    transform: translateY(0);
    animation: loading-fill 1.2s ease-in-out infinite;
  }

  .download-button[data-status="loading"] .icon-download {
    opacity: 0;
    transform: scale(0.7);
  }

  .download-button[data-status="loading"] .square {
    opacity: 1;
    transform: scale(1);
  }

  .download-button[data-status="success"] {
    width: 138px;
    border-color: color-mix(
      in srgb,
      var(--download-accent-strong) 55%,
      white
    );
  }

  .download-button[data-status="success"] .title-idle,
  .download-button[data-status="success"] .title-loading {
    opacity: 0;
    visibility: hidden;
  }

  .download-button[data-status="success"] .title-success {
    opacity: 1;
    visibility: visible;
  }

  .download-button[data-status="success"] .circle::before {
    transform: translateY(0);
  }

  .download-button[data-status="success"] .icon-download {
    opacity: 0;
    transform: scale(0.7);
  }

  .download-button[data-status="success"] .square {
    opacity: 1;
    transform: scale(1);
  }

  @keyframes pulse {
    0% {
      transform: scale(0.96);
      box-shadow: 0 0 0 0
        color-mix(in srgb, var(--download-accent-strong) 22%, transparent);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 16px rgba(255, 255, 255, 0);
    }
    100% {
      transform: scale(0.96);
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
  }

  @keyframes loading-fill {
    0% {
      transform: translateY(100%);
    }
    100% {
      transform: translateY(0);
    }
  }
`;
