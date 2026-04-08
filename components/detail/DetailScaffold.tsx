"use client";

import type { ReactNode } from "react";
import Link from "next/link";

interface DetailHeroProps {
  accent: "course" | "teacher" | "resource";
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  layout?: "default" | "course-grid" | "resource-mobile-aside";
}

const accentStyles = {
  course: {
    shell: "border-sky-100/80 bg-gradient-to-br from-sky-50 via-white to-indigo-50",
    spotlightA: "bg-sky-200/55",
    spotlightB: "bg-indigo-200/45",
    stripe: "from-sky-500/10 via-transparent to-white/30",
  },
  teacher: {
    shell: "border-rose-100/80 bg-gradient-to-br from-rose-50 via-white to-amber-50",
    spotlightA: "bg-rose-200/55",
    spotlightB: "bg-amber-200/45",
    stripe: "from-rose-500/10 via-transparent to-white/30",
  },
  resource: {
    shell: "border-emerald-100/80 bg-gradient-to-br from-emerald-50 via-white to-cyan-50",
    spotlightA: "bg-emerald-200/55",
    spotlightB: "bg-cyan-200/45",
    stripe: "from-emerald-500/10 via-transparent to-white/30",
  },
} as const;

export function DetailPageShell({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pt-4 pb-12 px-4 md:gap-8 md:pt-8 md:pb-24 md:px-6 lg:px-8">{children}</div>;
}

export function DetailHero({
  accent,
  eyebrow,
  title,
  description,
  aside,
  meta,
  children,
  footer,
  layout = "default",
}: DetailHeroProps) {
  const style = accentStyles[accent];
  const contentWidth =
    layout === "course-grid"
      ? "lg:grid-cols-[minmax(0,1.15fr)_320px]"
      : layout === "resource-mobile-aside"
        ? "grid-cols-[minmax(0,1fr)_92px] lg:grid-cols-[minmax(0,1fr)_320px]"
        : "lg:grid-cols-[minmax(0,1fr)_320px]";

  return (
    <section className={`relative overflow-hidden rounded-[24px] border p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] md:rounded-[36px] md:p-7 md:shadow-[0_24px_80px_rgba(15,23,42,0.08)] ${style.shell}`}>
      <div className={`absolute -left-10 top-4 h-36 w-36 rounded-full blur-3xl md:-left-12 md:top-6 md:h-48 md:w-48 ${style.spotlightA}`} />
      <div className={`absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl md:h-56 md:w-56 ${style.spotlightB}`} />
      <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-r md:h-24 ${style.stripe}`} />
      <div className="absolute inset-[1px] rounded-[23px] border border-white/70 md:rounded-[35px]" />

      <div className={`relative grid gap-4 md:gap-5 ${aside ? contentWidth : ""}`}>
        <div className="min-w-0 space-y-4 px-0.5 py-1 md:space-y-6 md:px-2 md:py-4">
          {eyebrow ? <div className="flex flex-wrap items-center gap-2 md:gap-3">{eyebrow}</div> : null}
          <div className="space-y-2 md:space-y-3">
            <h1 className="max-w-4xl text-2xl font-semibold tracking-[-0.05em] text-slate-950 md:text-5xl">{title}</h1>
            {description ? (
              <div className="max-w-3xl text-xs leading-6 text-slate-600 md:text-base md:leading-7">{description}</div>
            ) : null}
          </div>
          {meta ? <div className="flex flex-wrap gap-2 md:gap-3">{meta}</div> : null}
          {children}
        </div>

        {aside ? <div className="relative min-w-0">{aside}</div> : null}
      </div>

      {footer ? (
        <div className="relative mt-4 rounded-[20px] border border-white/75 bg-white/72 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl md:mt-5 md:rounded-[30px] md:p-6">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function DetailRibbonTag({
  text,
  tone = "course",
}: {
  text: string;
  tone?: "course" | "teacher" | "resource";
}) {
  const label = text.trim();
  if (!label) return null;

  const chars = Array.from(label).slice(0, 2);
  const toneStyles = {
    course: "bg-[var(--first-color)] text-white",
    teacher: "bg-rose-500 text-white",
    resource: "bg-emerald-500 text-white",
  } as const;

  return (
    <span className={`inline-flex flex-col rounded-b-sm px-1.5 py-1 text-sm font-bold shadow-lg ${toneStyles[tone]}`}>
      {chars.map((char, index) => (
        <span key={`${label}-${index}`}>{char}</span>
      ))}
    </span>
  );
}

export function DetailMetricPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "course" | "teacher" | "resource";
}) {
  const toneStyles = {
    default: "border-slate-200 bg-white text-slate-700",
    course: "border-sky-100 bg-sky-50/80 text-sky-700",
    teacher: "border-rose-100 bg-rose-50/80 text-rose-700",
    resource: "border-emerald-100 bg-emerald-50/80 text-emerald-700",
  } as const;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm ${toneStyles[tone]}`}>
      <span className="text-slate-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function DetailStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
}) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/82 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-3 text-5xl md:text-6xl font-semibold tracking-[-0.07em] text-slate-950">{value}</div>
      {helper ? <div className="mt-5 text-sm text-slate-500">{helper}</div> : null}
    </div>
  );
}

export function DetailSection({
  title,
  description,
  action,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl md:rounded-[32px] md:p-7">
      <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between md:gap-3 md:pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950 md:text-2xl">{title}</h2>
          {description ? <p className="mt-1 text-xs text-slate-500 md:text-sm">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="pt-4 md:pt-6">{children}</div>
    </section>
  );
}

export function EntityPillLink({
  href,
  children,
  tone = "default",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: "default" | "course" | "teacher" | "resource";
  className?: string;
}) {
  const toneStyles = {
    default: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
    course: "border-sky-100 bg-white hover:border-sky-200 hover:bg-sky-50/70",
    teacher: "border-rose-100 bg-white hover:border-rose-200 hover:bg-rose-50/70",
    resource: "border-emerald-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/70",
  } as const;

  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition md:px-4 md:py-2 md:text-sm ${toneStyles[tone]} ${className}`}
    >
      {children}
    </Link>
  );
}
