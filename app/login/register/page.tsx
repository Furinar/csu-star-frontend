"use client";
import React, {useEffect, useMemo, useState} from "react";
import Stepper, {Step} from "@/components/ui/Stepper";
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
    return true;
  };

  const handleFinalStepCompleted = async () => {
    if (!registerPayload) return;
    try {
      await registerByEmail({
        email: registerPayload.email,
        password: registerPayload.password,
        nickname: nickname.trim(),
        invite_code: inviteCode.trim(),
      });

      sessionStorage.removeItem("registerPayload");
      feedback.success({ title: "注册完成" });
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
