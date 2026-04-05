/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useState } from "react";
import Stepper, { Step } from "@/components/ui/Stepper";
import { avatarOptions } from "@/data/avatar";
import { useRouter, useSearchParams } from "next/navigation";
import { registerByEmail } from "@/api/auth";
import { feedback } from "@/store/useFeedbackStore";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [registerPayload, setRegisterPayload] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [nickname, setNickname] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedAvatarUrl =
    customAvatarUrl.trim() || avatarOptions[avatarIndex]?.url || "";

  useEffect(() => {
    const inviteCodeFromQuery = searchParams.get("invite_code")?.trim() ?? "";
    const payloadStr = sessionStorage.getItem("registerPayload");
    if (!payloadStr) {
      router.replace("/login/illegal");
      return;
    }
    try {
      const payload = JSON.parse(payloadStr);
      if (!payload.email || !payload.password) {
        router.replace("/login/illegal");
        return;
      }
      setRegisterPayload(payload);
      if (inviteCodeFromQuery) {
        setInviteCode(inviteCodeFromQuery);
      }
    } catch {
      router.replace("/login/illegal");
      return;
    }
    setIsVerifying(false);
  }, [router, searchParams]);

  const handleBeforeStepChange = async (
    currentStep: number,
  ): Promise<boolean> => {
    setErrorMessage("");
    if (currentStep === 2) {
      if (!nickname.trim()) {
        setErrorMessage("请填写昵称");
        return false;
      }
      if (nickname.trim().length > 20) {
        setErrorMessage("昵称最多不能超过20个字符");
        return false;
      }
    }
    if (currentStep === 3) {
      const trimmedAvatarUrl = customAvatarUrl.trim();
      if (trimmedAvatarUrl) {
        try {
          const parsed = new URL(trimmedAvatarUrl);
          if (!["http:", "https:"].includes(parsed.protocol)) {
            throw new Error("invalid protocol");
          }
        } catch {
          setErrorMessage("请输入有效的头像 URL");
          return false;
        }
      } else if (avatarIndex < 0 || avatarIndex >= avatarOptions.length) {
        setErrorMessage("请选择一个可用的头像，或手动输入 URL");
        return false;
      }
    }
    return true;
  };

  const handleFinalStepCompleted = async () => {
    if (!registerPayload) return;
    try {
      await registerByEmail({
        email: registerPayload.email,
        password: registerPayload.password,
        nickname: nickname.trim(),
        avatar_url: selectedAvatarUrl,
        invite_code: inviteCode.trim(),
      });

      sessionStorage.removeItem("registerPayload");
      feedback.success({
        title: "注册完成",
        description: "账号已创建，返回登录页。",
      });
      router.push("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "注册失败，请稍后重试";
      setErrorMessage(message);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/login");
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        正在验证环境...
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-svh flex-col items-center justify-center relative">
        <button
          type="button"
          onClick={handleBack}
          aria-label="返回上一页"
          className="absolute left-5 top-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <i className="uil uil-arrow-left text-base" />
        </button>
        <Stepper
          initialStep={1}
          backButtonText="Back"
          nextButtonText="Next"
          disableStepIndicators={true}
          onBeforeStepChange={handleBeforeStepChange}
          onFinalStepCompleted={handleFinalStepCompleted}
        >
          <Step>
            <h2>欢迎湖南唯一985的天选之子来到 CSU Star</h2>
            <p className="mt-2 text-gray-600">
              点击 <strong>Next</strong> 开始补充个人信息
            </p>
          </Step>

          <Step>
            <h2>取个名字吧!</h2>
            <input
              type="text"
              placeholder="username"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
            />
            {errorMessage && (
              <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
            )}
          </Step>

          <Step>
            <h2>挑个头像吧!</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="min-w-0">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="手动输入头像 URL（可选）"
                    value={customAvatarUrl}
                    onChange={(e) => {
                      setCustomAvatarUrl(e.target.value);
                      setAvatarPreviewError(false);
                    }}
                    className="w-full rounded-2xl bg-gray-200 py-2 pl-3 pr-3 focus:outline-none focus:ring-2 focus:ring-(--color-first)"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        "https://picui.cn/upload",
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    获取头像 URL
                  </button>
                </div>
                <div className="h-60 overflow-y-auto rounded-lg">
                  <div className="flex flex-wrap content-between items-center justify-between gap-3 border-gray-200 border-5 p-4">
                    {avatarOptions.map((avatar, index) => (
                      <img
                        key={index}
                        src={avatar.url}
                        alt={avatar.label || "Avatar"}
                        onClick={() => {
                          setAvatarIndex(index);
                          setAvatarPreviewError(false);
                        }}
                        className={`h-16 w-16 rounded-full object-cover transition-transform duration-200 hover:-translate-y-1 ${
                          !customAvatarUrl.trim() && avatarIndex === index
                            ? "border-(--color-first)"
                            : "border-transparent"
                        } cursor-pointer border-2 hover:border-(--color-first)`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-start rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-700">头像预览</p>
                <div className="mt-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-50">
                  {!avatarPreviewError && selectedAvatarUrl ? (
                    <img
                      src={selectedAvatarUrl}
                      alt="头像预览"
                      onError={() => setAvatarPreviewError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="px-4 text-center text-xs leading-5 text-slate-400">
                      {selectedAvatarUrl
                        ? "头像加载失败"
                        : "请选择头像或输入头像 URL"}
                    </div>
                  )}
                </div>
                <p className="mt-3 break-all text-center text-xs text-slate-500">
                  {customAvatarUrl.trim()
                    ? "当前使用手动输入 URL"
                    : avatarOptions[avatarIndex]?.label || "默认头像"}
                </p>
              </div>
            </div>
            {errorMessage && (
              <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
            )}
          </Step>

          <Step>
            <h2>有没有邀请码呢?</h2>
            <p className="text-sm text-gray-500">没有可以跳过</p>
            <input
              type="text"
              placeholder="invite code (optional)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
            />
          </Step>

          <Step>
            <h2>注册完成!</h2>
            <p className="mt-2 text-gray-600">
              点击 <strong>Complete</strong> 提交数据，返回登录页面
            </p>
            {errorMessage && (
              <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
            )}
          </Step>
        </Stepper>
      </div>
    </>
  );
}
