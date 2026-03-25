import { service } from "@/lib/request";
import {
  CourseDetail,
  CourseRankingQuery,
  PaginatedData,
  RankingItem,
  ResourceRankingItem,
  ResourceRankingQuery,
  TeacherDetail,
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

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toStringSafe = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const unwrapResponseData = (payload: unknown): unknown => {
  if (!isRecord(payload)) return undefined;

  const firstLevel = payload.data;
  if (isRecord(firstLevel) && typeof firstLevel.code === "number" && "data" in firstLevel) {
    return firstLevel.data;
  }

  return firstLevel;
};

const normalizeRankingItems = (rawItems: unknown[]): RankingItem[] => {
  const items: RankingItem[] = [];

  rawItems.forEach((raw, index) => {
    if (!isRecord(raw)) return;

    items.push({
      rank: toNumber(raw.rank, index + 1),
      id: toNumber(raw.id, index + 1),
      name: toStringSafe(raw.name, `#${index + 1}`),
      department_name:
        raw.department_name === null
          ? null
          : toStringSafe(raw.department_name, "") || null,
      score: toNumber(raw.score, 0),
    });
  });

  return items;
};

const normalizeResourceItems = (rawItems: unknown[]): ResourceRankingItem[] => {
  return rawItems.map((raw, index) => {
    if (!isRecord(raw)) {
      const title = toStringSafe(raw, `资源 #${index + 1}`);
      return {
        rank: index + 1,
        id: index + 1,
        title,
        name: title,
      };
    }

    const title =
      toStringSafe(raw.title, "") || toStringSafe(raw.name, `资源 #${index + 1}`);

    return {
      rank: toNumber(raw.rank, index + 1),
      id: toNumber(raw.id, index + 1),
      title,
      name: toStringSafe(raw.name, ""),
      score:
        typeof raw.score !== "undefined" ? toNumber(raw.score, 0) : undefined,
      course_id:
        typeof raw.course_id !== "undefined"
          ? toNumber(raw.course_id, 0)
          : undefined,
      course_name: toStringSafe(raw.course_name, ""),
      resource_type: toStringSafe(raw.resource_type, ""),
      semester_start:
        typeof raw.semester_start === "string" || raw.semester_start === null
          ? raw.semester_start
          : undefined,
      semester_end:
        typeof raw.semester_end === "string" || raw.semester_end === null
          ? raw.semester_end
          : undefined,
      points_cost:
        typeof raw.points_cost !== "undefined"
          ? toNumber(raw.points_cost, 0)
          : undefined,
      downloads:
        typeof raw.downloads !== "undefined"
          ? toNumber(raw.downloads, 0)
          : undefined,
      views:
        typeof raw.views !== "undefined" ? toNumber(raw.views, 0) : undefined,
      likes:
        typeof raw.likes !== "undefined" ? toNumber(raw.likes, 0) : undefined,
      hot_score:
        typeof raw.hot_score !== "undefined"
          ? toNumber(raw.hot_score, 0)
          : undefined,
      created_at: toStringSafe(raw.created_at, ""),
    };
  });
};

const normalizePaginated = <T>(raw: unknown, normalizeItems: (input: unknown[]) => T[]): PaginatedData<T> => {
  if (!isRecord(raw)) {
    return { total: 0, items: [] };
  }

  const rawItems = Array.isArray(raw.items) ? raw.items : [];

  return {
    total: toNumber(raw.total, rawItems.length),
    items: normalizeItems(rawItems),
    page: typeof raw.page !== "undefined" ? toNumber(raw.page, 1) : undefined,
    size: typeof raw.size !== "undefined" ? toNumber(raw.size, rawItems.length) : undefined,
  };
};

export async function getCourseRankings(params: CourseRankingQuery) {
  const response = await service.get<ApiEnvelope<unknown>>("/rankings/courses", {
    params,
  });

  return normalizePaginated(unwrapResponseData(response), normalizeRankingItems);
}

export async function getTeacherRankings(params: TeacherRankingQuery) {
  const response = await service.get<ApiEnvelope<unknown>>("/rankings/teachers", {
    params,
  });

  return normalizePaginated(unwrapResponseData(response), normalizeRankingItems);
}

export async function getResourceRankings(params: ResourceRankingQuery) {
  const response = await service.get<ApiEnvelope<unknown>>("/rankings/resources", {
    params: {
      rank_type: params.rank_type,
      period: params.period,
      page: params.page,
      size: params.size,
      is_increased: params.is_increased,
    },
  });

  return normalizePaginated(unwrapResponseData(response), normalizeResourceItems);
}

export async function getCourseDetail(id: number) {
  const response = await service.get<ApiEnvelope<CourseDetail>>(`/courses/${id}`);
  return unwrapResponseData(response) as CourseDetail;
}

export async function getTeacherDetail(id: number) {
  const response = await service.get<ApiEnvelope<TeacherDetail>>(`/teachers/${id}`);
  return unwrapResponseData(response) as TeacherDetail;
}
