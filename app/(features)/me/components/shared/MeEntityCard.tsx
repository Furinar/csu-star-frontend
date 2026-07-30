"use client";

import type { ReactNode } from "react";
import type { EntityThemeKey } from "@/lib/entityTheme";
import {
  ME_CARD_BODY,
  ME_CARD_ICON_WELL,
  ME_ROW,
  ME_ROW_INTERACTIVE,
  ME_TITLE,
} from "./styles";

export type MeEntityTone = EntityThemeKey | "neutral" | "danger";

const TONE_WELL: Record<MeEntityTone, string> = {
  resource: "border-emerald-100 bg-emerald-50/90 text-emerald-600",
  course: "border-sky-100 bg-sky-50/90 text-sky-600",
  teacher: "border-rose-100 bg-rose-50/90 text-rose-500",
  neutral: "border-slate-100 bg-slate-50 text-slate-500",
  danger: "border-rose-100 bg-rose-50/70 text-rose-400",
};

/** Soft white plate for colorful Icons8 thumbs */
export const ME_FILE_THUMB_WELL =
  "border-slate-100 bg-white shadow-sm shadow-slate-100/80";

export interface MeEntityCardProps {
  /** Left icon (Icons8 thumb, FA glyph, or TDesign icon) */
  icon: ReactNode;
  tone?: MeEntityTone;
  /** Override icon well classes (e.g. white plate for file thumbs) */
  iconWellClassName?: string;
  title: ReactNode;
  /** Tags / badges next to the title */
  tags?: ReactNode;
  /** Top-right actions (e.g. ItemActionMenu) — clicks should stopPropagation */
  action?: ReactNode;
  /** Meta line under title (time · relation) */
  meta?: ReactNode;
  /** Inline metrics under meta (mobile-friendly; can hide when aside present) */
  stats?: ReactNode;
  /** Right-rail panel (score / primary metric) — fills desktop empty space */
  aside?: ReactNode;
  /** Extra body: comment preview, dimension panel, etc. */
  children?: ReactNode;
  interactive?: boolean;
  className?: string;
  /** Stretch to fill grid cell */
  fullHeight?: boolean;
}

/**
 * Shared list-card shell for me resources / favorites / evaluations.
 * Left icon + body + optional right aside metric panel.
 */
export default function MeEntityCard({
  icon,
  tone = "neutral",
  iconWellClassName,
  title,
  tags,
  action,
  meta,
  stats,
  aside,
  children,
  interactive = true,
  className = "",
  fullHeight = false,
}: MeEntityCardProps) {
  const surface = interactive ? ME_ROW_INTERACTIVE : ME_ROW;
  const heightClass = fullHeight ? "h-full" : "";
  const wellClass = iconWellClassName ?? TONE_WELL[tone];

  return (
    <div
      className={`${surface} ${heightClass} flex flex-col ${className}`.trim()}
    >
      <div className="flex min-w-0 flex-1 items-stretch gap-2.5 sm:gap-3.5">
        <div className={`${ME_CARD_BODY} min-w-0 flex-1`}>
          <div
            className={`${ME_CARD_ICON_WELL} ${wellClass}`}
            aria-hidden
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <h4 className={`${ME_TITLE} min-w-0 flex-1 truncate`}>
                    {title}
                  </h4>
                  {tags ? (
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      {tags}
                    </div>
                  ) : null}
                </div>
                {meta ? <div className="min-w-0">{meta}</div> : null}
              </div>
              {action ? (
                <div className="relative z-10 shrink-0 -mr-1 -mt-0.5">
                  {action}
                </div>
              ) : null}
            </div>

            {children}
          </div>
        </div>

        {aside ? (
          <div className="flex shrink-0 flex-col items-end justify-center self-center sm:self-stretch sm:justify-center">
            {aside}
          </div>
        ) : null}
      </div>

      {/* Full-width footer：左指标 / 右时间（用 ml-auto 推到右下角） */}
      {stats ? (
        <div className="mt-2.5 flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-slate-100 pt-2 sm:mt-3 sm:gap-x-3 sm:pt-2.5">
          {stats}
        </div>
      ) : null}
    </div>
  );
}
