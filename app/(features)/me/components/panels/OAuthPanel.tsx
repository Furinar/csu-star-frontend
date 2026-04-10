"use client";

import { useState } from "react";
import { feedback } from "@/store/useFeedbackStore";
import type { OAuthBindProvider } from "@/types/me";
import type { OAuthBindingStatus } from "@/types/auth";
import FaSvgIcon from "@/components/ui/FaSvgIcon";
import { type AccountMode } from "../shared/helpers";
import {
  buildAuthUrl,
  createPkcePair,
  createOAuthState,
  OAUTH_CONTEXT_STORAGE_KEY,
  type AuthPlatform,
} from "@/lib/oauth";

export default function OAuthPanel({
  accountMode,
  bindings,
  onClose,
}: {
  accountMode: AccountMode;
  bindings?: OAuthBindingStatus | null;
  onClose: () => void;
}) {
  const [isBinding, setIsBinding] = useState(false);

  const providers = ([
    bindings?.qq ? "qq" : null,
    bindings?.github ? "github" : null,
    bindings?.google ? "google" : null,
  ].filter(Boolean) as OAuthBindProvider[]);
  const syncHint =
    accountMode === "oauth_pending_email"
      ? "绑定更多第三方账号后，你可以在不同设备上更方便地登录南极星。"
      : "绑定第三方账号后会自动同步该平台头像，后续通过 OAuth 登录时也会刷新为该平台当前头像。";

  const handleOAuthBind = async (platform: AuthPlatform) => {
    try {
      setIsBinding(true);

      const state = createOAuthState(platform);
      const { codeChallenge, codeVerifier } = await createPkcePair();

      const context = {
        state,
        platform,
        codeChallenge,
        codeVerifier,
        action: "bind" as const,
      };
      localStorage.setItem(OAUTH_CONTEXT_STORAGE_KEY, JSON.stringify(context));

      const isMobile =
        typeof window !== "undefined" &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const authUrl = buildAuthUrl(platform, state, codeChallenge, isMobile);
      window.location.assign(authUrl);
    } catch (error) {
      console.error(`${platform} 绑定初始化失败:`, error);
      setIsBinding(false);
      feedback.error({
        title: "暂时无法发起绑定",
        description: "请稍后重试",
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-sm text-gray-500 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02),inset_-2px_-2px_5px_rgba(255,255,255,0.5)]">
          <p>{syncHint}</p>
          {providers.length > 0 ? (
            <p className="mt-2 font-medium text-first">
              已成功绑定：
              {providers
                .map((item) => {
                  if (item === "qq") return "QQ";
                  if (item === "github") return "GitHub";
                  if (item === "google") return "Google";
                  return item;
                })
                .join(" / ")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 py-2">
          <button
            type="button"
            onClick={() => handleOAuthBind("qq")}
            disabled={isBinding || Boolean(bindings?.qq)}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-[#12b7f5] text-white font-medium hover:bg-[#0e9kcc] transition shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]"
          >
            <FaSvgIcon name="qq" className="text-lg" />
            {bindings?.qq ? "QQ 已绑定" : "绑定 QQ 账号"}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthBind("github")}
            disabled={isBinding || Boolean(bindings?.github)}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]"
          >
            <FaSvgIcon name="github" className="text-lg" />
            {bindings?.github ? "GitHub 已绑定" : "绑定 GitHub 账号"}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthBind("google")}
            disabled={isBinding || Boolean(bindings?.google)}
            className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-white text-gray-700 font-medium border border-gray-200 hover:bg-gray-50 transition shadow-[inset_0_-2px_4px_rgba(0,0,0,0.05)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            {bindings?.google ? "Google 已绑定" : "绑定 Google 账号"}
          </button>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isBinding}
          className="rounded-xl border border-gray-200/70 bg-white px-6 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
        >
          取消
        </button>
      </div>
    </>
  );
}
