"use client";

import { Button } from "tdesign-react";
import { AdvancedInput } from "@/components/ui/AdvancedFormControls";

/**
 * Captcha input grows; "获取验证码" stays right-aligned (TDesign Button).
 */
export default function CaptchaCodeField({
  value,
  onChange,
  onSend,
  sending = false,
  disabled = false,
  sendLabel = "获取验证码",
  sendingLabel = "发送中...",
  doneLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
  sendLabel?: string;
  sendingLabel?: string;
  /** When set (e.g. already verified), button shows this and stays disabled. */
  doneLabel?: string;
}) {
  const buttonText = doneLabel
    ? doneLabel
    : sending
      ? sendingLabel
      : sendLabel;

  return (
    <div className="td-me-captcha-row">
      <AdvancedInput
        className="td-form-field--grow min-w-0 flex-1"
        label="验证码"
        placeholder="请输入 6 位验证码"
        inputMode="numeric"
        maxLength={6}
        autoComplete="one-time-code"
        value={value}
        disabled={Boolean(doneLabel) || disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button
        theme="primary"
        variant="outline"
        size="medium"
        loading={sending && !doneLabel}
        disabled={disabled || Boolean(doneLabel) || sending}
        onClick={() => {
          if (doneLabel || sending || disabled) return;
          onSend();
        }}
        className="td-me-captcha-send"
      >
        {buttonText}
      </Button>
    </div>
  );
}
