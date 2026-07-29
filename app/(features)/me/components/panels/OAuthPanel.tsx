"use client";

import { useState } from "react";
import { feedback } from "@/store/useFeedbackStore";
import type { OAuthBindProvider } from "@/types/me";
import type { OAuthBindingStatus } from "@/types/auth";
import FaSvgIcon from "@/components/ui/FaSvgIcon";
import { type AccountMode, PANEL_SECONDARY_BUTTON_CLASS_NAME } from "../shared/helpers";
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
    <div className="space-y-4">
      <p className="td-me-hint">{syncHint}</p>
      {providers.length > 0 ? (
        <p className="text-sm font-medium text-first">
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

      <div className="flex flex-col gap-2">
        {/* 暂时注释 QQ 绑定
        <button
          type="button"
          onClick={() => handleOAuthBind("qq")}
          disabled={isBinding || Boolean(bindings?.qq)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#12b7f5] text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          <FaSvgIcon name="qq" className="text-lg" />
          {bindings?.qq ? "QQ 已绑定" : "绑定 QQ 账号"}
        </button>
        */}
        <button
          type="button"
          onClick={() => handleOAuthBind("github")}
          disabled={isBinding || Boolean(bindings?.github)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-gray-900 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          <FaSvgIcon name="github" className="text-lg" />
          {bindings?.github ? "GitHub 已绑定" : "绑定 GitHub 账号"}
        </button>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={isBinding}
          className={PANEL_SECONDARY_BUTTON_CLASS_NAME}
        >
          取消
        </button>
      </div>
    </div>
  );
}
