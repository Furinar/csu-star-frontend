import Stepper, { Step } from "@/components/ui/Stepper";
import ThemeToggleButton from "../components/ThemeToggleButton";

export default function Forget() {
  return (
    <>
      <ThemeToggleButton />

      <div className="flex min-h-svh items-center justify-center">
        <Stepper>
          <Step>
            <h2>
              小朋友，你忘记密码了么？别担心，输入你的邮箱，我们会帮你找回密码的。
            </h2>
            <input
              type="text"
              placeholder="CSU Email"
              className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
            />
          </Step>

          <Step>
            <h2>验证邮件已发送！</h2>
            <p className="text-sm text-gray-500">请输入邮箱收到的验证码</p>
            <input
              type="text"
              placeholder="Check Code"
              className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
            />
          </Step>

          <Step>
            <h2>设置新密码</h2>
            <input
              type="password"
              placeholder="New Password"
              className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
            />
          </Step>
        </Stepper>
      </div>
    </>
  );
}
