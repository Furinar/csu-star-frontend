import { service } from "@/lib/request";
import type {
  CourseRankingItem,
  CourseRankingQuery,
  PaginatedData,
  ResourceRankingItem,
  ResourceRankingQuery,
  TeacherRankingItem,
  TeacherRankingQuery,
} from "@/types/ranking";

interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
}

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null;

const unwrapResponseData = (payload: unknown): unknown => {
  if (!isRecord(payload)) return undefined;

  const firstLevel = payload.data;
  if (isRecord(firstLevel) && typeof firstLevel.code === "number" && "data" in firstLevel) {
    return firstLevel.data;
  }

  return firstLevel;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toStringSafe = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const normalizePaginated = <T>(
  raw: unknown,
  normalizeItems: (items: unknown[]) => T[],
): PaginatedData<T> => {
  if (!isRecord(raw)) {
    return { total: 0, items: [] };
  }

  const items = Array.isArray(raw.items) ? raw.items : [];

  return {
    total: toNumber(raw.total) ?? items.length,
    items: normalizeItems(items),
    page: toNumber(raw.page) ?? undefined,
    size: toNumber(raw.size) ?? undefined,
  };
};

const normalizeCourseRankingItems = (items: unknown[]): CourseRankingItem[] =>
  items.flatMap((raw, index) => {
    if (!isRecord(raw)) return [];

    return [
      {
        rank: toNumber(raw.rank) ?? index + 1,
        id: toNumber(raw.id) ?? 0,
        name: toStringSafe(raw.name) ?? `课程 ${index + 1}`,
        course_type: toStringSafe(raw.course_type) as CourseRankingItem["course_type"],
        department_name: toStringSafe(raw.department_name),
        score: toNumber(raw.score) ?? 0,
        avg_score: toNumber(raw.avg_score),
        avg_homework: toNumber(raw.avg_homework),
        avg_gain: toNumber(raw.avg_gain),
        avg_exam_diff: toNumber(raw.avg_exam_diff),
        eval_count: toNumber(raw.eval_count),
        resource_count: toNumber(raw.resource_count),
        favorite_count: toNumber(raw.favorite_count),
        teachers: Array.isArray(raw.teachers) ? (raw.teachers as Record<string, unknown>[]).flatMap((t) => {
          if (typeof t !== "object" || t === null) return [];
          return [{ id: toNumber(t.id) ?? 0, name: toStringSafe(t.name) ?? "", title: toStringSafe(t.title), avatar_url: toStringSafe(t.avatar_url) }];
        }) : [],
      },
    ];
  });

const normalizeTeacherRankingItems = (items: unknown[]): TeacherRankingItem[] =>
  items.flatMap((raw, index) => {
    if (!isRecord(raw)) return [];

    return [
      {
        rank: toNumber(raw.rank) ?? index + 1,
        id: toNumber(raw.id) ?? 0,
        name: toStringSafe(raw.name) ?? `教师 ${index + 1}`,
        title: toStringSafe(raw.title),
        department_id: toNumber(raw.department_id),
        department_name: toStringSafe(raw.department_name),
        avatar_url: toStringSafe(raw.avatar_url),
        score: toNumber(raw.score) ?? 0,
        avg_score: toNumber(raw.avg_score),
        avg_quality: toNumber(raw.avg_quality),
        avg_grading: toNumber(raw.avg_grading),
        avg_attendance: toNumber(raw.avg_attendance),
        eval_count: toNumber(raw.eval_count),
        resource_count: toNumber(raw.resource_count),
        favorite_count: toNumber(raw.favorite_count),
        courses: Array.isArray(raw.courses) ? (raw.courses as Record<string, unknown>[]).flatMap((c) => {
          if (typeof c !== "object" || c === null) return [];
          return [{ id: toNumber(c.id) ?? 0, name: toStringSafe(c.name) ?? "" }];
        }) : [],
      },
    ];
  });

const normalizeResourcePreview = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    return [
      {
        id: toNumber(raw.id) ?? 0,
        title: toStringSafe(raw.title) ?? "未命名资料",
        resource_type: toStringSafe(raw.resource_type),
        downloads: toNumber(raw.downloads),
        likes: toNumber(raw.likes),
        created_at: toStringSafe(raw.created_at),
      },
    ];
  });
};

const normalizeResourceRankingItems = (items: unknown[]): ResourceRankingItem[] =>
  items.flatMap((raw, index) => {
    if (!isRecord(raw)) return [];

    return [
      {
        rank: toNumber(raw.rank) ?? index + 1,
        course_id: toNumber(raw.course_id) ?? toNumber(raw.id) ?? 0,
        course_name:
          toStringSafe(raw.course_name) ??
          toStringSafe(raw.name) ??
          `课程资源合集 ${index + 1}`,
        resource_count: toNumber(raw.resource_count),
        download_total: toNumber(raw.download_total) ?? toNumber(raw.downloads),
        view_total: toNumber(raw.view_total) ?? toNumber(raw.views),
        like_total: toNumber(raw.like_total) ?? toNumber(raw.likes),
        favorite_count: toNumber(raw.favorite_count),
        score: toNumber(raw.score),
        resources_preview: normalizeResourcePreview(raw.resources_preview),
      },
    ];
  });

export async function getCourseRankings(params: CourseRankingQuery) {
  const response = await service.get<ApiEnvelope<unknown>>("/rankings/courses", {
    params,
  });

  return normalizePaginated(unwrapResponseData(response), normalizeCourseRankingItems);
}

export async function getTeacherRankings(params: TeacherRankingQuery) {
  const response = await service.get<ApiEnvelope<unknown>>("/rankings/teachers", {
    params,
  });

  return normalizePaginated(unwrapResponseData(response), normalizeTeacherRankingItems);
}

export async function getResourceRankings(params: ResourceRankingQuery) {
  const response = await service.get<ApiEnvelope<unknown>>("/rankings/resources", {
    params,
  });

  return normalizePaginated(unwrapResponseData(response), normalizeResourceRankingItems);
}
