import { service } from "@/lib/request";
import { DEPARTMENTS } from "@/data/departments";
import type { UserProfile } from "@/types/auth";
import type { EntityId } from "@/types/entity";
import axios from "axios";
import type {
  CheckinResult,
  ContributionSummary,
  CorrectionInput,
  CourseEvaluation,
  DownloadRecord,
  EmailBindInput,
  EmailStatus,
  FavoriteItem,
  FeedbackInput,
  HomeNotificationSummary,
  InviteCodeInfo,
  MyProfileUpdateInput,
  MeDashboardData,
  NotificationItem,
  OAuthBindInput,
  OAuthBindResult,
  PaginatedData,
  PointsRecord,
  ReportInput,
  ResourceItem,
  TeacherEvaluation,
} from "@/types/me";
import type { AxiosResponse } from "axios";

interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
}

interface PaginatedEnvelope<T> {
  items: T[] | null;
  total: number;
}

type AnyRecord = Record<string, unknown>;

const EMPTY_CONTRIBUTION_SUMMARY: ContributionSummary = {
  weeks: [],
  total_score: 0,
  active_days: 0,
  current_streak: 0,
  max_day_score: 0,
};

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

const toStringId = (value: unknown): EntityId | null => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
  }
  return null;
};

const normalizeNotificationItem = (item: unknown): NotificationItem | null => {
  if (!isRecord(item)) return null;

  const metadata = isRecord(item.metadata) ? item.metadata : null;
  const type = toStringSafe(item.type);
  const category = toStringSafe(item.category);
  const result = toStringSafe(item.result);
  const sourceType = toStringSafe(item.source_type);

  return {
    id: toStringId(item.id) ?? "",
    type:
      type === "liked" || type === "commented" || type === "system"
        ? type
        : "system",
    category:
      category === "announcement" ||
      category === "report" ||
      category === "correction" ||
      category === "feedback" ||
      category === "supplement" ||
      category === "admin_message" ||
      category === "points" ||
      category === "interaction"
        ? category
        : null,
    result:
      result === "inform" || result === "approved" || result === "rejected"
        ? result
        : null,
    title: toStringSafe(item.title) ?? "未命名通知",
    content: toStringSafe(item.content) ?? "",
    source_type:
      sourceType === "resource" ||
      sourceType === "teacher_evaluation" ||
      sourceType === "course_evaluation" ||
      sourceType === "comment" ||
      sourceType === "announcement"
        ? sourceType
        : null,
    source_id: toStringId(item.source_id),
    related_id: toStringId(item.related_id),
    is_read: toBoolean(item.is_read) ?? false,
    is_pinned: toBoolean(item.is_pinned) ?? false,
    metadata,
    created_at: toStringSafe(item.created_at) ?? "",
  };
};

const normalizeNotifications = (
  data: PaginatedData<unknown> | PaginatedEnvelope<unknown> | null | undefined,
): PaginatedData<NotificationItem> => {
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items: items.flatMap((item) => {
      const normalized = normalizeNotificationItem(item);
      return normalized ? [normalized] : [];
    }),
    total: typeof data?.total === "number" ? data.total : 0,
  };
};

const normalizeHomeNotificationSummary = (data: unknown): HomeNotificationSummary => {
  const record = isRecord(data) ? data : {};

  const normalizeList = (value: unknown) =>
    Array.isArray(value)
      ? value.flatMap((item) => {
          const normalized = normalizeNotificationItem(item);
          return normalized ? [normalized] : [];
        })
      : [];

  return {
    announcements: normalizeList(record.announcements),
    interactions: normalizeList(record.interactions),
    system_messages: normalizeList(record.system_messages),
  };
};

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

const normalizePaginated = <T>(
  data: PaginatedData<T> | PaginatedEnvelope<T> | null | undefined,
): PaginatedData<T> => ({
  items: Array.isArray(data?.items) ? data.items : [],
  total: typeof data?.total === "number" ? data.total : 0,
});

const normalizeDownloadRecords = (
  data: PaginatedData<unknown> | PaginatedEnvelope<unknown> | null | undefined,
): PaginatedData<DownloadRecord> => {
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items: items.flatMap((item) => {
      if (!isRecord(item)) return [];

      const resourceRecord = isRecord(item.resource) ? item.resource : null;
      const resourceId =
        toStringId(resourceRecord?.id) ?? toStringId(item.resource_id) ?? "";
      const resourceTitle =
        toStringSafe(resourceRecord?.title) ??
        toStringSafe(item.title) ??
        "未知资源";
      const resourceType =
        toStringSafe(resourceRecord?.resource_type) ?? "other";

      return [
        {
          id: toStringId(item.id) ?? "",
          created_at: toStringSafe(item.created_at) ?? "",
          resource: {
            id: resourceId,
            title: resourceTitle,
            resource_type: resourceType as DownloadRecord["resource"]["resource_type"],
          },
        },
      ];
    }),
    total: typeof data?.total === "number" ? data.total : 0,
  };
};

