"use client";

import { feedback } from "@/store/useFeedbackStore";

export default function test() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">FeedbackToaster Test</h1>

      <div className="flex gap-4 flex-wrap">
        <button
          className="px-4 py-2 bg-emerald-500 text-white rounded"
          onClick={() =>
            feedback.success({
              title: "操作成功",
              description: "您的设置已成功保存。",
            })
          }
        >
          Success Toast
        </button>

        <button
          className="px-4 py-2 bg-rose-500 text-white rounded"
          onClick={() =>
            feedback.error({
              title: "操作失败",
              description: "网络连接断开，请检查网络设置。",
            })
          }
        >
          Error Toast
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() =>
            feedback.info({
              title: "温馨提示",
              description: "系统将在今晚进行维护升级。",
            })
          }
        >
          Info Toast
        </button>

        <button
          className="px-4 py-2 bg-amber-500 text-white rounded"
          onClick={() =>
            feedback.warning({
              title: "警告",
              description: "您的存储空间即将耗尽，请及时清理。",
            })
          }
        >
          Warning Toast
        </button>

        <button
          className="px-4 py-2 bg-slate-500 text-white rounded"
          onClick={() =>
            feedback.info({
              title: "带操作的提示",
              description: "是否要撤销刚才的删除操作？",
              actionLabel: "撤销操作",
              onAction: () => console.log("撤销操作被点击"),
            })
          }
        >
          Action Toast
        </button>
      </div>
    </div>
  );
}
