import { service } from "@/lib/request";
import { normalizeCourseType } from "@/lib/courseType";
import type { EntityId } from "@/types/entity";
import type {
  CourseShowcaseItem,
  ShowcaseTeacherBrief,
  SiteShowcaseStats,
  TeacherShowcaseItem,
} from "@/types/showcase";

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
  if (
    isRecord(firstLevel) &&
    typeof firstLevel.code === "number" &&
    "data" in firstLevel
  ) {
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

const toStringId = (value: unknown): EntityId | null => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const normalizeTeacherBriefs = (raw: unknown): ShowcaseTeacherBrief[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toStringId(item.id) ?? "",
        name: toStringSafe(item.name) ?? "未命名教师",
        title: toStringSafe(item.title),
        avatar_url: toStringSafe(item.avatar_url),
      },
    ];
  });
};

const normalizeCourseShowcaseItems = (raw: unknown): CourseShowcaseItem[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toStringId(item.id) ?? "",
        name: toStringSafe(item.name) ?? "未命名课程",
        course_type: normalizeCourseType(toStringSafe(item.course_type)),
        avg_score: toNumber(item.avg_score),
        avg_homework: toNumber(item.avg_homework),
        avg_gain: toNumber(item.avg_gain),
        avg_exam_diff: toNumber(item.avg_exam_diff),
        eval_count:
          toNumber(item.eval_count) ?? toNumber(item.evaluation_count),
        resource_count: toNumber(item.resource_count),
        teacher_count: toNumber(item.teacher_count),
        teachers: normalizeTeacherBriefs(item.teachers),
      },
    ];
  });
};

const normalizeTeacherShowcaseItems = (raw: unknown): TeacherShowcaseItem[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toStringId(item.id) ?? "",
        name: toStringSafe(item.name) ?? "未命名教师",
        title: toStringSafe(item.title),
        department_name: toStringSafe(item.department_name),
        avatar_url: toStringSafe(item.avatar_url),
        tutor_type: toStringSafe(item.tutor_type),
        avg_score: toNumber(item.avg_score),
        avg_quality: toNumber(item.avg_quality),
        avg_grading: toNumber(item.avg_grading),
        avg_attendance: toNumber(item.avg_attendance),
        good_rate: toNumber(item.good_rate),
        eval_count:
          toNumber(item.eval_count) ?? toNumber(item.evaluation_count),
        favorite_count: toNumber(item.favorite_count),
      },
    ];
  });
};

const normalizeShowcasePayload = (raw: unknown) => {
  if (!isRecord(raw)) return [];
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.list)) return raw.list;
  if (Array.isArray(raw.records)) return raw.records;
  return [];
};

const normalizeSiteShowcaseStats = (raw: unknown): SiteShowcaseStats => {
  const data = isRecord(raw) ? raw : {};

  return {
    user_count: toNumber(data.user_count) ?? toNumber(data.users_count) ?? 0,
    resource_count: toNumber(data.resource_count) ?? 0,
    evaluation_count:
      toNumber(data.evaluation_count) ?? toNumber(data.eval_count) ?? 0,
    teacher_count: toNumber(data.teacher_count) ?? 0,
    course_count: toNumber(data.course_count) ?? 0,
  };
};

async function withShowcaseFallback<T>(
  request: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await request();
  } catch {
    // Showcase modules are non-critical. Fall back to empty data when the API is unreachable.
    return fallback;
  }
}

export async function getRandomCourseShowcase() {
  return withShowcaseFallback(async () => {
    const response = await service.get<ApiEnvelope<unknown>>(
      "/courses/random-showcase",
    );
    const raw = normalizeShowcasePayload(unwrapResponseData(response));
    return normalizeCourseShowcaseItems(raw);
  }, []);
}

export async function getRandomTeacherShowcase() {
  return withShowcaseFallback(async () => {
    const response = await service.get<ApiEnvelope<unknown>>(
      "/teachers/random-showcase",
    );
    const raw = normalizeShowcasePayload(unwrapResponseData(response));
    return normalizeTeacherShowcaseItems(raw);
  }, []);
}

export async function getSiteShowcaseStats() {
  return withShowcaseFallback(
    async () => {
      const response =
        await service.get<ApiEnvelope<unknown>>("/showcase/stats");
      return normalizeSiteShowcaseStats(unwrapResponseData(response));
    },
    {
      user_count: 0,
      resource_count: 0,
      evaluation_count: 0,
      teacher_count: 0,
      course_count: 0,
    },
  );
}
