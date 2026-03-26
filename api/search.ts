import { service } from "@/lib/request";
import type {
  PaginatedData,
  SearchCourseItem,
  SearchQuery,
  SearchResourceCard,
  SearchResourceHit,
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

interface CourseDetailSummary {
  id: number;
  name: string;
  course_type?: string | null;
  credits?: number | null;
  avg_score?: number | null;
  resource_count?: number | null;
  download_total?: number | null;
  hot_score?: number | null;
  teachers: SearchTeacherBrief[];
}

const courseSummaryCache = new Map<number, Promise<CourseDetailSummary | null>>();

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

const toOptionalNumber = (value: unknown): number | null => {
  if (value === null || typeof value === "undefined") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toStringSafe = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const toOptionalString = (value: unknown): string | null => {
  if (value === null || typeof value === "undefined") return null;
  return typeof value === "string" ? value : null;
};

const unwrapResponseData = (payload: unknown): unknown => {
  if (!isRecord(payload)) return undefined;

  const firstLevel = payload.data;
  if (
    isRecord(firstLevel) &&
    typeof firstLevel.code === "number" &&
    "data" in firstLevel
  ) {
    return firstLevel.data;
  }

  return firstLevel;
};

const normalizePaginated = <T>(
  raw: unknown,
  normalizeItems: (items: unknown[]) => T[],
): PaginatedData<T> => {
  if (!isRecord(raw)) {
    return { total: 0, items: [] };
  }

  const rawItems = Array.isArray(raw.items) ? raw.items : [];

  return {
    total: toNumber(raw.total, rawItems.length),
    items: normalizeItems(rawItems),
    page: typeof raw.page !== "undefined" ? toNumber(raw.page, 1) : undefined,
    size:
      typeof raw.size !== "undefined"
        ? toNumber(raw.size, rawItems.length)
        : undefined,
  };
};

const normalizeCourseItems = (items: unknown[]): SearchCourseItem[] =>
  items.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    return [
      {
        id: toNumber(raw.id, 0),
        name: toStringSafe(raw.name, "未命名课程"),
        course_type: toOptionalString(raw.course_type),
        credits: toOptionalNumber(raw.credits),
        avg_score: toOptionalNumber(raw.avg_score),
        avg_homework: toOptionalNumber(raw.avg_homework),
        avg_gain: toOptionalNumber(raw.avg_gain),
        avg_exam_diff: toOptionalNumber(raw.avg_exam_diff),
        eval_count: toOptionalNumber(raw.eval_count),
        resource_count: toOptionalNumber(raw.resource_count),
        hot_score: toOptionalNumber(raw.hot_score),
      },
    ];
  });

const normalizeTeacherItems = (items: unknown[]): SearchTeacherItem[] =>
  items.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    return [
      {
        id: toNumber(raw.id, 0),
        name: toStringSafe(raw.name, "未命名教师"),
        department_id: toOptionalNumber(raw.department_id),
        title: toOptionalString(raw.title),
        avatar_url: toOptionalString(raw.avatar_url),
        avg_score: toOptionalNumber(raw.avg_score),
        avg_quality: toOptionalNumber(raw.avg_quality),
        avg_grading: toOptionalNumber(raw.avg_grading),
        avg_attendance: toOptionalNumber(raw.avg_attendance),
        good_rate: toOptionalNumber(raw.good_rate),
        eval_count: toOptionalNumber(raw.eval_count),
        resource_count: toOptionalNumber(raw.resource_count),
        hot_score: toOptionalNumber(raw.hot_score),
      },
    ];
  });

const normalizeResourceHits = (items: unknown[]): SearchResourceHit[] =>
  items.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    return [
      {
        id: toNumber(raw.id, 0),
        title: toStringSafe(raw.title, "未命名资源"),
        course_id: toNumber(raw.course_id, 0),
        resource_type: toOptionalString(raw.resource_type),
        semester_start: toOptionalString(raw.semester_start),
        semester_end: toOptionalString(raw.semester_end),
        downloads: toOptionalNumber(raw.downloads),
        views: toOptionalNumber(raw.views),
        likes: toOptionalNumber(raw.likes),
        hot_score: toOptionalNumber(raw.hot_score),
        created_at: toOptionalString(raw.created_at),
      },
    ];
  });

const normalizeTeacherBriefs = (items: unknown[]): SearchTeacherBrief[] =>
  items.flatMap((raw) => {
    if (!isRecord(raw)) return [];

    return [
      {
        id: toNumber(raw.id, 0),
        name: toStringSafe(raw.name, "未命名教师"),
        title: toOptionalString(raw.title),
      },
    ];
  });

