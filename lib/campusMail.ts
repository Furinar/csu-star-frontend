"use client";

import { feedback } from "@/store/useFeedbackStore";

export const CAMPUS_MAIL_URL = "https://mail.csu.edu.cn/";
export const ADMIN_MAIL_ADDRESS = "csustar@foxmail.com";
const CAPTCHA_SEND_FAILURE_STORAGE_KEY = "campus-mail-captcha-send-failure-count";
const CAPTCHA_SEND_FAILURE_THRESHOLD = 3;

type CaptchaFailureKind =
  | "unregistered_mailbox"
  | "campus_mailbox_pending_activation"
  | "sender_issue"
  | "contact_admin";

type CaptchaFailureScene =
  | "register"
  | "bind_email"
  | "forget_password"
  | "reset_password";

type CaptchaFailureFeedback = {
  kind: CaptchaFailureKind;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function openCampusMail() {
  if (typeof window === "undefined") {
    return;
  }

  window.open(CAMPUS_MAIL_URL, "_blank", "noopener,noreferrer");
}

export function contactAdminMail() {
  if (typeof window === "undefined") {
    return;
  }

  window.location.href = `mailto:${ADMIN_MAIL_ADDRESS}`;
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
    scene?: CaptchaFailureScene;
  },
) {
  const nextCount = getCaptchaSendFailureCount() + 1;
  setCaptchaSendFailureCount(nextCount);

  const fallbackDescription = options?.defaultDescription ?? "验证码发送失败，请稍后重试";
  const errorDescription =
    error instanceof Error && error.message.trim() ? error.message : fallbackDescription;

  const failureFeedback = resolveCaptchaFailureFeedback(
    errorDescription,
    nextCount >= CAPTCHA_SEND_FAILURE_THRESHOLD,
    options?.title,
    options?.scene,
  );

  feedback.error({
    title: failureFeedback.title,
    description: failureFeedback.description,
    duration: 0,
    actionLabel: failureFeedback.actionLabel,
    onAction: failureFeedback.onAction,
    dismissOnAction: false,
  });

  return failureFeedback.description;
}

function resolveCaptchaFailureFeedback(
  message: string,
  hasRepeatedFailures: boolean,
  customTitle?: string,
  scene?: CaptchaFailureScene,
): CaptchaFailureFeedback {
  const normalizedMessage = message.toLowerCase();

  if (isUnregisteredMailboxError(normalizedMessage)) {
    return {
      kind: "unregistered_mailbox",
      title: customTitle ?? "暂时收不到验证码",
      description:
        "这个校园邮箱暂时还收不到验证码。可以先确认邮箱是否已经开通，再稍后重试。",
      actionLabel: "打开校园邮箱",
      onAction: openCampusMail,
    };
  }

  if (isCampusMailboxPendingActivationError(normalizedMessage)) {
    return {
      kind: "campus_mailbox_pending_activation",
      title: customTitle ?? "校园邮箱暂不可用",
      description: getPendingActivationDescription(scene),
      actionLabel: "改用 QQ 登录",
      onAction: () => {
        if (typeof window === "undefined") {
          return;
        }
        window.location.href = "/login";
      },
    };
  }

  if (isSenderIssueError(normalizedMessage)) {
    return {
      kind: "sender_issue",
      title: customTitle ?? "验证码暂时发不出去",
      description:
        `现在发送验证码的人有点多，邮件通道有些忙。你可以稍后再试；如果一直不成功，再联系管理员 ${ADMIN_MAIL_ADDRESS}。`,
      actionLabel: `联系管理员 ${ADMIN_MAIL_ADDRESS}`,
      onAction: contactAdminMail,
    };
  }

  if (hasRepeatedFailures) {
    return {
      kind: "contact_admin",
      title: customTitle ?? "验证码发送失败",
      description:
        `试了几次还是没有成功。如果你确认校园邮箱已经开通，可以联系管理员 ${ADMIN_MAIL_ADDRESS} 帮你看一下。`,
      actionLabel: `联系管理员 ${ADMIN_MAIL_ADDRESS}`,
      onAction: contactAdminMail,
    };
  }

  return {
    kind: "contact_admin",
    title: customTitle ?? "验证码发送失败",
    description: `${message}。如果持续失败，请联系管理员 ${ADMIN_MAIL_ADDRESS}。`,
    actionLabel: `联系管理员 ${ADMIN_MAIL_ADDRESS}`,
    onAction: contactAdminMail,
  };
}

function getPendingActivationDescription(scene?: CaptchaFailureScene) {
  switch (scene) {
    case "bind_email":
      return "这个校园邮箱可能刚开通不久，系统暂时还收不到验证码。建议先等 1 小时左右再来绑定；如果着急使用，也可以先用 QQ 登录，稍后再到账号里绑定校园邮箱。";
    case "forget_password":
      return "这个校园邮箱可能刚开通不久，暂时还收不到验证码。建议先等 1 小时左右，等邮箱生效后再找回密码；如果你原本是用 QQ 登录的，也可以先用 QQ 登录。";
    case "reset_password":
      return "这个校园邮箱可能刚开通不久，暂时还收不到验证码。建议先等 1 小时左右再试；如果当前账号支持 QQ 登录，也可以先用 QQ 登录，之后再绑定校园邮箱。";
    case "register":
    default:
      return "这个校园邮箱可能刚开通不久，暂时还收不到验证码。建议先等 1 小时左右再试；如果你想先进入系统，也可以先用 QQ 登录，之后再绑定校园邮箱。";
  }
}

function isUnregisteredMailboxError(message: string) {
  return (
    message.includes("用户不存在") ||
    message.includes("请先注册") ||
    message.includes("邮箱未注册") ||
    message.includes("邮箱不存在") ||
    message.includes("mailbox not found") ||
    message.includes("user not found")
  );
}

function isCampusMailboxPendingActivationError(message: string) {
  return (
    message.includes("注册时间是否已满1小时") ||
    message.includes("请先采用qq登录") ||
    message.includes("1小时后在账号内进行邮箱绑定") ||
    message.includes("campus mailbox not found")
  );
}

function isSenderIssueError(message: string) {
  return (
    message.includes("smtp") ||
    message.includes("auth") ||
    message.includes("535") ||
    message.includes("554") ||
    message.includes("mail from") ||
    message.includes("rcpt") ||
    message.includes("dial tcp") ||
    message.includes("connection refused") ||
    message.includes("timeout") ||
    message.includes("tls") ||
    message.includes("发件") ||
    message.includes("邮件发送") ||
    message.includes("验证码邮件") ||
    message.includes("no smtp providers configured")
  );
}
