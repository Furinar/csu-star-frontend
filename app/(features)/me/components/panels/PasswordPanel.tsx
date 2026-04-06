"use client";

import CryptoJS from "crypto-js";
import { useState } from "react";
import { recoverPwd, sendCaptcha } from "@/api/auth";
import { AdvancedInput } from "@/app/(features)/resource/components/AdvancedFormControls";
import ActionSubmitButton from "@/components/ui/ActionSubmitButton";
import { feedback } from "@/store/useFeedbackStore";
import { showCaptchaSentFeedback } from "@/lib/campusMail";
import {
  PANEL_PRIMARY_BUTTON_CLASS_NAME,
  PANEL_SECONDARY_BUTTON_CLASS_NAME,
  assertApiResponse,
  getErrorMessage,
  isCampusEmail,
  toCampusEmail,
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
    const email = toCampusEmail(form.email);
    if (!email) {
      feedback.warning({
        title: "请先填写邮箱",
        description: "修改密码仍通过校园邮箱验证码完成。",
      });
      return;
    }

    if (!isCampusEmail(email)) {
      feedback.warning({
        title: "邮箱格式不正确",
        description: "请使用 `@csu.edu.cn` 校园邮箱接收验证码。",
      });
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await sendCaptcha(email);
      assertApiResponse(response, "验证码发送失败");
      setForm((current) => ({
        ...current,
        email,
      }));
      showCaptchaSentFeedback("请前往邮箱查收后继续完成密码修改。");
    } catch (error) {
      feedback.error({
        title: "发送失败",
        description: getErrorMessage(error, "请稍后再试"),
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleReset = async () => {
    const email = toCampusEmail(form.email);
    if (!email || !form.captcha.trim() || !form.password.trim()) {
      feedback.warning({
        title: "信息不完整",
        description: "邮箱、验证码和新密码都不能为空。",
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
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-6 text-slate-600">
          修改密码仍通过校园邮箱验证码完成。验证码发送后，请回到此处继续填写新密码。
        </div>

        <AdvancedInput
          label="校园邮箱"
          placeholder={emailLocked ? "校园邮箱已绑定，不可修改" : "填写你的校园邮箱或前缀"}
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

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
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
          <div className="mt-[3px]">
            <ActionSubmitButton
              defaultText="获取验证码"
              sentText="发送中..."
              isSent={isSendingCode}
              onClick={() => {
                handleSendCode().catch(console.error);
              }}
              disabled={isSendingCode || isResetting}
            />
          </div>
        </div>

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
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
    </>
  );
}
