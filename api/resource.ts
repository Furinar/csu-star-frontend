import axios, { AxiosProgressEvent } from "axios";
import { service } from "@/lib/request";
import type {
  CourseSuggestionItem,
  ResourceCreateInput,
  ResourceDownloadResponse,
  ResourceUploadResponse,
} from "@/types/resource";

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

const normalizeCourseSuggestionItems = (raw: unknown): CourseSuggestionItem[] => {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];

    return [
      {
        id: toNumber(item.id) ?? 0,
        name: toStringSafe(item.name) ?? "未命名课程",
        course_type: (toStringSafe(item.course_type) as CourseSuggestionItem["course_type"]) ?? null,
      },
    ];
  });
};

const normalizeResourceUploadResponse = (raw: unknown): ResourceUploadResponse => {
  const data = isRecord(raw) ? raw : {};
  const uploadUrls = Array.isArray(data.upload_urls) ? data.upload_urls : [];

  return {
    resource_id: toNumber(data.resource_id) ?? 0,
    upload_urls: uploadUrls.flatMap((item) => {
      if (!isRecord(item)) return [];

      const headers = isRecord(item.headers)
        ? Object.fromEntries(
          Object.entries(item.headers).flatMap(([key, value]) =>
            typeof value === "string" ? [[key, value]] : [],
          ),
        )
        : null;

      return [
        {
          file_id: toStringSafe(item.file_id) ?? "",
          url: toStringSafe(item.url) ?? "",
          method: toStringSafe(item.method) ?? "PUT",
          headers,
        },
      ];
    }),
  };
};

const normalizeDownloadResponse = (raw: unknown): ResourceDownloadResponse => {
  const data = isRecord(raw) ? raw : {};

  return {
    url: toStringSafe(data.url) ?? "",
    expires_in: toNumber(data.expires_in),
    remaining_points: toNumber(data.remaining_points),
    free_download_count: toNumber(data.free_download_count),
  };
};

export async function createResource(payload: ResourceCreateInput) {
  const response = await service.post<ApiEnvelope<unknown>>("/resources", payload);
  return normalizeResourceUploadResponse(unwrapResponseData(response));
}

export async function searchCourseSuggestions(query: string) {
  const response = await service.get<ApiEnvelope<unknown>>("/courses/simple", {
    params: { q: query },
  });

  const raw = unwrapResponseData(response);
  if (isRecord(raw) && Array.isArray(raw.items)) {
    return normalizeCourseSuggestionItems(raw.items);
  }

  return normalizeCourseSuggestionItems(raw);
}

export async function downloadResourceFile(resourceId: number, fileId?: string) {
  const response = await service.get<ApiEnvelope<unknown>>(`/resources/${resourceId}/download`, {
    params: fileId ? { file_id: fileId } : undefined,
  });

  return normalizeDownloadResponse(unwrapResponseData(response));
}

export async function uploadResourceFileToCos({
  url,
  file,
  contentType,
  headers,
  onProgress,
}: {
  url: string;
  file: Blob;
  contentType: string;
  headers?: Record<string, string> | null;
  onProgress?: (progress: number, event: AxiosProgressEvent) => void;
}) {
  return axios.put(url, file, {
    headers: {
      "Content-Type": contentType,
      ...(headers ?? {}),
    },
    onUploadProgress: (event) => {
      const total = event.total ?? file.size ?? 0;
      const progress = total > 0 ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;
      onProgress?.(progress, event);
    },
  });
}