const normalizePointsReason = (value: unknown): PointsRecord["reason"] => {
  if (value === "daily_checkin" || value === "每日签到获得积分") {
    return "daily_checkin";
  }
  if (value === "upload_reward" || value === "上传资源获得积分") {
    return "upload_reward";
  }
  if (value === "evaluation_reward" || value === "发布评价获得积分") {
    return "evaluation_reward";
  }
  if (value === "download_cost" || value === "下载资源消耗积分") {
    return "download_cost";
  }
  if (value === "invite_reward" || value === "邀请新用户注册奖励积分") {
    return "invite_reward";
  }
  if (value === "invite_signup_reward" || value === "填写邀请码注册奖励积分") {
    return "invite_signup_reward";
  }
  if (value === "register_bonus" || value === "新用户注册初始积分") {
    return "register_bonus";
  }
  return "admin_adjust";
};

const normalizePointsRecords = (
  data: PaginatedData<unknown> | PaginatedEnvelope<unknown> | null | undefined,
): PaginatedData<PointsRecord> => {
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items: items.flatMap((item) => {
      if (!isRecord(item)) return [];

      return [
        {
          id: toStringId(item.id) ?? "",
          change_amount: toNumber(item.change_amount) ?? toNumber(item.delta) ?? 0,
          balance_after: toNumber(item.balance_after) ?? toNumber(item.balance) ?? 0,
          reason: normalizePointsReason(item.reason),
          reference_type: toStringSafe(item.reference_type),
          reference_id:
            toStringSafe(item.reference_id) ??
            toStringId(item.related_id),
          created_at: toStringSafe(item.created_at) ?? "",
        },
      ];
    }),
    total: typeof data?.total === "number" ? data.total : 0,
  };
};

export function listDepartments() {
  return Promise.resolve(DEPARTMENTS);
}

export function getMyProfile() {
  return unwrap<UserProfile>(service.get<ApiEnvelope<UserProfile>>("/me"));
}

export function updateMyProfile(payload: MyProfileUpdateInput) {
  return unwrap<UserProfile>(
    service.put<ApiEnvelope<UserProfile>>("/me", payload),
  );
}

export function getMyResources(params?: {
  page?: number;
  size?: number;
}) {
  return unwrap<PaginatedData<ResourceItem> | PaginatedEnvelope<ResourceItem>>(
    service.get<ApiEnvelope<PaginatedEnvelope<ResourceItem>>>("/me/resources", {
      params,
    }),
  ).then(normalizePaginated);
}

export function getMyDownloads(params?: { page?: number; size?: number }) {
  return unwrap<
    PaginatedData<unknown> | PaginatedEnvelope<unknown>
  >(
    service.get<ApiEnvelope<PaginatedEnvelope<unknown>>>(
      "/me/downloads",
      { params },
    ),
  ).then(normalizeDownloadRecords);
}

export function getMyTeacherEvaluations(params?: { page?: number; size?: number }) {
  return unwrap<
    PaginatedData<TeacherEvaluation> | PaginatedEnvelope<TeacherEvaluation>
  >(
    service.get<ApiEnvelope<PaginatedEnvelope<TeacherEvaluation>>>(
      "/me/teacher-evaluations",
      { params },
    ),
  ).then(normalizePaginated);
}

export function getMyCourseEvaluations(params?: { page?: number; size?: number }) {
  return unwrap<
    PaginatedData<CourseEvaluation> | PaginatedEnvelope<CourseEvaluation>
  >(
    service.get<ApiEnvelope<PaginatedEnvelope<CourseEvaluation>>>(
      "/me/course-evaluations",
      { params },
    ),
  ).then(normalizePaginated);
}

export function getMyFavorites(params?: {
  target_type?: "resource" | "course" | "teacher";
  page?: number;
  size?: number;
}) {
  return unwrap<PaginatedData<FavoriteItem> | PaginatedEnvelope<FavoriteItem>>(
    service.get<ApiEnvelope<PaginatedEnvelope<FavoriteItem>>>("/me/favorites", {
      params,
    }),
  ).then(normalizePaginated);
}

export function getMyPoints(params?: {
  reason?: PointsRecord["reason"];
  page?: number;
  size?: number;
}) {
  return unwrap<PaginatedData<unknown> | PaginatedEnvelope<unknown>>(
    service.get<ApiEnvelope<PaginatedEnvelope<unknown>>>("/me/points", {
      params,
    }),
  ).then(normalizePointsRecords);
}

export function getMyContributions() {
  return unwrap<ContributionSummary>(
    service.get<ApiEnvelope<ContributionSummary>>("/me/contributions"),
  );
}

export function dailyCheckin() {
  return unwrap<{ points?: number }>(
    service.post<ApiEnvelope<{ points?: number }>>("/me/checkin"),
  )
    .then((data) => ({
      balance_after: typeof data?.points === "number" ? data.points : null,
      points_gained: null,
      already_checked_in: false,
    }))
    .catch((error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        return {
          balance_after: null,
          points_gained: null,
          already_checked_in: true,
        } satisfies CheckinResult;
      }

      throw error;
    });
}

