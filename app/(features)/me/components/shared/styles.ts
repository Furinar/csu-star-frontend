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

export const ME_META = "text-xs text-slate-500 sm:text-sm";

export const ME_TITLE =
  "text-[15px] font-medium leading-6 text-slate-900 sm:text-base";

export const ME_METRIC_ROW =
  "flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-600 sm:gap-x-4 sm:text-sm";

/** Vertical list stack spacing */
export const ME_LIST_STACK = "space-y-2.5 sm:space-y-3";
