import { service } from "@/lib/request";
import { DEPARTMENTS } from "@/data/departments";
import type { UserProfile } from "@/types/auth";
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
  InviteCodeInfo,
  MyProfileUpdateInput,
  MeDashboardData,
  NotificationItem,
  OAuthBindInput,
  OAuthBindResult,
  PaginatedData,
  PointsRecord,
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

const EMPTY_CONTRIBUTION_SUMMARY: ContributionSummary = {
  weeks: [],
  total_score: 0,
  active_days: 0,
  current_streak: 0,
  max_day_score: 0,
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
    PaginatedData<DownloadRecord> | PaginatedEnvelope<DownloadRecord>
  >(
    service.get<ApiEnvelope<PaginatedEnvelope<DownloadRecord>>>(
      "/me/downloads",
      { params },
    ),
  ).then(normalizePaginated);
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
  return unwrap<PaginatedData<PointsRecord> | PaginatedEnvelope<PointsRecord>>(
    service.get<ApiEnvelope<PaginatedEnvelope<PointsRecord>>>("/me/points", {
      params,
    }),
  ).then(normalizePaginated);
}

export function getMyContributions() {
  return unwrap<ContributionSummary>(
    service.get<ApiEnvelope<ContributionSummary>>("/me/contributions"),
  );
}

export function dailyCheckin() {
  return unwrap<CheckinResult>(
    service.post<ApiEnvelope<CheckinResult>>("/me/checkin"),
  );
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
  ).then(normalizePaginated);
}

export async function getUnreadNotificationCount() {
  const data = await unwrap<{ count: number }>(
    service.get<ApiEnvelope<{ count: number }>>(
      "/me/notifications/unread-count",
    ),
  );
  return data.count;
}

export function markNotificationRead(id: number) {
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
  const data = await unwrap<{ message?: string }>(
    service.post<ApiEnvelope<{ message?: string }>>("/auth/email/bind", payload),
  );
  return data.message ?? "验证码已发送，请查收";
}

export function verifyCampusEmail(payload: { email: string; captcha: string }) {
  return unwrap<null>(
    service.post<ApiEnvelope<null>>("/auth/email/verify", payload),
  );
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

export function submitReport(payload: {
  target_type: "resource" | "evaluation" | "comment" | "user";
  target_id: string;
  reason: "copyright" | "spam" | "inappropriate" | "other";
  description?: string | null;
}) {
  return unwrap<null>(service.post<ApiEnvelope<null>>("/reports", payload));
}

export function submitCorrection(payload: CorrectionInput) {
  return unwrap<null>(service.post<ApiEnvelope<null>>("/corrections", payload));
}
