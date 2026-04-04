"use client";

export default function SupplementRequestPrompt({
  onClick,
  className = "",
  align = "left",
}: {
  onClick: () => void;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const justifyClassName =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "items-center text-center"
        : "items-start text-left";

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center ${align === "right" ? "sm:justify-end" : align === "center" ? "sm:justify-center" : "sm:justify-between"} ${className}`}
    >
      <div className={`flex flex-col gap-1 ${justifyClassName}`}>
        <div className="text-sm font-semibold text-slate-700">
          没有你想找的老师/课程？
        </div>
        <div className="text-xs text-slate-500">
          提交补录申请，审核员或管理员通过后才会正式添加。
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        申请补录
      </button>
    </div>
  );
}
