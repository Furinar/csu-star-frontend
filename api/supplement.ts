import { service } from "@/lib/request";
import type { AxiosResponse } from "axios";
import type {
  CreateSupplementRequestInput,
  ReviewSupplementRequestInput,
  SupplementRequestItem,
  SupplementRequestStatus,
  SupplementRequestType,
} from "@/types/supplement";
import { normalizeCourseType } from "@/lib/courseType";
import type { Role } from "@/types/auth";

interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
}

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null;

const unwrap = async <T>(
  request: Promise<ApiEnvelope<T> | AxiosResponse<ApiEnvelope<T>>>,
): Promise<T> => {
  const response = await request;
  const payload =
    "status" in response && "headers" in response ? response.data : response;

  if (payload.code !== 0 && payload.code !== 200) {
    throw new Error(payload.msg || payload.message || "请求失败");
  }

  return payload.data;
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

const toStringArray = (value: unknown): string[] | null => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string") return [item];
      if (typeof item === "number" && Number.isFinite(item)) return [String(item)];
      return [];
    });
  }
  return null;
};

const toStringId = (value: unknown): string | null => {
  const numeric = toNumber(value);
  if (numeric !== null) return String(numeric);
  return toStringSafe(value);
};

const normalizeSupplementRequestItem = (
  raw: unknown,
): SupplementRequestItem | null => {
  if (!isRecord(raw)) return null;

  const user = isRecord(raw.user) ? raw.user : null;

  return {
    id: toStringId(raw.id) ?? "0",
    user_id: toStringId(raw.user_id) ?? "0",
    user: user
      ? {
          id: toStringId(user.id) ?? "0",
          nickname: toStringSafe(user.nickname) ?? "未知用户",
          avatar_url: toStringSafe(user.avatar_url),
          role: (toStringSafe(user.role) ?? "student") as Role,
        }
      : null,
    request_type:
      (toStringSafe(raw.request_type) as SupplementRequestType | null) ?? "course",
    status:
      (toStringSafe(raw.status) as SupplementRequestStatus | null) ?? "pending",
    contact: toStringSafe(raw.contact) ?? "",
    teacher_name: toStringSafe(raw.teacher_name),
    department_id: toNumber(raw.department_id),
    department_name: toStringSafe(raw.department_name),
    related_course_ids: toStringArray(raw.related_course_ids),
    related_course_name: toStringSafe(raw.related_course_name),
    related_course_names: toStringArray(raw.related_course_names),
    related_teacher_ids: toStringArray(raw.related_teacher_ids),
    related_teacher_names: toStringArray(raw.related_teacher_names),
    course_name: toStringSafe(raw.course_name),
    course_type: normalizeCourseType(toStringSafe(raw.course_type)),
    remark: toStringSafe(raw.remark),
    reviewed_by: toStringId(raw.reviewed_by),
    reviewed_at: toStringSafe(raw.reviewed_at),
    review_note: toStringSafe(raw.review_note),
    approved_target_type: (toStringSafe(raw.approved_target_type) as SupplementRequestType | null) ?? null,
    approved_target_id: toStringId(raw.approved_target_id),
    created_at: toStringSafe(raw.created_at) ?? "",
    updated_at: toStringSafe(raw.updated_at) ?? "",
  };
};

export function createSupplementRequest(payload: CreateSupplementRequestInput) {
  return unwrap<unknown>(
    service.post<ApiEnvelope<unknown>>("/supplement-requests", payload),
  ).then((data) => normalizeSupplementRequestItem(data));
}

export function listSupplementRequests(params?: {
  status?: SupplementRequestStatus;
  request_type?: SupplementRequestType;
  keyword?: string;
  page?: number;
  size?: number;
}) {
  return unwrap<{ items?: unknown[]; total?: number }>(
    service.get<ApiEnvelope<{ items?: unknown[]; total?: number }>>(
      "/admin/supplement-requests",
      { params },
    ),
  ).then((data) => ({
    items: Array.isArray(data?.items)
      ? data.items.flatMap((item) => {
          const normalized = normalizeSupplementRequestItem(item);
          return normalized ? [normalized] : [];
        })
      : [],
    total: typeof data?.total === "number" ? data.total : 0,
  }));
}

export function getSupplementRequestDetail(id: string | number) {
  return unwrap<unknown>(
    service.get<ApiEnvelope<unknown>>(`/admin/supplement-requests/${id}`),
  ).then((data) => normalizeSupplementRequestItem(data));
}

export function approveSupplementRequest(
  id: string | number,
  payload?: ReviewSupplementRequestInput,
) {
  return unwrap<unknown>(
    service.post<ApiEnvelope<unknown>>(
      `/admin/supplement-requests/${id}/approve`,
      payload ?? {},
    ),
  ).then((data) => normalizeSupplementRequestItem(data));
}

export function rejectSupplementRequest(
  id: string | number,
  payload: ReviewSupplementRequestInput,
) {
  return unwrap<unknown>(
    service.post<ApiEnvelope<unknown>>(
      `/admin/supplement-requests/${id}/reject`,
      payload,
    ),
  ).then((data) => normalizeSupplementRequestItem(data));
}
