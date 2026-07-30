"use client";

import type { ReactNode } from "react";
import FaSvgIcon, { type FaSvgIconName } from "@/components/ui/FaSvgIcon";
import type { EntityThemeKey } from "@/lib/entityTheme";
import {
  normalizeResourceType,
  type ResourceCategoryKey,
} from "@/lib/resourceCategory";
import { formatNumber } from "./helpers";
import { ME_STAT, ME_STAT_MUTED } from "./styles";

/** Icons8 color set — same source as resource detail `fileIcons`. */
const ICONS8 = "https://img.icons8.com/color/48/000000";

/**
 * Map resource category → colorful file-style icon (align with resource pages).
 * My-list items often lack a concrete filename, so we key off category.
 */
/** Prefer icons already used on resource detail (`fileIcons.ts`) for reliability. */
const CATEGORY_FILE_ICONS: Record<ResourceCategoryKey, string> = {
  general: `${ICONS8}/archive.png`,
  exam: `${ICONS8}/pdf.png`,
  slides: `${ICONS8}/powerpoint.png`,
  notes: `${ICONS8}/document.png`,
  assignment: `${ICONS8}/word.png`,
  lab: `${ICONS8}/code.png`,
  report: `${ICONS8}/pdf.png`,
  other: `${ICONS8}/document.png`,
};

const ENTITY_FA: Record<
  EntityThemeKey,
  { name: FaSvgIconName; well: string }
> = {
  resource: {
    name: "book-open",
    well: "border-emerald-100 bg-emerald-50 text-emerald-600",
  },
  course: {
    name: "graduation-cap",
    well: "border-sky-100 bg-sky-50 text-sky-600",
  },
  teacher: {
    name: "chalkboard-user",
    well: "border-rose-100 bg-rose-50 text-rose-500",
  },
};

export function getResourceCategoryFileIcon(
  resourceType?: string | null,
): string {
  return CATEGORY_FILE_ICONS[normalizeResourceType(resourceType)];
}

/** Colored Icons8 thumb used on resource / favorite-resource cards. */
export function MeFileTypeThumb({
  resourceType,
  className = "",
}: {
  resourceType?: string | null;
  className?: string;
}) {
  return (
    <span
      className={`inline-block h-6 w-6 bg-contain bg-center bg-no-repeat sm:h-7 sm:w-7 ${className}`.trim()}
      style={{
        backgroundImage: `url(${getResourceCategoryFileIcon(resourceType)})`,
      }}
      aria-hidden
    />
  );
}

/** Site FA glyph for course / teacher (and resource fallback). */
export function MeEntityFaThumb({
  type,
  className = "",
}: {
  type: EntityThemeKey;
  className?: string;
}) {
  const conf = ENTITY_FA[type];
  return (
    <FaSvgIcon
      name={conf.name}
      className={`text-[1.15rem] sm:text-[1.25rem] ${className}`.trim()}
    />
  );
}

export function getEntityFaWellClass(type: EntityThemeKey) {
  return ENTITY_FA[type].well;
}

/** Compact metric with optional icon (site uil + TDesign-friendly spacing) */
export function MeStat({
  icon,
  children,
  muted = false,
  className = "",
  title,
}: {
  icon?: ReactNode;
  children: ReactNode;
  muted?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`${ME_STAT} ${muted ? ME_STAT_MUTED : ""} ${className}`.trim()}
    >
      {icon}
      {children}
    </span>
  );
}

/** Match resource list metric colors (uil) — keep icon ~same size as digits */
export function MeUilStat({
  uil,
  colorClass,
  children,
  className = "",
  title,
}: {
  uil: string;
  colorClass: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <MeStat
      title={title}
      className={className}
      icon={
        <i
          className={`uil ${uil} text-[13px] leading-none ${colorClass} sm:text-sm`}
          aria-hidden
        />
      }
    >
      {children}
    </MeStat>
  );
}

/** 资源卡底部：图标 + 数字，不写「下载/点赞/浏览」字样以免撑大 */
export function MeDownloadStat({ value }: { value?: number | null }) {
  const n = formatNumber(value);
  return (
    <MeUilStat
      uil="uil-cloud-download"
      colorClass="text-blue-500"
      title={`下载 ${n}`}
    >
      <span className="sr-only">下载 </span>
      {n}
    </MeUilStat>
  );
}

export function MeLikeStat({ value }: { value?: number | null }) {
  const n = formatNumber(value);
  return (
    <MeUilStat
      uil="uil-thumbs-up"
      colorClass="text-rose-500"
      title={`点赞 ${n}`}
    >
      <span className="sr-only">点赞 </span>
      {n}
    </MeUilStat>
  );
}

export function MeViewStat({
  value,
  className = "",
}: {
  value?: number | null;
  className?: string;
}) {
  const n = formatNumber(value);
  return (
    <MeUilStat
      uil="uil-eye"
      colorClass="text-amber-500"
      className={className}
      title={`浏览 ${n}`}
    >
      <span className="sr-only">浏览 </span>
      {n}
    </MeUilStat>
  );
}

/**
 * Right-rail metric panel — fills desktop empty space (like resource course cards).
 */
export function MeAsideMetric({
  label,
  value,
  hint,
  tone = "emerald",
  footer,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "emerald" | "sky" | "rose" | "amber" | "slate";
  footer?: ReactNode;
}) {
  const toneMap = {
    emerald: {
      box: "border-emerald-100 bg-emerald-50/80",
      label: "text-emerald-600",
      value: "text-emerald-900",
    },
    sky: {
      box: "border-sky-100 bg-sky-50/80",
      label: "text-sky-600",
      value: "text-sky-900",
    },
    rose: {
      box: "border-rose-100 bg-rose-50/80",
      label: "text-rose-600",
      value: "text-rose-900",
    },
    amber: {
      box: "border-amber-100 bg-amber-50/80",
      label: "text-amber-600",
      value: "text-amber-900",
    },
    slate: {
      box: "border-slate-200 bg-slate-50",
      label: "text-slate-500",
      value: "text-slate-800",
    },
  } as const;
  const t = toneMap[tone];

  return (
    <div
      className={`flex min-w-[3.75rem] flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-center sm:min-w-[4.5rem] sm:px-2.5 sm:py-2 ${t.box}`}
    >
      <div className={`text-[10px] font-medium sm:text-[11px] ${t.label}`}>
        {label}
      </div>
      <div
        className={`mt-0.5 text-base font-semibold leading-none tabular-nums sm:mt-1 sm:text-lg ${t.value}`}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-[10px] leading-tight text-slate-500 sm:text-[11px]">
          {hint}
        </div>
      ) : null}
      {footer ? <div className="mt-1 w-full">{footer}</div> : null}
    </div>
  );
}
