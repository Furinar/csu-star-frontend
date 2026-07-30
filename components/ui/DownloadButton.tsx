"use client";

import styles from "./DownloadButton.module.css";

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
    <div className={className || undefined}>
      <button
        type="button"
        disabled={disabled}
        data-status={status}
        className={styles.downloadButton}
        onClick={onClick}
      >
        <span className={styles.circle}>
          <svg
            className={styles.icon}
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
          <div className={styles.square} />
        </span>
        <span className={`${styles.title} ${styles.titleIdle}`}>下载文件</span>
        <span className={`${styles.title} ${styles.titleLoading}`}>下载中</span>
        <span className={`${styles.title} ${styles.titleSuccess}`}>已开始</span>
      </button>
    </div>
  );
}
