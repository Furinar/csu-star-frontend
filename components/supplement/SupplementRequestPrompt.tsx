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
  const isCentered = align === "center";
  const justifyClassName =
    align === "right"
      ? "items-end text-right"
      : isCentered
        ? "items-center text-center"
        : "items-start text-left";
  const containerClassName = isCentered
    ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
    : "flex w-auto items-center justify-end gap-2 md:w-full md:justify-between md:gap-3";

  return (
    <div
      className={`${containerClassName} ${align === "right" ? "sm:justify-end" : isCentered ? "sm:justify-center" : "sm:justify-between"} ${className}`}
    >
      <div className={`hidden min-w-0 flex-col gap-1 md:flex ${justifyClassName}`}>
        <div className="text-sm font-semibold text-slate-700">{copy.title}</div>
        <div className={`text-xs text-slate-500 ${isCentered ? "" : "hidden sm:block"}`}>
          提交补录申请，通过审核后才会正式添加。
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:px-4 md:py-2 md:text-sm ${align === "right" ? "ml-auto" : ""}`}
      >
        {copy.buttonLabel}
      </button>
    </div>
  );
}
