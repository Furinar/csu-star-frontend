import { service } from "@/lib/request";
import type {
  PaginatedData,
  SearchCourseItem,
  SearchQuery,
  SearchResourceCard,
  SearchResponse,
  SearchTeacherBrief,
  SearchTeacherItem,
} from "@/types/search";

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

const unwrapPaginatedPayload = (raw: unknown): AnyRecord | null => {
  if (!isRecord(raw)) return null;

  if (Array.isArray(raw.items)) return raw;

  if (isRecord(raw.items)) {
    const nested = raw.items;
    if (
      Array.isArray(nested.items) ||
      Array.isArray(nested.records) ||
      Array.isArray(nested.list)
    ) {
      return nested;
    }
  }

  if (
    Array.isArray(raw.records) ||
    Array.isArray(raw.list)
  ) {
    return raw;
  }

  return raw;
};

const normalizePaginated = <T>(
  raw: unknown,
  normalizeItems: (items: unknown[]) => T[],
): PaginatedData<T> => {
  const payload = unwrapPaginatedPayload(raw);

  if (!payload) {
    return { total: 0, items: [] };
  }

  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.records)
      ? payload.records
      : Array.isArray(payload.list)
        ? payload.list
        : [];

  return {
    total:
      toNumber(payload.total) ??
      toNumber(payload.count) ??
      toNumber(payload.total_count) ??
      items.length,
    items: normalizeItems(items),
    page: toNumber(payload.page) ?? toNumber(payload.current) ?? undefined,
    size: toNumber(payload.size) ?? toNumber(payload.page_size) ?? undefined,
  };
};

const normalizeTeacherBriefs = (items: unknown): SearchTeacherBrief[] => {
  if (!Array.isArray(items)) return [];

  return items.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    return [
      {
        id: toNumber(raw.id) ?? 0,
        name: toStringSafe(raw.name) ?? "未命名教师",
        title: toStringSafe(raw.title),
        avatar_url: toStringSafe(raw.avatar_url),
      },
    ];
  });
};

const normalizeCourseItems = (items: unknown[]): SearchCourseItem[] =>
  items.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    const teachers = normalizeTeacherBriefs(raw.teachers);

    return [
      {
        id: toNumber(raw.id) ?? 0,
        name: toStringSafe(raw.name) ?? "未命名课程",
        course_type: toStringSafe(raw.course_type) as SearchCourseItem["course_type"],
        avg_score: toNumber(raw.avg_score),
        avg_homework: toNumber(raw.avg_homework),
        avg_gain: toNumber(raw.avg_gain),
        avg_exam_diff: toNumber(raw.avg_exam_diff),
        eval_count: toNumber(raw.eval_count),
        resource_count: toNumber(raw.resource_count),
        hot_score: toNumber(raw.hot_score),
        teachers,
        teacher_count: toNumber(raw.teacher_count) ?? teachers.length,
      },
    ];
  });

const normalizeTeacherItems = (items: unknown[]): SearchTeacherItem[] =>
  items.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    return [
      {
        id: toNumber(raw.id) ?? 0,
        name: toStringSafe(raw.name) ?? "未命名教师",
        department_id: toNumber(raw.department_id),
        department_name: toStringSafe(raw.department_name),
        title: toStringSafe(raw.title),
        avatar_url: toStringSafe(raw.avatar_url),
        avg_score: toNumber(raw.avg_score),
        avg_quality: toNumber(raw.avg_quality),
        avg_grading: toNumber(raw.avg_grading),
        avg_attendance: toNumber(raw.avg_attendance),
        good_rate: toNumber(raw.good_rate),
        eval_count: toNumber(raw.eval_count),
        resource_count: toNumber(raw.resource_count),
        hot_score: toNumber(raw.hot_score),
        courses: Array.isArray(raw.courses) ? (raw.courses as Record<string, unknown>[]).flatMap((c) => {
          if (typeof c !== "object" || c === null) return [];
          return [{ id: toNumber(c.id) ?? 0, name: toStringSafe(c.name) ?? "" }];
        }) : [],
      },
    ];
  });

const normalizeResourcePreview = (items: unknown) => {
  if (!Array.isArray(items)) return [];

  return items.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    return [
      {
        id: toNumber(raw.id) ?? 0,
        title: toStringSafe(raw.title) ?? "未命名资料",
        resource_type: toStringSafe(raw.resource_type),
      },
    ];
  });
};

const normalizeResourceItems = (items: unknown[]): SearchResourceCard[] =>
  items.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    const courseId = toNumber(raw.course_id) ?? toNumber(raw.id) ?? 0;

    return [
      {
        course_id: courseId,
        course_name:
          toStringSafe(raw.course_name) ??
          toStringSafe(raw.name) ??
          `课程 ${courseId}`,
        course_type: toStringSafe(raw.course_type) as SearchResourceCard["course_type"],
        avg_score: toNumber(raw.avg_score),
        resource_count: toNumber(raw.resource_count) ?? 0,
        download_total: toNumber(raw.download_total) ?? toNumber(raw.downloads),
        like_total: toNumber(raw.like_total) ?? toNumber(raw.likes),
        hot_score: toNumber(raw.hot_score),
        updated_at: toStringSafe(raw.updated_at),
        resources_preview: normalizeResourcePreview(raw.resources_preview),
      },
    ];
  });

const splitUnifiedSearchItems = (items: unknown[]) => {
  const grouped = {
    resources: [] as unknown[],
    courses: [] as unknown[],
    teachers: [] as unknown[],
  };

  items.forEach((item) => {
    if (!isRecord(item)) return;

    const rawType = toStringSafe(item.type);

    if (rawType === "course") {
      grouped.courses.push(item);
      return;
    }

    if (rawType === "teacher") {
      grouped.teachers.push(item);
      return;
    }

    if (rawType === "resource" || rawType === "resource_course") {
      grouped.resources.push(item);
    }
  });

  return grouped;
};

export async function searchEverything(params: SearchQuery): Promise<SearchResponse> {
  const response = await service.get<ApiEnvelope<unknown>>("/search", {
    params: {
      q: params.q,
      type: params.type ?? "all",
      page: params.page ?? 1,
      size: params.size ?? 24,
    },
  });

  const payload = unwrapResponseData(response);
  const raw = isRecord(payload) ? payload : {};

  if (Array.isArray(raw.items)) {
    const grouped = splitUnifiedSearchItems(raw.items);
    const total = toNumber(raw.total) ?? raw.items.length;

    return {
      resources: {
        total,
        items: normalizeResourceItems(grouped.resources),
      },
      courses: {
        total,
        items: normalizeCourseItems(grouped.courses),
      },
      teachers: {
        total,
        items: normalizeTeacherItems(grouped.teachers),
      },
    };
  }

  return {
    resources: normalizePaginated(raw.resources, normalizeResourceItems),
    courses: normalizePaginated(raw.courses, normalizeCourseItems),
    teachers: normalizePaginated(raw.teachers, normalizeTeacherItems),
  };
}
