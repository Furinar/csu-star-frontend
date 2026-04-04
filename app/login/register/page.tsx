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
  const [inviteCode, setInviteCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      if (avatarIndex < 0 || avatarIndex >= avatarOptions.length) {
        setErrorMessage("请选择一个可用的头像");
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
        avatar_url: avatarOptions[avatarIndex].url,
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
            <div className="w-full h-60 mt-2 overflow-y-auto rounded-lg">
              <div className="flex flex-wrap content-between items-center border-gray-200 border-5 justify-between gap-3 p-4">
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