const normalizeCourseDetail = (raw: unknown): CourseDetailSummary | null => {
  if (!isRecord(raw)) return null;

  return {
    id: toNumber(raw.id, 0),
    name: toStringSafe(raw.name, "未命名课程"),
    course_type: toOptionalString(raw.course_type),
    credits: toOptionalNumber(raw.credits),
    avg_score: toOptionalNumber(raw.avg_score),
    resource_count: toOptionalNumber(raw.resource_count),
    download_total: toOptionalNumber(raw.download_total),
    hot_score: toOptionalNumber(raw.hot_score),
    teachers: Array.isArray(raw.teachers)
      ? normalizeTeacherBriefs(raw.teachers)
      : [],
  };
};

async function getCourseDetailSummary(id: number) {
  if (!courseSummaryCache.has(id)) {
    courseSummaryCache.set(
      id,
      service
        .get<ApiEnvelope<unknown>>(`/courses/${id}`)
        .then((response) => normalizeCourseDetail(unwrapResponseData(response)))
        .catch(() => null),
    );
  }

  return courseSummaryCache.get(id)!;
}

async function buildResourceCards(raw: PaginatedData<SearchResourceHit>) {
  const grouped = new Map<number, SearchResourceHit[]>();

  raw.items.forEach((item) => {
    if (!item.course_id) return;

    const current = grouped.get(item.course_id) ?? [];
    current.push(item);
    grouped.set(item.course_id, current);
  });

  const courseIds = Array.from(grouped.keys());
  const detailEntries = await Promise.all(
    courseIds.map(async (courseId) => [courseId, await getCourseDetailSummary(courseId)] as const),
  );
  const detailMap = new Map<number, CourseDetailSummary | null>(detailEntries);

  const cards: SearchResourceCard[] = courseIds.map((courseId) => {
    const hits = grouped.get(courseId) ?? [];
    const detail = detailMap.get(courseId);
    const downloadFallback = hits.reduce(
      (total, item) => total + (item.downloads ?? 0),
      0,
    );
    const matchedTypes = Array.from(
      new Set(
        hits
          .map((item) => item.resource_type)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    return {
      id: courseId,
      course_id: courseId,
      course_name: detail?.name ?? `课程 ${courseId}`,
      course_type: detail?.course_type ?? null,
      credits: detail?.credits ?? null,
      avg_score: detail?.avg_score ?? null,
      resource_count: detail?.resource_count ?? hits.length,
      download_total: detail?.download_total ?? downloadFallback,
      matched_resource_count: hits.length,
      matched_resource_types: matchedTypes,
      hot_score: detail?.hot_score ?? null,
    };
  });

  return {
    total: cards.length,
    items: cards,
    page: raw.page,
    size: raw.size,
  } satisfies PaginatedData<SearchResourceCard>;
}

async function buildCourseCards(raw: PaginatedData<SearchCourseItem>) {
  const items = await Promise.all(
    raw.items.map(async (item) => {
      if (!item.id) {
        return {
          ...item,
          teachers: item.teachers ?? [],
          teacher_count: item.teacher_count ?? 0,
        };
      }

      const detail = await getCourseDetailSummary(item.id);
      const teachers = detail?.teachers ?? [];

      return {
        ...item,
        course_type: detail?.course_type ?? item.course_type ?? null,
        credits: detail?.credits ?? item.credits ?? null,
        avg_score: detail?.avg_score ?? item.avg_score ?? null,
        resource_count: detail?.resource_count ?? item.resource_count ?? null,
        hot_score: detail?.hot_score ?? item.hot_score ?? null,
        download_total: detail?.download_total ?? item.download_total ?? null,
        teachers,
        teacher_count: teachers.length,
      } satisfies SearchCourseItem;
    }),
  );

  return {
    ...raw,
    items,
  } satisfies PaginatedData<SearchCourseItem>;
}

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

  const rawCourseResult = normalizePaginated(raw.courses, normalizeCourseItems);
  const teacherResult = normalizePaginated(raw.teachers, normalizeTeacherItems);
  const resourceHits = normalizePaginated(raw.resources, normalizeResourceHits);
  const courseResult = await buildCourseCards(rawCourseResult);
  const resourceResult = await buildResourceCards(resourceHits);

  return {
    resources: resourceResult,
    courses: courseResult,
    teachers: teacherResult,
  };
}
