"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTimer } from "@/hooks/useTimer";

export default function IllegalPage() {
  const router = useRouter();
  const { countdown, startTimer } = useTimer(5);

  useEffect(() => {
    startTimer(5);
  }, [startTimer]);

  useEffect(() => {
    if (countdown === 0) {
      router.push("/home");
    }
  }, [countdown, router]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white shadow-xl rounded-2xl">
        <h1 className="text-3xl font-bold text-red-500 mb-4">非法访问</h1>
        <p className="text-gray-600 mb-6">您未携带合法的表单参数进入此页面。</p>
        <p className="text-sm text-gray-400">
          将在{" "}
          <span className="text-(--color-first) font-bold">{countdown}</span>{" "}
          秒后返回首页...
        </p>
      </div>
    </div>
  );
}
