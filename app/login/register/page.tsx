/* eslint-disable @next/next/no-img-element */
"use client";
import React, {useEffect, useMemo, useState} from "react";
import Stepper, {Step} from "@/components/ui/Stepper";
import {avatarOptions} from "@/data/avatar";
import {useRouter, useSearchParams} from "next/navigation";
import {registerByEmail} from "@/api/auth";
import {feedback} from "@/store/useFeedbackStore";
import {useHasMounted} from "@/hooks/useHasMounted";

type RegisterPayload = {
  email: string;
  password: string;
};

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const registerPayload = useMemo<RegisterPayload | null | undefined>(() => {
    if (!hasMounted) {
      return undefined;
    }

    const payloadStr = sessionStorage.getItem("registerPayload");
    if (!payloadStr) {
      return null;
    }

    try {
      const payload = JSON.parse(payloadStr) as Partial<RegisterPayload>;
      if (
          typeof payload.email !== "string" ||
          typeof payload.password !== "string" ||
          !payload.email ||
          !payload.password
      ) {
        return null;
      }
      return {
        email: payload.email,
        password: payload.password,
      };
    } catch {
      return null;
    }
  }, [hasMounted]);

  const [nickname, setNickname] = useState("");
  const [avatarMode, setAvatarMode] = useState<"preset" | "custom">("preset");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [inviteCode, setInviteCode] = useState(
      () => searchParams.get("invite_code")?.trim() ?? "",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!hasMounted || registerPayload !== null) {
      return;
    }
    router.replace("/login/illegal");
  }, [hasMounted, registerPayload, router]);

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
      if (avatarMode === "preset") {
        if (avatarIndex < 0 || avatarIndex >= avatarOptions.length) {
          setErrorMessage("请选择一个可用的头像");
          return false;
        }
      } else {
        if (!customAvatarUrl.trim()) {
          setErrorMessage("请输入头像URL");
          return false;
        }
        try {
          new URL(customAvatarUrl);
        } catch {
          setErrorMessage("请输入有效的URL");
          return false;
        }
      }
    }
    return true;
  };

  const handleFinalStepCompleted = async () => {
    if (!registerPayload) return;
    try {
      const finalAvatarUrl =
          avatarMode === "preset"
              ? avatarOptions[avatarIndex].url
              : customAvatarUrl.trim();

      await registerByEmail({
        email: registerPayload.email,
        password: registerPayload.password,
        nickname: nickname.trim(),
        avatar_url: finalAvatarUrl,
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

  if (!hasMounted || registerPayload === undefined || registerPayload === null) {
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
              className="absolute left-5 top-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white cursor-pointer"
          >
            <i className="uil uil-arrow-left text-base"/>
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
              <p className="text-sm text-gray-500 mt-1">
                如需个性化头像,请在注册后绑定第三方平台账号.
              </p>

              <div className="flex gap-4 mt-3 mb-2 border-b border-gray-200">
                <button
                    type="button"
                    className={`pb-2 text-sm font-medium transition-colors ${
                        avatarMode === "preset"
                            ? "border-b-2 border-(--color-first) text-(--color-first)"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setAvatarMode("preset")}
                >
                  预设头像
                </button>
                <button
                    type="button"
                    className={`pb-2 text-sm font-medium transition-colors ${
                        avatarMode === "custom"
                            ? "border-b-2 border-(--color-first) text-(--color-first)"
                            : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setAvatarMode("custom")}
                >
                  手动输入 URL
                </button>
              </div>

              {avatarMode === "preset" ? (
                  <div className="w-full h-60 mt-2 overflow-y-auto rounded-lg">
                    <div
                        className="flex flex-wrap content-between items-center border-gray-200 border-5 justify-between gap-3 p-4">
                      {avatarOptions.map((avatar, index) => (
                          <img
                              key={index}
                              src={avatar.url}
                              alt="Avatar"
                              onClick={() => setAvatarIndex(index)}
                              className={`h-16 w-16 rounded-full object-cover hover:-translate-y-1 cursor-pointer transition-transform duration-200 border-2 ${
                                  avatarIndex === index
                                      ? "border-(--color-first)"
                                      : "border-transparent"
                              } hover:border-(--color-first)`}
                          />
                      ))}
                    </div>
                  </div>
              ) : (
                  <div className="w-full h-60 mt-2 flex flex-col pt-2">
                    <input
                        type="text"
                        placeholder="https://..."
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className="bg-gray-100 py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full transition border border-gray-200"
                    />
                    <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100/50">
                      <p className="text-sm text-gray-600">
                        你可以使用图床服务上传图片并获取链接：
                      </p>
                      <a
                          href="https://img.scdn.io/"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center mt-2 text-sm text-(--color-first) hover:underline"
                      >
                        <i className="uil uil-external-link-alt mr-1"></i>
                        前往推荐图床上传
                      </a>
                    </div>
                  </div>
              )}

              {errorMessage && (
                  <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
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
