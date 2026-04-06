"use client";

export type SupplementRequestPromptVariant = "teacher" | "course" | "mixed";

function getPromptCopy(variant: SupplementRequestPromptVariant) {
  if (variant === "teacher") {
    return {
      title: "还有没有你想找的老师？",
      buttonLabel: "申请补录老师",
    };
  }

  if (variant === "course") {
    return {
      title: "还有没有你想找的课程？",
      buttonLabel: "申请补录课程",
    };
  }

  return {
    title: "还有没有你想找的老师或课程？",
    buttonLabel: "提交补录申请",
  };
}

export default function SupplementRequestPrompt({
  onClick,
  className = "",
  align = "left",
  variant,
}: {
  onClick: () => void;
  className?: string;
  align?: "left" | "right" | "center";
  variant: SupplementRequestPromptVariant;
}) {
  const copy = getPromptCopy(variant);
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
      <div className={`hidden flex-col gap-1 sm:flex ${justifyClassName}`}>
        <div className="text-sm font-semibold text-slate-700">{copy.title}</div>
        <div className="text-xs text-slate-500">
          提交补录申请，通过审核后才会正式添加。
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      >
        {copy.buttonLabel}
      </button>
    </div>
  );
}
