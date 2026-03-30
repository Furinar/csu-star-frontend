"use client";

import { useState } from "react";
import { bindOAuthAccount } from "@/api/me";
import { feedback } from "@/store/useFeedbackStore";
import type { OAuthBindProvider } from "@/types/me";
import {
  type AccountMode,
  FORM_TEXTAREA_CLASS_NAME,
  getErrorMessage,
} from "../shared/helpers";

export default function OAuthPanel({
  accountMode,
  onClose,
  onOAuthBound,
}: {
  accountMode: AccountMode;
  onClose: () => void;
  onOAuthBound: (provider: OAuthBindProvider) => void;
}) {
  const [form, setForm] = useState({
    provider: "qq" as OAuthBindProvider,
    code: "",
  });
  const [providers, setProviders] = useState<OAuthBindProvider[]>([]);
  const [isBinding, setIsBinding] = useState(false);

  const providerLabel = form.provider === "qq" ? "QQ" : "微信";

  const handleBind = async () => {
    const code = form.code.trim();

    if (!code) {
      feedback.warning({
        title: "请填写授权码",
        description: "当前接口需要 provider 与 code 两个字段完成绑定。",
      });
      return;
    }

    if (code.length < 6) {
      feedback.warning({
        title: "授权码长度异常",
        description: "请粘贴完整授权码后再提交。",
      });
      return;
    }

    setIsBinding(true);
    try {
      const result = await bindOAuthAccount({
        provider: form.provider,
        code,
      });

      setProviders((current) =>
        current.includes(result.provider)
          ? current
          : [...current, result.provider],
      );
      setForm((current) => ({
        ...current,
        code: "",
      }));
      onOAuthBound(result.provider);
      feedback.success({
        title: "第三方账号已绑定",
        description: `${result.provider === "qq" ? "QQ" : "微信"} 已可用于快捷登录，可继续绑定其他方式。`,
      });
    } catch (error) {
      feedback.error({
        title: "绑定失败",
        description: getErrorMessage(error, "请检查授权码后重试"),
      });
    } finally {
      setIsBinding(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "qq" as OAuthBindProvider, label: "QQ" },
            { key: "wechat" as OAuthBindProvider, label: "微信" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  provider: item.key,
                }))
              }
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                form.provider === item.key
                  ? "bg-first text-white"
                  : "border border-gray-200/70 bg-white/50 text-gray-600 hover:bg-white/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-200/70 bg-white/55 px-4 py-3 text-sm text-gray-600">
          {accountMode === "oauth_pending_email"
            ? "当前账户已经是第三方登录态，继续绑定可补齐更多快捷登录方式。"
            : "如果后端返回授权码，可直接在这里完成绑定，无需跳转到独立设置页。"}
          {providers.length > 0 ? (
            <p className="mt-2">
              已成功绑定：
              {providers
                .map((item) => (item === "qq" ? "QQ" : "微信"))
                .join(" / ")}
            </p>
          ) : null}
        </div>
        <label className="space-y-2 text-sm text-gray-600">
          <span>OAuth 授权码</span>
          <textarea
            className={FORM_TEXTAREA_CLASS_NAME}
            placeholder={`将 ${providerLabel} 对应的 code 粘贴到这里`}
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                code: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isBinding}
          className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleBind}
          disabled={isBinding}
          className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBinding ? "绑定中..." : "确认绑定"}
        </button>
      </div>
    </>
  );
}
