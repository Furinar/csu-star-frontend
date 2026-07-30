/**
 * Flat surface tokens for the me dashboard.
 * Prefer light slate borders / dividers over glass shadow.
 */

/** Section title above a panel or list */
export const ME_SECTION_TITLE =
  "mb-3 text-sm font-medium text-slate-800";

/** Contained block (sidebar profile, contribution heatmap, etc.) */
export const ME_PANEL =
  "rounded-lg border border-slate-200 bg-white";

export const ME_PANEL_PAD = `${ME_PANEL} p-4 sm:p-5`;

/**
 * List / feed item: subtle outline, no heavy shadow.
 * Use with space-y-2.5 / space-y-3 between items.
 */
export const ME_ROW =
  "rounded-lg border border-slate-200 bg-white px-3 py-3 transition-colors hover:border-slate-300 hover:bg-slate-50/80 sm:px-4 sm:py-3.5";

export const ME_ROW_INTERACTIVE = `${ME_ROW} cursor-pointer active:bg-slate-50`;

/** Settings grid tile */
export const ME_SETTINGS_TILE =
  "flex min-h-[58px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 transition-colors hover:border-slate-300 hover:bg-slate-50/80 sm:min-h-[80px] sm:items-start sm:gap-3 sm:px-3 sm:py-3";

export const ME_ICON_WELL =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-base text-slate-600 sm:mt-0.5 sm:h-9 sm:w-9 sm:text-lg";

/** Icon well sized for entity list cards — same small radius as ME_ROW */
export const ME_CARD_ICON_WELL =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border sm:h-10 sm:w-10";

/** Responsive card grid: 1 → 2 → 3 columns by width */
export const ME_CARD_GRID =
  "grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3";

export const ME_META = "text-xs text-slate-500 sm:text-sm";

export const ME_TITLE =
  "text-[15px] font-medium leading-6 text-slate-900 sm:text-base";

export const ME_METRIC_ROW =
  "flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-600 sm:gap-x-4 sm:text-sm";

/** Vertical list stack spacing */
export const ME_LIST_STACK = "space-y-2.5 sm:space-y-3";

/** Entity list card: icon well + body */
export const ME_CARD_BODY = "flex min-w-0 items-start gap-2.5 sm:gap-3";

/** Single-line meta under title */
export const ME_CARD_META =
  "mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-5 text-slate-500 sm:text-[13px] sm:leading-5";

/** Compact stat chip (icon + number) for card footer */
export const ME_STAT =
  "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums leading-none text-slate-500 sm:gap-1 sm:text-xs";

export const ME_STAT_MUTED = "text-slate-400";

/** Card footer time, bottom-right */
export const ME_CARD_TIME =
  "ml-auto shrink-0 text-[11px] leading-none tabular-nums text-slate-400 sm:text-xs";

/** Soft separator between meta segments */
export const ME_META_DOT = "text-slate-300 select-none";
