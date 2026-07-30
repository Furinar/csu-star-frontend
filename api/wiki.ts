import { service } from "@/lib/request";
import type { AxiosResponse } from "axios";
import type {
  WikiDocDetail,
  WikiDocMeta,
  WikiGroup,
  WikiSectionKey,
  WikiSectionNode,
  WikiTree,
} from "@/types/wiki";

interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
}

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null;

const toStringSafe = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toStringId = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const toBool = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

function unwrapEnvelope<T>(
  response: ApiEnvelope<T> | AxiosResponse<ApiEnvelope<T>>,
  errorMessage: string,
): T {
  const payload =
    "status" in response && "headers" in response ? response.data : response;
  if (payload.code !== 0 && payload.code !== 200) {
    throw new Error(payload.msg || payload.message || errorMessage);
  }
  return payload.data;
}

function normalizeDocMeta(value: unknown): WikiDocMeta | null {
  if (!isRecord(value)) return null;
  const slug = toStringSafe(value.slug);
  const title = toStringSafe(value.title);
  if (!slug || !title) return null;
  return {
    id: toStringId(value.id) ?? slug,
    slug,
    title,
    sortOrder: toSortOrder(value.sort_order),
  };
}

function normalizeDocList(value: unknown): WikiDocMeta[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const doc = normalizeDocMeta(item);
    return doc ? [doc] : [];
  });
}

const toOptionalCount = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return undefined;
};

function toSortOrder(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.floor(n);
  }
  return 0;
}

function normalizeGroup(value: unknown): WikiGroup | null {
  if (!isRecord(value)) return null;
  const name = toStringSafe(value.name);
  if (!name) return null;
  const docs = normalizeDocList(value.docs);
  return {
    id: toStringId(value.id) ?? name,
    name,
    docCount: toOptionalCount(value.doc_count) ?? docs.length,
    sortOrder: toSortOrder(value.sort_order),
    docs,
  };
}

function normalizeSection(value: unknown): WikiSectionNode | null {
  if (!isRecord(value)) return null;
  const key =
    toStringSafe(value.section) ??
    toStringSafe(value.key) ??
    null;
  if (!key) return null;
  const title = toStringSafe(value.title) ?? key;
  const categories = Array.isArray(value.categories)
    ? value.categories.flatMap((c) => {
        const g = normalizeGroup(c);
        return g ? [g] : [];
      })
    : [];
  const docs = normalizeDocList(value.docs);
  const categoryDocCount = categories.reduce(
    (sum, g) => sum + (g.docCount ?? g.docs.length),
    0,
  );
  return {
    key,
    title,
    allowCategories: toBool(value.allow_categories, categories.length > 0),
    docCount:
      toOptionalCount(value.doc_count) ?? docs.length + categoryDocCount,
    categoryCount:
      toOptionalCount(value.category_count) ?? categories.length,
    docs,
    categories,
  };
}

export function getSectionNode(
  tree: WikiTree | null | undefined,
  key: string | null | undefined,
): WikiSectionNode | null {
  if (!tree || !key) return null;
  return tree.sections.find((s) => s.key === key) ?? null;
}

// ---------- 文档树(模块级缓存) ----------

const TREE_TTL = 5 * 60_000;
let treePromise: Promise<WikiTree> | null = null;
let treeFetchedAt = 0;

async function fetchWikiTree(): Promise<WikiTree> {
  const response = await service.get<ApiEnvelope<unknown>>("/wiki/tree");
  const data = unwrapEnvelope<unknown>(response, "文档目录加载失败");

  const rawSections =
    isRecord(data) && Array.isArray(data.sections) ? data.sections : [];
  const sections = rawSections.flatMap((raw) => {
    const sec = normalizeSection(raw);
    return sec ? [sec] : [];
  });
  return { sections };
}

export function getWikiTree(): Promise<WikiTree> {
  const now = Date.now();
  if (!treePromise || now - treeFetchedAt > TREE_TTL) {
    treeFetchedAt = now;
    treePromise = fetchWikiTree().catch((error) => {
      treePromise = null;
      throw error;
    });
  }
  return treePromise;
}

// ---------- 文档详情 ----------

const DOC_TTL = TREE_TTL;
const docCache = new Map<string, { detail: WikiDocDetail; fetchedAt: number }>();

export async function getWikiDoc(
  section: WikiSectionKey,
  slug: string,
): Promise<WikiDocDetail> {
  const cacheKey = `${section}:${slug}`;
  const cached = docCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt <= DOC_TTL) {
    return cached.detail;
  }

  const response = await service.get<ApiEnvelope<unknown>>(
    `/wiki/docs/${encodeURIComponent(section)}/${encodeURIComponent(slug)}`,
  );
  const data = unwrapEnvelope<unknown>(response, "文档加载失败");
  if (!isRecord(data)) throw new Error("文档数据格式异常");

  const detail: WikiDocDetail = {
    id: toStringId(data.id) ?? slug,
    section: toStringSafe(data.section) ?? section,
    categoryName: toStringSafe(data.category_name),
    slug: toStringSafe(data.slug) ?? slug,
    title: toStringSafe(data.title) ?? slug,
    content: toStringSafe(data.content) ?? "",
    updatedAt: toStringSafe(data.updated_at),
  };
  docCache.set(cacheKey, { detail, fetchedAt: Date.now() });
  return detail;
}
