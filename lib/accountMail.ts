"use client";

import { feedback } from "@/store/useFeedbackStore";
import { isCampusEmail } from "@/lib/email";

export const CAMPUS_MAIL_URL = "https://mail.csu.edu.cn/";
export const ADMIN_MAIL_ADDRESS = "csustar@foxmail.com";
const CAPTCHA_SEND_FAILURE_STORAGE_KEY = "account-mail-captcha-send-failure-count";
const CAPTCHA_SEND_FAILURE_THRESHOLD = 3;

type CaptchaFailureKind =
  | "unregistered_mailbox"
  | "sender_issue"
  | "contact_admin";

type CaptchaScene =
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

/**
 * 验证码发送成功的提示。
 *
 * 「打开校园邮箱」这个动作只在收件地址确实是校园邮箱时才出现——
 * 邮箱放开后，给填 QQ 邮箱的用户弹一个中南邮箱入口只会让人困惑。
 */
export function showCaptchaSentFeedback(description: string, email?: string) {
  resetCaptchaSendFailureCount();

  const showCampusEntry = Boolean(email && isCampusEmail(email));
  // Persistent + optional action → Notification (auto-upgraded by feedback layer).
  feedback.success({
    title: "验证码已发送",
    description,
    duration: 0,
    ...(showCampusEntry
      ? { actionLabel: "打开校园邮箱", onAction: openCampusMail }
      : {}),
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
    scene?: CaptchaScene;
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
  );

  // Long body + action footer → Notification; keep open after mailto/nav clicks.
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
): CaptchaFailureFeedback {
  const normalizedMessage = message.toLowerCase();

  if (isAlreadyRegisteredError(normalizedMessage)) {
    return {
      kind: "unregistered_mailbox",
      title: customTitle ?? "该邮箱已注册",
      description:
        "该邮箱已注册过账号，请直接登录。如果忘记密码，可以使用找回密码功能。",
      actionLabel: "去登录",
      onAction: () => {
        if (typeof window === "undefined") {
          return;
        }
        window.location.href = "/login";
      },
    };
  }

  if (isUnregisteredMailboxError(normalizedMessage)) {
    return {
      kind: "unregistered_mailbox",
      title: customTitle ?? "邮箱可能填写有误",
      description:
        "这个邮箱还没有注册过账号。请确认地址填写无误，或先完成注册。",
      actionLabel: "去注册",
      onAction: () => {
        if (typeof window === "undefined") {
          return;
        }
        window.location.href = "/login?type=true";
      },
    };
  }

  if (isDomainNotAllowedError(normalizedMessage)) {
    return {
      kind: "contact_admin",
      title: customTitle ?? "该邮箱暂不支持",
      description: `${message}。可以换一个常用邮箱重试，或联系管理员 ${ADMIN_MAIL_ADDRESS}。`,
      actionLabel: `联系管理员 ${ADMIN_MAIL_ADDRESS}`,
      onAction: contactAdminMail,
    };
  }

  if (isSenderIssueError(normalizedMessage)) {
    return {
      kind: "sender_issue",
      title: customTitle ?? "发件通道暂时异常",
      description:
        `验证码发送失败，当前更像是发件通道异常而非你的邮箱有问题。请稍后重试，或联系管理员 ${ADMIN_MAIL_ADDRESS}。`,
      actionLabel: `联系管理员 ${ADMIN_MAIL_ADDRESS}`,
      onAction: contactAdminMail,
    };
  }

  if (hasRepeatedFailures) {
    return {
      kind: "contact_admin",
      title: customTitle ?? "验证码发送失败",
      description:
        `多次发送仍未成功。若你确认邮箱地址无误，可能是发件通道异常，请联系管理员 ${ADMIN_MAIL_ADDRESS} 处理。`,
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

function isAlreadyRegisteredError(message: string) {
  return message.includes("已注册") || message.includes("already registered");
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

// 对应后端 1019 EmailDomainNotAllowedErr 与 1024 InvalidEmailFormatErr 的文案。
function isDomainNotAllowedError(message: string) {
  return (
    message.includes("暂不支持") ||
    message.includes("邮箱格式不正确")
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
    message.includes("没有配置可用的邮件通道")
  );
}
