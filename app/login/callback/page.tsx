"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTimer } from "@/hooks/useTimer";
import { loginByOAuth } from "@/api/auth";
import { bindOAuthAccount } from "@/api/me";
import { useAuthStore } from "@/store/useAuthStore";
import {
  type OAuthContext,
  type AuthPlatform,
  OAUTH_CONTEXT_STORAGE_KEY,
} from "@/lib/oauth";
import { type OAuthBindProvider } from "@/types/me";

export default function CallBack() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { countdown, startTimer } = useTimer(3);
  const login = useAuthStore((state) => state.login);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const [loginType, setLoginType] = useState<
    "idle" | "success" | "error" | "bind_success"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("麻烦返回重试一下哦");
  const [hasTriedLogin, setHasTriedLogin] = useState(false);

  useEffect(() => {
    if (hasTriedLogin) return;
    const rawContext = localStorage.getItem(OAUTH_CONTEXT_STORAGE_KEY);
    const context = rawContext
      ? (JSON.parse(rawContext) as OAuthContext)
      : null;

    if (error) {
      localStorage.removeItem(OAUTH_CONTEXT_STORAGE_KEY);
      setErrorMessage(errorDescription || "授权已取消或提供方返回错误");
      setLoginType("error");
      setHasTriedLogin(true);
      startTimer(3);
      return;
    }

    if (!code || !state || !context || state !== context.state) {
      router.push("/login/illegal");
      return;
    }

    localStorage.removeItem(OAUTH_CONTEXT_STORAGE_KEY);
    setHasTriedLogin(true);

    const executeAction = async () => {
      try {
        if (context.action === "bind") {
          await bindOAuthAccount({
            provider: context.platform as OAuthBindProvider,
            code,
          });
          setLoginType("bind_success");
        } else {
          const result = await loginByOAuth(context.platform, code, {
            code_challenge: context.codeChallenge,
          });
          const data = result.data;
          login(
            data.access_token,
            data.refresh_token ?? null,
            data.user ?? null,
          );
          setLoginType("success");
        }
      } catch (authError) {
        setErrorMessage(
          authError instanceof Error && authError.message.trim()
            ? authError.message
            : "操作失败，请稍后再试",
        );
        setLoginType("error");
      } finally {
        startTimer(3);
      }
    };

    executeAction();
  }, [
    code,
    error,
    errorDescription,
    state,
    router,
    login,
    startTimer,
    hasTriedLogin,
  ]);

  useEffect(() => {
    if (countdown === 0) {
      if (loginType === "bind_success") {
        router.push("/me");
      } else {
        router.push(loginType === "success" ? "/home" : "/login");
      }
    }
  }, [countdown, router, loginType]);

  const getPageConfig = () => {
    switch (loginType) {
      case "idle":
        return {
          title: "正在为你接通南极星",
          desc: "稍等片刻，马上就能开启新旅程啦",
        };
      case "success":
        return {
          title: "登陆成功！欢迎来到南极星",
          desc: "愿你在这里的每一段旅程都闪闪发光",
        };
      case "bind_success":
        return {
          title: "绑定成功！",
          desc: "已成功将该账号关联到你的南极星档案",
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
        <p className="text-gray-600 mb-6">{desc}</p>
        <p className="text-sm text-gray-400">
          {loginType === "idle" ? null : (
            <>
              <span className="text-(--color-first) font-bold">
                {countdown}
              </span>
              {loginType === "success"
                ? " 秒后带你奔赴首页~"
                : loginType === "bind_success"
                  ? " 秒后返回个人中心"
                  : " 秒后重新前往登录界面"}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
