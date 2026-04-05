import { service } from "@/lib/request";
import type { AxiosResponse } from "axios";

interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
}

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  type?: string | null;
  is_pinned?: boolean;
  published_at?: string | null;
}

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null;

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

export async function listAnnouncements() {
  const response:
    | ApiEnvelope<{ items?: unknown[] }>
    | AxiosResponse<ApiEnvelope<{ items?: unknown[] }>> =
    await service.get<ApiEnvelope<{ items?: unknown[] }>>("/announcements");
  const payload =
    "status" in response && "headers" in response ? response.data : response;

  if (payload.code !== 0 && payload.code !== 200) {
    throw new Error(payload.msg || payload.message || "公告加载失败");
  }

  const data = isRecord(payload.data) ? payload.data : {};
  const items = Array.isArray(data.items) ? data.items : [];

  return items.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toNumber(item.id) ?? 0,
        title: toStringSafe(item.title) ?? "未命名公告",
        content: toStringSafe(item.content) ?? "",
        type: toStringSafe(item.type),
        is_pinned: Boolean(item.is_pinned),
        published_at: toStringSafe(item.published_at),
      } satisfies AnnouncementItem,
    ];
  });
}
