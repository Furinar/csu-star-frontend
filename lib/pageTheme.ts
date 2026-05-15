import type { CSSProperties } from "react";
import type { EntityThemeKey } from "@/lib/entityTheme";

export type PageThemeKey = "default" | EntityThemeKey;

export interface PageTheme {
  key: PageThemeKey;
  firstColor: string;
  firstColorAlt: string;
  firstColorSecond: string;
  firstColorLighter: string;
  ring: string;
  heroGradientEnd: string;
  pageAccentText: string;
  pageAccentBorder: string;
  pageAccentSoft: string;
  pageAccentSoftStrong: string;
  pageAccentGradient: string;
  pageAccentGradientSoft: string;
  pageAtColor: string;
  pageLikeColor: string;
  pageLikeSoft: string;
  blobColors: [string, string, string];
  ratingGradients: [string, string, string];
}

export const PAGE_THEMES: Record<PageThemeKey, PageTheme> = {
  default: {
    key: "default",
    firstColor: "#8b5cf6",
    firstColorAlt: "#7c3aed",
    firstColorSecond: "#8b5cf6",
    firstColorLighter: "#ddd5ff",
    ring: "#0c9ee8",
    heroGradientEnd: "#fbbf24",
    pageAccentText: "#7c3aed",
    pageAccentBorder: "rgba(139, 92, 246, 0.18)",
    pageAccentSoft: "rgba(139, 92, 246, 0.08)",
    pageAccentSoftStrong: "rgba(139, 92, 246, 0.14)",
    pageAccentGradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    pageAccentGradientSoft: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(124,58,237,0.06) 100%)",
    pageAtColor: "#7c3aed",
    pageLikeColor: "#8b5cf6",
    pageLikeSoft: "rgba(139, 92, 246, 0.12)",
    blobColors: [
      "rgba(96, 165, 250, 0.28)",
      "rgba(168, 85, 247, 0.24)",
      "rgba(129, 140, 248, 0.22)",
    ],
    ratingGradients: [
      "linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)",
      "linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%)",
      "linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)",
    ],
  },
  course: {
    key: "course",
    firstColor: "#2563eb",
    firstColorAlt: "#6d28d9",
    firstColorSecond: "#3b82f6",
    firstColorLighter: "#dbeafe",
    ring: "#2563eb",
    heroGradientEnd: "#8b5cf6",
    pageAccentText: "#1d4ed8",
    pageAccentBorder: "rgba(37, 99, 235, 0.18)",
    pageAccentSoft: "rgba(37, 99, 235, 0.08)",
    pageAccentSoftStrong: "rgba(109, 40, 217, 0.12)",
    pageAccentGradient: "linear-gradient(135deg, #38bdf8 0%, #2563eb 48%, #6d28d9 100%)",
    pageAccentGradientSoft: "linear-gradient(135deg, rgba(56,189,248,0.14) 0%, rgba(37,99,235,0.08) 56%, rgba(109,40,217,0.12) 100%)",
    pageAtColor: "#4f46e5",
    pageLikeColor: "#2563eb",
    pageLikeSoft: "rgba(37, 99, 235, 0.12)",
    blobColors: [
      "rgba(56, 189, 248, 0.32)",
      "rgba(59, 130, 246, 0.28)",
      "rgba(109, 40, 217, 0.2)",
    ],
    ratingGradients: [
      "linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)",
      "linear-gradient(90deg, #34d399 0%, #10b981 100%)",
      "linear-gradient(90deg, #facc15 0%, #f59e0b 100%)",
    ],
  },
  teacher: {
    key: "teacher",
    firstColor: "#ec4899",
    firstColorAlt: "#f59e0b",
    firstColorSecond: "#fb7185",
    firstColorLighter: "#ffe4ef",
    ring: "#ec4899",
    heroGradientEnd: "#f59e0b",
    pageAccentText: "#be185d",
    pageAccentBorder: "rgba(236, 72, 153, 0.16)",
    pageAccentSoft: "rgba(236, 72, 153, 0.08)",
    pageAccentSoftStrong: "rgba(245, 158, 11, 0.14)",
    pageAccentGradient: "linear-gradient(135deg, #f472b6 0%, #fb7185 54%, #f59e0b 100%)",
    pageAccentGradientSoft: "linear-gradient(135deg, rgba(244,114,182,0.14) 0%, rgba(251,113,133,0.08) 56%, rgba(245,158,11,0.12) 100%)",
    pageAtColor: "#db2777",
    pageLikeColor: "#ec4899",
    pageLikeSoft: "rgba(236, 72, 153, 0.12)",
    blobColors: [
      "rgba(244, 114, 182, 0.26)",
      "rgba(251, 113, 133, 0.24)",
      "rgba(245, 158, 11, 0.18)",
    ],
    ratingGradients: [
      "linear-gradient(90deg, #f472b6 0%, #fb7185 100%)",
      "linear-gradient(90deg, #fb7185 0%, #f97316 100%)",
      "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
    ],
  },
  resource: {
    key: "resource",
    firstColor: "#10b981",
    firstColorAlt: "#0f766e",
    firstColorSecond: "#22c55e",
    firstColorLighter: "#dcfce7",
    ring: "#10b981",
    heroGradientEnd: "#14b8a6",
    pageAccentText: "#047857",
    pageAccentBorder: "rgba(16, 185, 129, 0.18)",
    pageAccentSoft: "rgba(16, 185, 129, 0.08)",
    pageAccentSoftStrong: "rgba(20, 184, 166, 0.12)",
    pageAccentGradient: "linear-gradient(135deg, #34d399 0%, #10b981 56%, #0f766e 100%)",
    pageAccentGradientSoft: "linear-gradient(135deg, rgba(52,211,153,0.14) 0%, rgba(16,185,129,0.08) 52%, rgba(15,118,110,0.12) 100%)",
    pageAtColor: "#059669",
    pageLikeColor: "#10b981",
    pageLikeSoft: "rgba(16, 185, 129, 0.12)",
    blobColors: [
      "rgba(52, 211, 153, 0.28)",
      "rgba(16, 185, 129, 0.24)",
      "rgba(13, 148, 136, 0.2)",
    ],
    ratingGradients: [
      "linear-gradient(90deg, #34d399 0%, #10b981 100%)",
      "linear-gradient(90deg, #10b981 0%, #14b8a6 100%)",
      "linear-gradient(90deg, #059669 0%, #0f766e 100%)",
    ],
  },
};

