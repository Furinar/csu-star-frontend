"use client";

import { useState } from "react";
import { bindCampusEmail, sendCampusEmailCaptcha } from "@/api/me";
import { AdvancedInput } from "@/components/ui/AdvancedFormControls";
import { feedback } from "@/store/useFeedbackStore";
import {
  showCaptchaSendFailureFeedback,
  showCaptchaSentFeedback,
} from "@/lib/accountMail";
import type { UserProfile } from "@/types/auth";
import type { EmailStatus, MeDashboardData } from "@/types/me";
import CaptchaCodeField from "../CaptchaCodeField";
import {
  type AccountMode,
  PANEL_PRIMARY_BUTTON_CLASS_NAME,
  PANEL_SECONDARY_BUTTON_CLASS_NAME,
  getAccountPresentation,
  getErrorMessage,
  isValidEmail,
  normalizeEmail,
} from "../shared/helpers";

export default function EmailPanel({
  profile,
  emailStatus,
  accountMode,
  onClose,
  onEmailVerified,
}: {
  profile: UserProfile;
  emailStatus: EmailStatus;
  accountMode: AccountMode;
  onClose: () => void;
  onEmailVerified: (
    nextProfile: UserProfile,
    updater: (current: MeDashboardData | null) => MeDashboardData | null,
  ) => void;
}) {
  const [form, setForm] = useState({
    email: emailStatus.email ?? profile.email ?? "",
    captcha: "",
  });
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const accountPresentation = getAccountPresentation(
    accountMode,
    emailStatus,
    profile,
  );
  const isVerified = Boolean(
    emailStatus.email_verified || profile.email_verified,
  );

  const handleSendCode = async () => {
    if (isVerified) {
      feedback.info({
        title: "邮箱已认证",
        description: "当前账号已经完成邮箱认证。",
      });
      return;
    }

    const email = normalizeEmail(form.email);
    if (!email) {
      feedback.warning({
        title: "请输入邮箱",
        description: "请填写完整的邮箱地址，如 xxx@qq.com。",
      });
      return;
    }

    if (!isValidEmail(email)) {
      feedback.warning({
        title: "邮箱格式不正确",
        description: "请填写完整且格式正确的邮箱地址。",
      });
      return;
    }

    setIsSendingCode(true);
    try {
      const message = await sendCampusEmailCaptcha(email, "bind_email");
      setForm((current) => ({
        ...current,
        email,
      }));
      showCaptchaSentFeedback(message, email);
    } catch (error) {
      showCaptchaSendFailureFeedback(error, {
        title: "发送失败",
        defaultDescription: getErrorMessage(error, "请检查邮箱后重试"),
        scene: "bind_email",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (isVerified) {
      onClose();
      return;
    }

    const email = normalizeEmail(form.email);
    if (!email || !form.captcha.trim()) {
      feedback.warning({
        title: "信息不完整",
        description: "请先填写邮箱并输入收到的验证码。",
      });
      return;
    }

    if (!isValidEmail(email)) {
      feedback.warning({
        title: "邮箱格式不正确",
        description: "请确认邮箱地址填写正确后重试。",
      });
      return;
    }

    setIsVerifying(true);
    try {
      await bindCampusEmail({
        email,
        captcha: form.captcha.trim(),
      });

      const nextProfile = {
        ...profile,
        email,
        email_verified: true,
        free_download_count: null,
      };

      onEmailVerified(nextProfile, (current) =>
        current
          ? {
              ...current,
              profile: nextProfile,
              emailStatus: {
                email,
                email_verified: true,
                free_download_count: null,
              },
            }
          : current,
      );
      onClose();
      feedback.success({
        title: "邮箱认证完成",
        description: "你的个人中心已切换为校园认证状态。",
      });
    } catch (error) {
      feedback.error({
        title: "验证失败",
        description: getErrorMessage(error, "验证码无效或已过期"),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="td-me-hint">
        当前状态：{accountPresentation.badge}。{accountPresentation.hint}
      </p>

      <AdvancedInput
        label="邮箱"
        placeholder="填写你的邮箱地址"
        autoComplete="email"
        value={form.email}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            email: event.target.value,
          }))
        }
      />

      <CaptchaCodeField
        value={form.captcha}
        onChange={(captcha) =>
          setForm((current) => ({
            ...current,
            captcha,
          }))
        }
        onSend={() => {
          handleSendCode().catch(console.error);
        }}
        sending={isSendingCode}
        disabled={isVerifying || isVerified}
        doneLabel={isVerified ? "已完成认证" : undefined}
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSendingCode || isVerifying}
          className={PANEL_SECONDARY_BUTTON_CLASS_NAME}
        >
          取消
        </button>
        <button
          type="button"
          onClick={() => {
            handleVerify().catch(console.error);
          }}
          disabled={isVerifying || isSendingCode}
          className={PANEL_PRIMARY_BUTTON_CLASS_NAME}
        >
          {isVerified ? "完成" : isVerifying ? "正在认证..." : "完成认证"}
        </button>
      </div>
    </div>
  );
}
