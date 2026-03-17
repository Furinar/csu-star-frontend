"use client";
import Stepper, { Step } from "@/components/ui/Stepper";
import ThemeToggleButton from "../components/ThemeToggleButton";
import { avatarOptions } from "@/data/avatar";

export default function Register() {
  return (
    <>
      <ThemeToggleButton />
      <div className="flex min-h-svh items-center justify-center">
        <Stepper initialStep={1} backButtonText="Back" nextButtonText="Next">
          <Step>
            <h2>欢迎湖南唯一985的天选之子来到 南极星</h2>
            <p>
              点击 <strong>Next</strong> 开始补充个人信息
            </p>
          </Step>

          <Step>
            <h2>取个名字吧!</h2>

            <input
              type="text"
              placeholder="username"
              className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
            />
          </Step>

          <Step>
            <h2>挑个头像吧!</h2>
            <div className="w-full h-60 mt-2 overflow-y-auto rounded-lg">
              <div
                className="flex flex-wrap content-between
               items-center border-gray-200 border-5 justify-between gap-3 p-4"
              >
                {avatarOptions.map((avatar, index) => (
                  <img
                    key={index}
                    src={avatar.url}
                    alt="Avatar"
                    className="h-16 w-16 rounded-full object-cover hover:-translate-y-1 cursor-pointer transition-transform duration-200 border-1 border-transparent hover:border-(--color-first)"
                  />
                ))}
              </div>
            </div>
          </Step>

          <Step>
            <h2>有没有邀请码呢?</h2>
            <p className="text-sm text-gray-500">没有可以跳过</p>
            <input
              type="text"
              placeholder="invite code (optional)"
              className="bg-gray-200 py-2 pl-3 mt-3 mb-2 rounded-2xl  focus:outline-none focus:ring-2 focus:ring-(--color-first) w-full"
            />
          </Step>

          <Step>
            <h2>注册完成!</h2>
            <p>
              点击 <strong>Complete</strong> 进入南极星
            </p>
          </Step>
        </Stepper>
      </div>
    </>
  );
}
