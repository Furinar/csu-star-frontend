"use client";

import {useEffect} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {useTimer} from "@/hooks/useTimer";

export default function IllegalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {countdown, startTimer} = useTimer(5);

  const reason = searchParams.get("reason");
  const banSource = searchParams.get("ban_source");
  const banReason = searchParams.get("ban_reason");
  const banUntil = searchParams.get("ban_until");
  const violationCount = searchParams.get("violation_count");
  const permanent = searchParams.get("permanent") === "1";
  const isAdminBan = banSource === "admin";
  const isSystemBan = banSource === "system";

  const formattedBanUntil = (() => {
    if (!banUntil) return "";
    const date = new Date(banUntil);
    if (Number.isNaN(date.getTime())) return banUntil;
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  })();

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
          <p className="text-3xl font-bold text-red-500 mb-4">
            {reason === "banned" ? "账号已被限制" : "页面访问异常"}
          </p>
          {reason === "banned" ? (
            <div className="mb-6 space-y-2 text-sm text-gray-600">
              <p>
                {isAdminBan
                  ? "管理员已对当前账号执行封禁操作，请联系管理员了解详情。"
                  : isSystemBan
                    ? "系统检测到异常请求或上传行为，当前账号已被临时限制。"
                    : "当前账号已被限制，请稍后再试或联系管理员。"}
              </p>
              {isSystemBan && violationCount ? <p>累计违规次数：{violationCount}</p> : null}
              {banReason && <p>限制原因：{banReason}</p>}
              <p>解除时间：{permanent ? "永久封禁" : formattedBanUntil || "暂未提供"}</p>
            </div>
          ) : (
            <p className="text-gray-600 mb-6">当前页面链接可能已失效，我们将带你返回首页。</p>
          )}
          <p className="text-sm text-gray-400">
            将在{" "}
            <span className="text-(--color-first) font-bold">{countdown}</span>{" "}
            秒后返回首页...
          </p>
        </div>
      </div>
  );
}
