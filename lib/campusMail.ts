"use client";

import { feedback } from "@/store/useFeedbackStore";

export const CAMPUS_MAIL_URL = "https://mail.csu.edu.cn/";
const CAPTCHA_SEND_FAILURE_STORAGE_KEY = "campus-mail-captcha-send-failure-count";
const CAPTCHA_SEND_FAILURE_THRESHOLD = 3;

export function openCampusMail() {
  if (typeof window === "undefined") {
    return;
  }

  window.open(CAMPUS_MAIL_URL, "_blank", "noopener,noreferrer");
}

export function showCaptchaSentFeedback(description: string) {
  resetCaptchaSendFailureCount();
  feedback.success({
    title: "验证码已发送",
    description,
    duration: 0,
    actionLabel: "打开校园邮箱",
    onAction: openCampusMail,
  });
}

function getCaptchaSendFailureCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.sessionStorage.getItem(CAPTCHA_SEND_FAILURE_STORAGE_KEY);
  const count = Number(raw);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function setCaptchaSendFailureCount(count: number) {
  if (typeof window === "undefined") {
    return;
  }

  if (count <= 0) {
    window.sessionStorage.removeItem(CAPTCHA_SEND_FAILURE_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(CAPTCHA_SEND_FAILURE_STORAGE_KEY, String(count));
}

export function resetCaptchaSendFailureCount() {
  setCaptchaSendFailureCount(0);
}

export function showCaptchaSendFailureFeedback(
  error: unknown,
  options?: {
    title?: string;
    defaultDescription?: string;
  },
) {
  const nextCount = getCaptchaSendFailureCount() + 1;
  setCaptchaSendFailureCount(nextCount);

  const fallbackDescription = options?.defaultDescription ?? "验证码发送失败，请稍后重试";
  const errorDescription =
    error instanceof Error && error.message.trim() ? error.message : fallbackDescription;

  if (nextCount >= CAPTCHA_SEND_FAILURE_THRESHOLD) {
    const description = "请检查您的邮箱是否注册或稍后重试";
    feedback.error({
      title: options?.title ?? "验证码发送失败",
      description,
      duration: 0,
      actionLabel: "打开校园邮箱官网",
      onAction: openCampusMail,
    });
    return description;
  }

  feedback.error({
    title: options?.title ?? "验证码发送失败",
    description: errorDescription,
  });
  return errorDescription;
}
