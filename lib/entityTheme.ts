export type EntityThemeKey = "course" | "teacher" | "resource";

export interface EntityTheme {
  label: string;
  dotClassName: string;
  badgeTextClassName: string;
  badgeBackgroundClassName: string;
  badgeBorderClassName: string;
  badgeMutedBackgroundClassName: string;
  starFillClassName: string;
  ratingGradient: string;
  dimensionBarClassNames: [string, string, string];
}

export const ENTITY_THEMES: Record<EntityThemeKey, EntityTheme> = {
  course: {
    label: "课程",
    dotClassName: "bg-sky-500",
    badgeTextClassName: "text-sky-700",
    badgeBackgroundClassName: "bg-sky-50/90",
    badgeBorderClassName: "border-sky-100",
    badgeMutedBackgroundClassName: "bg-sky-50/70",
    starFillClassName: "text-sky-500",
    ratingGradient: "linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)",
    dimensionBarClassNames: ["bg-sky-400", "bg-blue-500", "bg-cyan-500"],
  },
  teacher: {
    label: "教师",
    dotClassName: "bg-rose-400",
    badgeTextClassName: "text-rose-700",
    badgeBackgroundClassName: "bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50",
    badgeBorderClassName: "border-rose-100",
    badgeMutedBackgroundClassName: "bg-gradient-to-r from-rose-50/80 via-pink-50/80 to-amber-50/80",
    starFillClassName: "text-rose-400",
    ratingGradient: "linear-gradient(90deg, #f472b6 0%, #fb7185 52%, #f59e0b 100%)",
    dimensionBarClassNames: [
      "bg-gradient-to-r from-rose-400 to-pink-400",
      "bg-gradient-to-r from-pink-400 to-orange-400",
      "bg-gradient-to-r from-fuchsia-400 to-amber-400",
    ],
  },
  resource: {
    label: "资源合集",
    dotClassName: "bg-emerald-500",
    badgeTextClassName: "text-emerald-700",
    badgeBackgroundClassName: "bg-emerald-50/90",
    badgeBorderClassName: "border-emerald-100",
    badgeMutedBackgroundClassName: "bg-emerald-50/70",
    starFillClassName: "text-emerald-500",
    ratingGradient: "linear-gradient(90deg, #10b981 0%, #22c55e 100%)",
    dimensionBarClassNames: ["bg-emerald-400", "bg-green-500", "bg-teal-500"],
  },
};

export function getEntityTheme(type: EntityThemeKey) {
  return ENTITY_THEMES[type];
}
