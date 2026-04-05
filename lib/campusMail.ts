"use client";

import { feedback } from "@/store/useFeedbackStore";

export const CAMPUS_MAIL_URL = "https://mail.csu.edu.cn/";

export function openCampusMail() {
  if (typeof window === "undefined") {
    return;
  }

  window.open(CAMPUS_MAIL_URL, "_blank", "noopener,noreferrer");
}

export function showCaptchaSentFeedback(description: string) {
  feedback.success({
    title: "验证码已发送",
    description,
    duration: 0,
    actionLabel: "打开校园邮箱",
    onAction: openCampusMail,
  });
}