export function resolvePageThemeKey(pathname?: string | null): PageThemeKey {
  if (!pathname) return "default";
  if (pathname.startsWith("/course")) return "course";
  if (pathname.startsWith("/teacher")) return "teacher";
  if (pathname.startsWith("/resource")) return "resource";
  return "default";
}

export function getPageTheme(pathname?: string | null) {
  return PAGE_THEMES[resolvePageThemeKey(pathname)];
}

export function createPageThemeStyle(theme: PageTheme) {
  return {
    "--first-color": theme.firstColor,
    "--first-color-second": theme.firstColorSecond,
    "--first-color-alt": theme.firstColorAlt,
    "--first-color-lighter": theme.firstColorLighter,
    "--ring": theme.ring,
    "--hero-gradient-end": theme.heroGradientEnd,
    "--page-accent-text": theme.pageAccentText,
    "--page-accent-border": theme.pageAccentBorder,
    "--page-accent-soft": theme.pageAccentSoft,
    "--page-accent-soft-strong": theme.pageAccentSoftStrong,
    "--page-accent-gradient": theme.pageAccentGradient,
    "--page-accent-gradient-soft": theme.pageAccentGradientSoft,
    "--page-at-color": theme.pageAtColor,
    "--page-like-color": theme.pageLikeColor,
    "--page-like-soft": theme.pageLikeSoft,
  } as CSSProperties;
}
