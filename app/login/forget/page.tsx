'use client'
import Stepper, {Step} from "@/components/ui/Stepper";
import {useState} from "react";
import {recoverPwd, sendCaptcha} from "@/api/auth";
import {useRouter} from "next/navigation";
import CryptoJS from "crypto-js";
import { showCaptchaSendFailureFeedback, showCaptchaSentFeedback } from "@/lib/accountMail";
import { isValidEmail, normalizeEmail } from "@/lib/email";

export default function Forget() {

  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [errorInfo, setErrorInfo] = useState("")
  const router = useRouter();
  const handleBeforeStepChange = async (currentStep: number) => {
    if (currentStep === 1) {
      if (email.trim() === "") {
        setErrorInfo("邮箱不能为空");
        return false;
      } else if (!isValidEmail(email)) {
        setErrorInfo("邮箱格式不正确，请检查后重试");
        return false;
      } else {
        setErrorInfo("");
        try {
          const normalized = normalizeEmail(email);
          await sendCaptcha(normalized, "forget_password");
          showCaptchaSentFeedback(`请查收 ${normalized} 的邮件。`, normalized);
          return true;
        } catch (err) {
          const errMsg = showCaptchaSendFailureFeedback(err, {
            title: "验证码发送失败",
            defaultDescription: "发送验证码失败，请重试",
            scene: "forget_password",
          });
          setErrorInfo(errMsg);
          return false;
        }
      }
    } else if (currentStep === 2) {
      if (captcha.trim() === "") {
        setErrorInfo("验证码不能为空");
        return false;
      }
      setErrorInfo("");
      return true;
    } else if (currentStep === 3) {
      if (pwd1.trim() === "" || pwd2.trim() === "") {
        setErrorInfo("密码不能为空");
        return false;
      } else if (pwd1.trim() !== pwd2.trim()) {
        setErrorInfo("两次密码不同,请检查");
        return false;
      }
      setErrorInfo("");
      const hashPwd = CryptoJS.SHA256(pwd1).toString(
          CryptoJS.enc.Hex
      );
      try {
        await recoverPwd({
          email: normalizeEmail(email),
          password: hashPwd,
          captcha: captcha.trim(),
        });
        return true;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "找回失败,请重试";
        setErrorInfo(errMsg);
        return false;
      }
    } else {
      return true;
    }
  }

  const handleComplete = () => {
    router.replace("/login");
  }
  return (
      <>
        <div className="flex min-h-svh items-center justify-center">
          <Stepper onBeforeStepChange={handleBeforeStepChange} disableStepIndicators={false}
                   onFinalStepCompleted={handleComplete}>
            <Step>
              <h2>
                小朋友，你忘记密码了么？别担心，输入你的邮箱，我们会帮你找回密码的。
              </h2>
              <input
                  type="text"
                  placeholder="邮箱地址"
                  className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
                  onChange={(e) => setEmail(e.target.value)}
              />
              {
                errorInfo === "" ? null : (
                    <span className="text-red-500">{errorInfo}</span>
                )
              }
            </Step>

            <Step>
              <h2>验证邮件已发送！</h2>
              <p className="text-sm text-gray-500">请输入邮箱收到的验证码</p>
              <input
                  type="text"
                  placeholder="Check Code"
                  className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
                  onChange={(e) => setCaptcha(e.target.value)}
              />
            </Step>

            <Step>
              <div className="flex justify-between">
                <h2>设置新密码</h2>
                <p className="text-red-500">
                  {errorInfo}
                </p>
              </div>
              <input
                  type="password"
                  placeholder="New Password"
                  className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
                  onChange={(e) => setPwd1(e.target.value)}
              />
              <input
                  type="password"
                  placeholder="Confirm Password"
                  className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
                  onChange={(e) => setPwd2(e.target.value)}
              />
            </Step>

            <Step>
              <h1>找回密码成功,点击 <strong>Complete</strong> 前往登录 <br/>下次别再忘记咯</h1>
            </Step>
          </Stepper>
        </div>
      </>
  );
}
