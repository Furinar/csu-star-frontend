"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginByOAuth } from "@/api/auth";
import { bindOAuthAccount } from "@/api/me";
import { useAuthStore } from "@/store/useAuthStore";
import {
  type OAuthContext,
  OAUTH_CONTEXT_STORAGE_KEY,
} from "@/lib/oauth";
import { type OAuthBindProvider } from "@/types/me";

export default function CallBack() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const [loginType, setLoginType] = useState<"idle" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("麻烦返回重试一下哦");
  const hasTriedLoginRef = useRef(false);

  useEffect(() => {
    const executeAction = async () => {
      if (hasTriedLoginRef.current) return;
      hasTriedLoginRef.current = true;

      const rawContext = localStorage.getItem(OAUTH_CONTEXT_STORAGE_KEY);
      const context = rawContext
        ? (JSON.parse(rawContext) as OAuthContext)
        : null;

      const showError = (message: string) => {
        localStorage.removeItem(OAUTH_CONTEXT_STORAGE_KEY);
        setErrorMessage(message);
        setLoginType("error");
      };

      try {
        if (error) {
          showError(errorDescription || "授权已取消或提供方返回错误");
          return;
        }

        if (!code || !state || !context || state !== context.state) {
          router.push("/login/illegal");
          return;
        }

        if (context.action !== "bind" && !context.codeVerifier) {
          showError("授权信息已过期，请重新发起第三方登录");
          return;
        }

        localStorage.removeItem(OAUTH_CONTEXT_STORAGE_KEY);

        if (context.action === "bind") {
          await bindOAuthAccount({
            provider: context.platform as OAuthBindProvider,
            code,
          });
          router.replace("/me");
        } else {
          const result = await loginByOAuth(context.platform, code, {
            code_challenge: context.codeChallenge,
            code_verifier: context.codeVerifier,
          });
          const data = result.data;
          login(
            data.access_token,
            data.refresh_token ?? null,
            data.user ?? null,
          );
          router.replace("/home");
        }
      } catch (authError) {
        setErrorMessage(
          authError instanceof Error && authError.message.trim()
            ? authError.message
            : "操作失败，请稍后再试",
        );
        setLoginType("error");
      }
    };

    void executeAction();
  }, [code, error, errorDescription, state, router, login]);

  const getPageConfig = () => {
    switch (loginType) {
      case "idle":
        return {
          title: "正在为你接通南极星",
          desc: "稍等片刻，马上就能开启新旅程啦",
        };
      case "error":
        return {
          title: "哎呀，授权出了点小问题",
          desc: errorMessage,
        };
      default:
        return {
          title: "正在处理",
          desc: "稍等片刻...",
        };
    }
  };

  const { title, desc } = getPageConfig();

  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white shadow-xl rounded-2xl max-w-md w-full">
        <p className="text-3xl font-bold hero-gradient-text mb-4">{title}</p>
        <p className="text-gray-600">{desc}</p>
      </div>
    </div>
  );
}
