"use client";

import CryptoJS from "crypto-js";
import { useState } from "react";
import { recoverPwd, sendCaptcha } from "@/api/auth";
import { AdvancedInput } from "@/components/ui/AdvancedFormControls";
import { feedback } from "@/store/useFeedbackStore";
import {
  showCaptchaSendFailureFeedback,
  showCaptchaSentFeedback,
} from "@/lib/accountMail";
import CaptchaCodeField from "../CaptchaCodeField";
import {
  PANEL_PRIMARY_BUTTON_CLASS_NAME,
  PANEL_SECONDARY_BUTTON_CLASS_NAME,
  assertApiResponse,
  getErrorMessage,
  isValidEmail,
  normalizeEmail,
} from "../shared/helpers";

export default function PasswordPanel({
  initialEmail,
  emailLocked = false,
  onClose,
}: {
  initialEmail: string;
  emailLocked?: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    email: initialEmail,
    captcha: "",
    password: "",
    confirmPassword: "",
  });
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSendCode = async () => {
    const email = normalizeEmail(form.email);
    if (!email) {
      feedback.warning({
        title: "请先填写邮箱",
        description: "请填写用于接收验证码的邮箱地址。",
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
      const response = await sendCaptcha(email, "reset_password");
      assertApiResponse(response, "验证码发送失败");
      setForm((current) => ({
        ...current,
        email,
      }));
      showCaptchaSentFeedback("请前往邮箱查收后继续完成密码修改。", email);
    } catch (error) {
      showCaptchaSendFailureFeedback(error, {
        title: "发送失败",
        defaultDescription: getErrorMessage(error, "请稍后再试"),
        scene: "reset_password",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleReset = async () => {
    const email = normalizeEmail(form.email);
    if (!email || !form.captcha.trim() || !form.password.trim()) {
      feedback.warning({
        title: "信息不完整",
        description: "邮箱、验证码和新密码都不能为空。",
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

    if (form.password.trim().length < 8) {
      feedback.warning({
        title: "密码长度不足",
        description: "新密码至少需要 8 位。",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      feedback.warning({
        title: "两次输入不一致",
        description: "请确认新密码和确认密码保持一致。",
      });
      return;
    }

    setIsResetting(true);
    try {
      const response = await recoverPwd({
        email,
        password: CryptoJS.SHA256(form.password).toString(CryptoJS.enc.Hex),
        captcha: form.captcha.trim(),
      });
      assertApiResponse(response, "密码修改失败");
      onClose();
      feedback.success({
        title: "密码已更新",
        description: "下次登录请使用新的密码。",
      });
    } catch (error) {
      feedback.error({
        title: "修改失败",
        description: getErrorMessage(error, "请检查验证码后重试"),
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdvancedInput
        label="邮箱"
        placeholder={emailLocked ? "邮箱已绑定，不可修改" : "填写你的邮箱地址"}
        autoComplete="email"
        value={form.email}
        readOnly={emailLocked}
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
        disabled={isResetting}
      />

      <AdvancedInput
        type="password"
        label="新密码"
        placeholder="至少 8 位的新密码"
        minLength={8}
        autoComplete="new-password"
        value={form.password}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            password: event.target.value,
          }))
        }
      />

      <AdvancedInput
        type="password"
        label="确认新密码"
        placeholder="请再次输入新密码"
        minLength={8}
        autoComplete="new-password"
        value={form.confirmPassword}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            confirmPassword: event.target.value,
          }))
        }
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSendingCode || isResetting}
          className={PANEL_SECONDARY_BUTTON_CLASS_NAME}
        >
          取消
        </button>
        <button
          type="button"
          onClick={() => {
            handleReset().catch(console.error);
          }}
          disabled={isResetting || isSendingCode}
          className={PANEL_PRIMARY_BUTTON_CLASS_NAME}
        >
          {isResetting ? "正在修改..." : "确认修改"}
        </button>
      </div>
    </div>
  );
}
