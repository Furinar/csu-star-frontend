export type NormalizedCourseType = "公选课" | "非公选课";

export function normalizeCourseType(
  value?: string | null,
): NormalizedCourseType | null {
  if (!value) return null;

  if (value === "public" || value === "公选课") return "公选课";
  if (value === "non_public" || value === "非公选课") return "非公选课";

  return null;
}

export function isPublicCourseType(value?: string | null) {
  return normalizeCourseType(value) === "公选课";
}
