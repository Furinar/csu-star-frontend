"use client";

import {useState} from "react";
import {bindCampusEmail, verifyCampusEmail} from "@/api/me";
import {feedback} from "@/store/useFeedbackStore";
import type {UserProfile} from "@/types/auth";
import type {EmailStatus, MeDashboardData} from "@/types/me";
import {
  type AccountMode,
  FORM_INPUT_CLASS_NAME,
  getAccountPresentation,
  getErrorMessage,
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
  onEmailVerified: (nextProfile: UserProfile, updater: (current: MeDashboardData | null) => MeDashboardData | null) => void;
}) {
  const [form, setForm] = useState({
    email: emailStatus.email ?? profile.email ?? "",
    captcha: "",
  });
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const accountPresentation = getAccountPresentation(accountMode, emailStatus, profile);

  const handleSendCode = async () => {
    const email = toCampusEmail(form.email);
    if (!email) {
      feedback.warning({
        title: "请输入校园邮箱",
        description: "支持直接填写邮箱前缀，系统会自动补全为 `@csu.edu.cn`。",
      });
      return;
    }

    setIsSendingCode(true);
    try {
      const message = await bindCampusEmail({email});
      setForm((current) => ({
        ...current,
        email,
      }));
      feedback.success({
        title: "验证码已发送",
        description: message,
      });
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
    const email = toCampusEmail(form.email);
    if (!email || !form.captcha.trim()) {
      feedback.warning({
        title: "信息不完整",
        description: "请先填写邮箱并输入收到的验证码。",
      });
      return;
    }

    setIsVerifying(true);
    try {
      await verifyCampusEmail({
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
              className={`rounded-2xl border px-4 py-3 text-sm ${accountPresentation.badgeClassName}`}
          >
            当前状态：{accountPresentation.badge}。{accountPresentation.hint}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-600 md:col-span-2">
              <span>校园邮箱</span>
              <input
                  className={FORM_INPUT_CLASS_NAME}
                  placeholder="填写邮箱前缀或完整邮箱"
                  value={form.email}
                  onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                  }
              />
            </label>
            <label className="space-y-2 text-sm text-gray-600">
              <span>验证码</span>
              <input
                  className={FORM_INPUT_CLASS_NAME}
                  placeholder="6 位验证码"
                  value={form.captcha}
                  onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        captcha: event.target.value,
                      }))
                  }
              />
            </label>
            <div className="flex items-end">
              <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode}
                  className="w-full rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingCode ? "发送中..." : "发送验证码"}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
          >
            取消
          </button>
          <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifying ? "验证中..." : "完成认证"}
          </button>
        </div>
      </>
  );
}
