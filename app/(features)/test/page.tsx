"use client";

import { feedback } from "@/store/useFeedbackStore";

export default function FeedbackTestPage() {
  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-2">Feedback 分层测试</h1>
        <p className="text-sm text-[var(--text-color-secondary,#666)]">
          Message = 轻量操作反馈（顶栏）；Notification = 站内/系统通知（右上，可带操作）。
          带 action、常驻（duration:0）、或较长正文时，tone 助手会自动升级为 Notification。
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Message（短操作反馈）</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            className="px-4 py-2 bg-emerald-500 text-white rounded"
            onClick={() =>
              feedback.success({
                title: "操作成功",
                description: "设置已保存。",
              })
            }
          >
            Success Message
          </button>
          <button
            className="px-4 py-2 bg-rose-500 text-white rounded"
            onClick={() =>
              feedback.error({
                title: "操作失败",
                description: "请稍后重试。",
              })
            }
          >
            Error Message
          </button>
          <button
            className="px-4 py-2 bg-amber-500 text-white rounded"
            onClick={() =>
              feedback.warning({
                title: "请先登录",
                description: "登录后即可继续操作。",
              })
            }
          >
            Warning Message
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() =>
              feedback.info({
                title: "邮箱验证通过",
                description: "继续补充资料。",
              })
            }
          >
            Info Message
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          自动升级 → Notification（action / 常驻 / 长文）
        </h2>
        <div className="flex gap-3 flex-wrap">
          <button
            className="px-4 py-2 bg-slate-600 text-white rounded"
            onClick={() =>
              feedback.success({
                title: "验证码已发送",
                description: "请查收邮件，验证码 10 分钟内有效。",
                duration: 0,
                actionLabel: "打开校园邮箱",
                onAction: () => console.log("open campus mail"),
              })
            }
          >
            Action + 常驻
          </button>
          <button
            className="px-4 py-2 bg-slate-700 text-white rounded"
            onClick={() =>
              feedback.error({
                title: "验证码发送失败",
                description:
                  "多次发送仍未成功。若确认邮箱无误，可能是发件通道异常，请联系管理员处理。",
                duration: 0,
                actionLabel: "联系管理员",
                onAction: () => console.log("contact admin"),
                dismissOnAction: false,
              })
            }
          >
            Error + Action（不自动关）
          </button>
          <button
            className="px-4 py-2 bg-indigo-500 text-white rounded"
            onClick={() =>
              feedback.info({
                title: "账号安全提醒",
                description:
                  "检测到异地登录尝试。如非本人操作，请尽快修改密码并开启二次验证，以保障账号安全。",
              })
            }
          >
            长正文自动升级
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">notify() 强制 Notification</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded"
            onClick={() =>
              feedback.notify({
                title: "站内通知",
                description: "你有一条新的系统消息，可在通知中心查看详情。",
                type: "info",
                actionLabel: "查看通知",
                onAction: () => console.log("open inbox"),
              })
            }
          >
            站内通知 + Footer
          </button>
          <button
            className="px-4 py-2 bg-emerald-700 text-white rounded"
            onClick={() =>
              feedback.notify({
                title: "补录申请已通过",
                description: "你提交的教师补录已审核通过。",
                type: "success",
              })
            }
          >
            审核结果
          </button>
        </div>
      </section>
    </div>
  );
}