export function getMyEmailStatus() {
  return unwrap<EmailStatus>(
    service.get<ApiEnvelope<EmailStatus>>("/me/email-status"),
  );
}

export function getMyInviteCode() {
  return unwrap<InviteCodeInfo>(
    service.get<ApiEnvelope<InviteCodeInfo>>("/me/invite-code"),
  );
}

export function listMyNotifications(params?: {
  type?: NotificationItem["type"];
  is_read?: boolean;
  page?: number;
  size?: number;
}) {
  return unwrap<
    PaginatedData<NotificationItem> | PaginatedEnvelope<NotificationItem>
  >(
    service.get<ApiEnvelope<PaginatedEnvelope<NotificationItem>>>(
      "/me/notifications",
      { params },
    ),
  ).then(normalizeNotifications);
}

export function getHomeNotificationSummary() {
  return unwrap<HomeNotificationSummary | Record<string, unknown>>(
    service.get<ApiEnvelope<HomeNotificationSummary>>(
      "/me/home-notification-summary",
    ),
  ).then(normalizeHomeNotificationSummary);
}

export async function getUnreadNotificationCount() {
  const data = await unwrap<{ count: number }>(
    service.get<ApiEnvelope<{ count: number }>>(
      "/me/notifications/unread-count",
    ),
  );
  return data.count;
}

export function markNotificationRead(id: string) {
  return unwrap<null>(
    service.patch<ApiEnvelope<null>>(`/notifications/${id}/read`),
  );
}

export function markAllNotificationsRead() {
  return unwrap<null>(
    service.post<ApiEnvelope<null>>("/me/notifications/read-all"),
  );
}

export async function bindCampusEmail(payload: EmailBindInput) {
  return unwrap<null>(
    service.post<ApiEnvelope<null>>("/auth/email/bind", payload),
  );
}

export async function sendCampusEmailCaptcha(email: string) {
  const response = await service.post<ApiEnvelope<null>>("/auth/email/captcha", {
    email,
  });
  const payload =
    "status" in response && "headers" in response ? response.data : response;

  if (payload.code !== 0 && payload.code !== 200) {
    throw new Error(payload.msg || payload.message || "验证码发送失败");
  }

  return payload.msg || payload.message || "验证码已发送，请查收";
}

export function bindOAuthAccount(payload: OAuthBindInput) {
  return unwrap<OAuthBindResult>(
    service.post<ApiEnvelope<OAuthBindResult>>("/auth/oauth/bind", payload),
  );
}

export async function getMeDashboard(): Promise<MeDashboardData> {
  const [
    profileResult,
    emailStatusResult,
    resourcesResult,
    favoritesResult,
    teacherEvaluationsResult,
    courseEvaluationsResult,
    pointsResult,
    contributionsResult,
    unreadCountResult,
  ] = await Promise.allSettled([
    getMyProfile(),
    getMyEmailStatus(),
    getMyResources({ page: 1, size: 100 }),
    getMyFavorites({ page: 1, size: 100 }),
    getMyTeacherEvaluations({ page: 1, size: 100 }),
    getMyCourseEvaluations({ page: 1, size: 100 }),
    getMyPoints({ page: 1, size: 100 }),
    getMyContributions(),
    getUnreadNotificationCount(),
  ]);

  if (profileResult.status !== "fulfilled") {
    throw profileResult.reason;
  }

  if (emailStatusResult.status !== "fulfilled") {
    throw emailStatusResult.reason;
  }

  return {
    profile: profileResult.value,
    emailStatus: emailStatusResult.value,
    departments: DEPARTMENTS,
    unreadCount:
      unreadCountResult.status === "fulfilled" ? unreadCountResult.value : 0,
    contributions:
      contributionsResult.status === "fulfilled"
        ? contributionsResult.value
        : EMPTY_CONTRIBUTION_SUMMARY,
    resources:
      resourcesResult.status === "fulfilled"
        ? normalizePaginated(resourcesResult.value)
        : { items: [], total: 0 },
    favorites:
      favoritesResult.status === "fulfilled"
        ? normalizePaginated(favoritesResult.value)
        : { items: [], total: 0 },
    teacherEvaluations:
      teacherEvaluationsResult.status === "fulfilled"
        ? normalizePaginated(teacherEvaluationsResult.value)
        : { items: [], total: 0 },
    courseEvaluations:
      courseEvaluationsResult.status === "fulfilled"
        ? normalizePaginated(courseEvaluationsResult.value)
        : { items: [], total: 0 },
    points:
      pointsResult.status === "fulfilled"
        ? normalizePaginated(pointsResult.value)
        : { items: [], total: 0 },
  };
}

export function submitFeedback(payload: FeedbackInput) {
  return unwrap<null>(service.post<ApiEnvelope<null>>("/feedbacks", payload));
}

export function submitReport(payload: ReportInput) {
  return unwrap<null>(service.post<ApiEnvelope<null>>("/reports", payload));
}

export function submitCorrection(payload: CorrectionInput) {
  return unwrap<null>(service.post<ApiEnvelope<null>>("/corrections", payload));
}
