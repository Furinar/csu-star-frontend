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

const fallbackSortMap: Record<ResourceRankingQuery["rank_type"], "hot_score" | "created_at" | "downloads" | "semester"> = {
  comprehensive: "hot_score",
  downloads: "downloads",
  semester: "semester",
  created_at: "created_at",
  hot_score: "hot_score",
  likes: "hot_score",
};

const toTimestamp = (value?: string) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildComprehensiveScore = (item: ResourceRankingItem, maxes: { downloads: number; hot: number; likes: number }) => {
  if (typeof item.score === "number" && Number.isFinite(item.score) && item.score > 0) {
    return item.score;
  }

  const downloadWeight = 0.4;
  const hotWeight = 0.4;
  const likesWeight = 0.2;

  const downloadPart = (item.downloads || 0) / maxes.downloads;
  const hotPart = (item.hot_score || 0) / maxes.hot;
  const likePart = (item.likes || 0) / maxes.likes;

  return downloadPart * downloadWeight + hotPart * hotWeight + likePart * likesWeight;
};

const sortResourceItems = (
  items: ResourceRankingItem[],
  rankType: ResourceRankingQuery["rank_type"],
  isIncreased = false
) => {
  if (items.length <= 1) return items;

  const factor = isIncreased ? 1 : -1;
  const maxes = {
    downloads: Math.max(...items.map((item) => item.downloads || 0), 1),
    hot: Math.max(...items.map((item) => item.hot_score || 0), 1),
    likes: Math.max(...items.map((item) => item.likes || 0), 1),
  };

  const sorted = [...items].sort((a, b) => {
    let diff = 0;

    if (rankType === "comprehensive") {
      diff = buildComprehensiveScore(a, maxes) - buildComprehensiveScore(b, maxes);
    } else if (rankType === "downloads") {
      diff = (a.downloads || 0) - (b.downloads || 0);
    } else if (rankType === "semester") {
      const semesterA = `${a.semester_start || ""}-${a.semester_end || ""}`;
      const semesterB = `${b.semester_start || ""}-${b.semester_end || ""}`;
      diff = semesterA.localeCompare(semesterB);
      if (diff === 0) {
        diff = (a.downloads || 0) - (b.downloads || 0);
      }
    } else if (rankType === "created_at") {
      diff = toTimestamp(a.created_at) - toTimestamp(b.created_at);
    } else if (rankType === "hot_score") {
      diff = (a.hot_score || 0) - (b.hot_score || 0);
    } else if (rankType === "likes") {
      diff = (a.likes || 0) - (b.likes || 0);
    }

    if (diff === 0) {
      diff = (a.id || 0) - (b.id || 0);
    }

    return diff * factor;
  });

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
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
  const query = {
    rank_type: params.rank_type,
    period: params.period,
    page: params.page,
    size: params.size,
    is_increased: params.is_increased,
  };

  try {
    const response = await service.get<ApiEnvelope<unknown>>("/rankings/resources", {
      params: query,
    });
    const normalized = normalizePaginated(unwrapResponseData(response), normalizeResourceItems);

    const hasDetailedFields = normalized.items.some(
      (item) =>
        typeof item.downloads !== "undefined" ||
        typeof item.likes !== "undefined" ||
        typeof item.hot_score !== "undefined" ||
        typeof item.created_at === "string"
    );

    if (hasDetailedFields || normalized.items.length === 0) {
      return {
        ...normalized,
        items: sortResourceItems(normalized.items, params.rank_type, params.is_increased),
      };
    }
  } catch {
    // 使用资源列表接口做兜底，避免排行榜接口返回结构异常导致页面不可用。
  }

  const fallback = await service.get<ApiEnvelope<unknown>>("/resources", {
    params: {
      sort: fallbackSortMap[params.rank_type],
      page: params.page,
      size: params.size,
    },
  });

  const normalized = normalizePaginated(unwrapResponseData(fallback), normalizeResourceItems);

  return {
    ...normalized,
    items: sortResourceItems(normalized.items, params.rank_type, params.is_increased),
  };
}

export async function getCourseDetail(id: number) {
  const response = await service.get<ApiEnvelope<CourseDetail>>(`/courses/${id}`);
  return unwrapResponseData(response) as CourseDetail;
}

export async function getTeacherDetail(id: number) {
  const response = await service.get<ApiEnvelope<TeacherDetail>>(`/teachers/${id}`);
  return unwrapResponseData(response) as TeacherDetail;
}
