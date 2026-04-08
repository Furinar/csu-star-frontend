"use client";

import Link from "next/link";

const toneMap = {
  course: "from-sky-500 to-sky-600 shadow-sky-200/80",
  teacher: "from-rose-500 to-rose-600 shadow-rose-200/80",
  resource: "from-emerald-500 to-emerald-600 shadow-emerald-200/80",
} as const;

export default function DetailFloatingActionButton({
  label,
  tone,
  href,
  onClick,
}: {
  label: string;
  tone: keyof typeof toneMap;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="pointer-events-none absolute -left-3 -top-3 z-10 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
        {label}
      </span>
      <span
        className={`relative z-0 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br text-3xl text-white shadow-[0_20px_45px_rgba(15,23,42,0.18)] transition duration-200 hover:scale-[1.12] ${toneMap[tone]}`}
      >
        +
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className="fixed bottom-6 right-6 z-[1050] isolate cursor-pointer md:bottom-8 md:right-8"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-6 right-6 z-[1050] isolate cursor-pointer md:bottom-8 md:right-8"
    >
      {content}
    </button>
  );
}
