"use client";

import { useState } from "react";
import { bindCampusEmail, sendCampusEmailCaptcha } from "@/api/me";
import { AdvancedInput } from "@/app/(features)/resource/components/AdvancedFormControls";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import { feedback } from "@/store/useFeedbackStore";
import { showCaptchaSentFeedback } from "@/lib/campusMail";
import type { UserProfile } from "@/types/auth";
import type { EmailStatus, MeDashboardData } from "@/types/me";
import {
  type AccountMode,
  PANEL_PRIMARY_BUTTON_CLASS_NAME,
  PANEL_SECONDARY_BUTTON_CLASS_NAME,
  getAccountPresentation,
  getErrorMessage,
  isCampusEmail,
  toCampusEmail,
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
  const isVerified = Boolean(emailStatus.email_verified || profile.email_verified);

  const handleSendCode = async () => {
    if (isVerified) {
      feedback.info({
        title: "校园邮箱已认证",
        description: "当前账号已经完成校园邮箱认证。",
      });
      return;
    }

    const email = toCampusEmail(form.email);
    if (!email) {
      feedback.warning({
        title: "请输入校园邮箱",
        description: "支持直接填写邮箱前缀，系统会自动补全为 `@csu.edu.cn`。",
      });
      return;
    }

    if (!isCampusEmail(email)) {
      feedback.warning({
        title: "仅支持校园邮箱",
        description: "请使用 `@csu.edu.cn` 结尾的邮箱地址。",
      });
      return;
    }

    setIsSendingCode(true);
    try {
      const message = await sendCampusEmailCaptcha(email);
      setForm((current) => ({
        ...current,
        email,
      }));
      showCaptchaSentFeedback(message);
    } catch (error) {
      feedback.error({
        title: "发送失败",
        description: getErrorMessage(error, "请检查邮箱后重试"),
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

    const email = toCampusEmail(form.email);
    if (!email || !form.captcha.trim()) {
      feedback.warning({
        title: "信息不完整",
        description: "请先填写邮箱并输入收到的验证码。",
      });
      return;
    }

    if (!isCampusEmail(email)) {
      feedback.warning({
        title: "邮箱格式不正确",
        description: "请确认邮箱为 `@csu.edu.cn` 后重试。",
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
        title: "校园邮箱认证完成",
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
    <>
      <div className="space-y-4">
        <div
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${accountPresentation.badgeClassName}`}
        >
          当前状态：{accountPresentation.badge}。{accountPresentation.hint}
        </div>

        <AdvancedInput
          label="校园邮箱"
          placeholder="填写你的校园邮箱或前缀"
          autoComplete="email"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
        />

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <AdvancedInput
            label="验证码"
            placeholder="请输入 6 位验证码"
            inputMode="numeric"
            maxLength={6}
            value={form.captcha}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                captcha: event.target.value,
              }))
            }
          />
          <div className="sm:mt-[3px]">
            <ActionSubmitButton
              defaultText={isVerified ? "已完成认证" : "获取验证码"}
              sentText="发送中..."
              isSent={isSendingCode}
              onClick={() => {
                handleSendCode().catch(console.error);
              }}
              disabled={isSendingCode || isVerifying || isVerified}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
    </>
  );
}
