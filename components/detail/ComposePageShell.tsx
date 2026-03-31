"use client";

import type { ReactNode } from "react";
import Link from "next/link";

const accentMap = {
  course: {
    shell: "border-sky-100/80 from-sky-50 via-white to-indigo-50",
    badge: "border-sky-200 bg-white/90 text-sky-700",
    spotlight: "bg-sky-200/50",
    button: "text-sky-700 hover:text-sky-900",
  },
  teacher: {
    shell: "border-rose-100/80 from-rose-50 via-white to-amber-50",
    badge: "border-rose-200 bg-white/90 text-rose-700",
    spotlight: "bg-rose-200/50",
    button: "text-rose-700 hover:text-rose-900",
  },
  resource: {
    shell: "border-emerald-100/80 from-emerald-50 via-white to-cyan-50",
    badge: "border-emerald-200 bg-white/90 text-emerald-700",
    spotlight: "bg-emerald-200/50",
    button: "text-emerald-700 hover:text-emerald-900",
  },
} as const;

export default function ComposePageShell({
  accent,
  badge,
  title,
  description,
  backHref,
  backLabel,
  meta,
  children,
}: {
  accent: keyof typeof accentMap;
  badge: ReactNode;
  title: ReactNode;
  description: ReactNode;
  backHref: string;
  backLabel: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const tone = accentMap[accent];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-8 md:px-6 lg:px-8">
      <Link
        href={backHref}
        className={`inline-flex w-fit items-center gap-2 text-sm font-medium transition ${tone.button}`}
      >
        <i className="uil uil-arrow-left text-base" />
        {backLabel}
      </Link>

      <section
        className={`relative overflow-hidden rounded-[36px] border bg-gradient-to-br p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8 ${tone.shell}`}
      >
        <div className={`absolute -right-10 top-6 h-40 w-40 rounded-full blur-3xl ${tone.spotlight}`} />
        <div className="absolute left-6 top-0 h-24 w-24 rounded-full bg-white/60 blur-3xl" />
        <div className="relative space-y-5">
          <div className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${tone.badge}`}>
            {badge}
          </div>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{description}</p>
          </div>
          {meta ? <div className="flex flex-wrap gap-3">{meta}</div> : null}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-7">
        {children}
      </section>
    </div>
  );
}
