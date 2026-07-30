export { normalizeEmail, isValidEmail, isCampusEmail } from "@/lib/email";
export {
  getRequestErrorMessage as getErrorMessage,
  isNetworkOrTimeoutError,
  resolveAsyncEmptyType,
} from "@/lib/requestError";

import { DEPARTMENTS, getDepartmentNameById } from "@/data/departments";
import { getResourceCategoryLabel } from "@/lib/resourceCategory";
import type { UserProfile } from "@/types/auth";
import type {
  ContributionSummary,
  CourseEvaluation,
  Department,
  EmailStatus,
  FavoriteItem,
  MeDashboardData,
  NotificationItem,
  PaginatedData,
  PointsRecord,
  ResourceItem,
  TeacherEvaluation,
} from "@/types/me";
import type { PanelKey, TabKey } from "./types";
import { ME_TAB_KEYS, NO_AUTH_REQUIRED_PANELS } from "./types";

export type AccountMode = "guest" | "verified" | "oauth_pending_email";

export const FORM_INPUT_CLASS_NAME =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-first focus:ring-2 focus:ring-first/20";
export const FORM_TEXTAREA_CLASS_NAME = `${FORM_INPUT_CLASS_NAME} min-h-28 resize-none`;
export const PANEL_PRIMARY_BUTTON_CLASS_NAME =
  "w-full rounded-md bg-first px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
export const PANEL_SECONDARY_BUTTON_CLASS_NAME =
  "w-full rounded-md border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const DISPLAY_TIME_ZONE = "Asia/Shanghai";
const DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: DISPLAY_TIME_ZONE,
  month: "numeric",
  day: "numeric",
});
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: DISPLAY_TIME_ZONE,
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const CONTRIBUTION_RULES = [
  {
    title: "资源上传",
    score: 2,
    detail: "上传资源为社区提供内容。",
  },
  {
    title: "教师评价 / 课程评价",
    score: 1,
    detail: "为选课与避坑提供直接帮助，权重高于签到。",
  },
  {
    title: "每日签到",
    score: 1,
    detail: "鼓励持续活跃，但不挤占内容贡献的主导地位。",
  },
  {
    title: "邀请奖励",
    score: 3,
    detail: "有效邀请注册会为邀请双方各增加 3 积分。",
  },
];

export function createEmptyPaginated<T>(): PaginatedData<T> {
  return {
    items: [],
    total: 0,
  };
}

/** Matches backend `contributionWeeks` in misc_service.go — max one year. */
export const CONTRIBUTION_WEEKS = 52;
/**
 * Legacy mobile week window (tests / older call sites).
 * Live UI uses {@link fitContributionWeekCount} on all breakpoints.
 */
export const MOBILE_CONTRIBUTION_WEEKS = 15;

/** Heatmap cell is `h-3 w-3` (12px); week columns use `gap-1` (4px). */
export const CONTRIBUTION_CELL_PX = 12;
export const CONTRIBUTION_WEEK_GAP_PX = 4;
/** Weekday label column (~1em) + `gap-4` between labels and grid. */
export const CONTRIBUTION_LABEL_GUTTER_PX = 32;

/**
 * How many trailing weeks fit in a desktop heatmap container.
 * Caps at {@link CONTRIBUTION_WEEKS} (one year).
 */
export function fitContributionWeekCount(
  containerWidth: number,
  maxWeeks: number = CONTRIBUTION_WEEKS,
  minWeeks: number = 8,
): number {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return maxWeeks;
  }
  const available = Math.max(0, containerWidth - CONTRIBUTION_LABEL_GUTTER_PX);
  // n * cell + (n - 1) * gap <= available
  // => n * (cell + gap) - gap <= available
  const stride = CONTRIBUTION_CELL_PX + CONTRIBUTION_WEEK_GAP_PX;
  const n = Math.floor((available + CONTRIBUTION_WEEK_GAP_PX) / stride);
  const cappedMax = Math.max(1, maxWeeks);
  const cappedMin = Math.min(Math.max(1, minWeeks), cappedMax);
  return Math.min(cappedMax, Math.max(cappedMin, n || 1));
}

export function createEmptyContributionSummary(): ContributionSummary {
  return {
    weeks: [],
    active_days: 0,
    current_streak: 0,
    max_day_score: 0,
  };
}

/**
 * Fixed-size empty heatmap weeks for first paint / loading.
 * Keeps the contribution card height stable so empty → API data does not
 * collapse and expand the layout (page "抖动").
 */
export function createSkeletonContributionWeeks(
  weekCount: number = CONTRIBUTION_WEEKS,
): ContributionSummary["weeks"] {
  const count = Math.max(0, weekCount);
  return Array.from({ length: count }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => ({
      date: `skeleton-${weekIndex}-${dayIndex}`,
      score: 0,
      level: 0 as const,
      is_future: false,
      actions: [],
    })),
  );
}

/** Build a minimal dashboard shell after profile + email status resolve. */
export function createBaseDashboard(
  profileData: UserProfile,
  emailStatusData: EmailStatus,
): MeDashboardData {
  return {
    profile: profileData,
    emailStatus: emailStatusData,
    departments: DEPARTMENTS,
    unreadCount: 0,
    contributions: createEmptyContributionSummary(),
    contributionScore: 0,
    resources: createEmptyPaginated<ResourceItem>(),
    favorites: createEmptyPaginated<FavoriteItem>(),
    teacherEvaluations: createEmptyPaginated<TeacherEvaluation>(),
    courseEvaluations: createEmptyPaginated<CourseEvaluation>(),
    points: createEmptyPaginated<PointsRecord>(),
  };
}

export function parseMeTabParam(value: string | null | undefined): TabKey | null {
  if (!value) return null;
  return (ME_TAB_KEYS as readonly string[]).includes(value)
    ? (value as TabKey)
    : null;
}

export type PanelOpenDecision =
  | { action: "open"; panel: PanelKey; sideEffect?: "downloads" | "invite" }
  | { action: "guest" }
  | { action: "block" };

/**
 * Pure gate for openProtectedPanel: no auth → guest sheet, password/email
 * mutual exclusion, and which side-loads to kick off.
 */
export function resolveProtectedPanelOpen(
  panel: PanelKey,
  options: {
    isAuthenticated: boolean;
    isVerifiedCampusEmail: boolean;
  },
): PanelOpenDecision {
  if ((NO_AUTH_REQUIRED_PANELS as readonly PanelKey[]).includes(panel)) {
    return { action: "open", panel };
  }

  if (!options.isAuthenticated) {
    return { action: "guest" };
  }

  if (panel === "password" && !options.isVerifiedCampusEmail) {
    return { action: "block" };
  }

  if (panel === "email" && options.isVerifiedCampusEmail) {
    return { action: "block" };
  }

  if (panel === "downloads") {
    return { action: "open", panel, sideEffect: "downloads" };
  }

  if (panel === "invite") {
    return { action: "open", panel, sideEffect: "invite" };
  }

  return { action: "open", panel };
}

export function hasCheckedInOnDate(
  summary: ContributionSummary,
  dateKey: string,
): boolean {
  if (!dateKey) return false;
  return (
    summary.weeks
      .flat()
      .find((item) => item.date === dateKey)
      ?.actions.some((item) => item.type === "daily_checkin") ?? false
  );
}

/** localStorage key prefix: last successful daily check-in date per user */
export const DAILY_CHECKIN_CACHE_KEY_PREFIX = "csu-star:last-daily-checkin:";

export function getDailyCheckinCacheKey(userId: string) {
  return `${DAILY_CHECKIN_CACHE_KEY_PREFIX}${userId}`;
}

/** Read cached check-in dateKey (YYYY-MM-DD) for a user. Client-only. */
export function getCachedDailyCheckinDateKey(
  userId: string | null | undefined,
): string {
  if (!userId || typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(getDailyCheckinCacheKey(userId)) ?? "";
  } catch {
    return "";
  }
}

/** Persist that the user has checked in on dateKey. Client-only. */
export function setCachedDailyCheckinDateKey(
  userId: string | null | undefined,
  dateKey: string,
) {
  if (!userId || !dateKey || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getDailyCheckinCacheKey(userId), dateKey);
  } catch {
    // ignore quota / private mode
  }
}

/** Clear cached check-in when server confirms not checked in today. */
export function clearCachedDailyCheckinDateKey(
  userId: string | null | undefined,
) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getDailyCheckinCacheKey(userId));
  } catch {
    // ignore
  }
}

/**
 * Whether local cache says the user already checked in on dateKey.
 * Used to avoid flashing "未签到" while contributions API is loading.
 */
export function hasCachedCheckinOnDate(
  userId: string | null | undefined,
  dateKey: string,
): boolean {
  if (!userId || !dateKey) return false;
  return getCachedDailyCheckinDateKey(userId) === dateKey;
}

/**
 * Reconcile local check-in cache with server contribution summary for today.
 * - Server says checked in → write cache
 * - Today's cell exists without check-in → clear cache
 * - No today's cell (incomplete/failed data) → leave cache alone
 */
export function syncDailyCheckinCacheFromSummary(
  userId: string | null | undefined,
  summary: ContributionSummary,
  dateKey: string,
) {
  if (!userId || !dateKey) return;
  const todayCell = summary.weeks.flat().find((item) => item.date === dateKey);
  if (!todayCell) return;

  if (todayCell.actions.some((item) => item.type === "daily_checkin")) {
    setCachedDailyCheckinDateKey(userId, dateKey);
  } else {
    clearCachedDailyCheckinDateKey(userId);
  }
}

export function applyCheckinToDashboard(
  current: MeDashboardData,
  result: {
    balance_after?: number | null;
    points_gained?: number | null;
  },
  profilePoints: number,
  nowMs: number = Date.now(),
): MeDashboardData {
  const nextBalance = result.balance_after ?? profilePoints;
  const gainedPoints =
    result.points_gained ?? Math.max(0, nextBalance - profilePoints);

  const syntheticRecord: PointsRecord = {
    id: String(nowMs),
    change_amount: gainedPoints,
    balance_after: nextBalance,
    reason: "daily_checkin",
    created_at: new Date(nowMs).toISOString(),
  };

  return {
    ...current,
    profile: {
      ...current.profile,
      points: nextBalance,
    },
    points: {
      total: current.points.total + 1,
      items: [syntheticRecord, ...current.points.items],
    },
  };
}

export function assertApiResponse(
  response: { code: number; message?: string; msg?: string },
  fallback: string,
) {
  if (response.code !== 0 && response.code !== 200) {
    throw new Error(response.message || response.msg || fallback);
  }
}


export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfDisplayDay(dateLike: Date | string) {
  const key = getDateKey(dateLike);
  return key ? new Date(`${key}T00:00:00+08:00`) : new Date(0);
}

export function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function getDateKey(dateLike: Date | string) {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = DATE_KEY_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

export function buildFallbackEmailStatus(user: UserProfile | null): EmailStatus {
  return {
    email: user?.email ?? null,
    email_verified: Boolean(user?.email_verified),
    free_download_count: user?.free_download_count ?? null,
  };
}

export function formatDate(dateLike?: string | Date | null) {
  if (!dateLike) {
    return "--";
  }

  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return DATE_FORMATTER.format(date);
}

export function formatDateTime(dateLike?: string | Date | null) {
  if (!dateLike) {
    return "--";
  }

  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return DATE_TIME_FORMATTER.format(date);
}

export function formatNumber(value: number | undefined | null) {
  return new Intl.NumberFormat("zh-CN").format(value ?? 0);
}

export function getDepartmentName(departments: Department[], departmentId?: number) {
  if (!departmentId) {
    return "学院未填写";
  }

  return (
    departments.find((item) => item.id === departmentId)?.name ??
    getDepartmentNameById(departmentId) ??
    "学院未填写"
  );
}

export function getAccountMode(profile: UserProfile | null, emailStatus: EmailStatus): AccountMode {
  if (!profile) {
    return "guest";
  }

  if (emailStatus.email_verified || profile.email_verified) {
    return "verified";
  }

  return "oauth_pending_email";
}

export function getAccountPresentation(
  mode: AccountMode,
  emailStatus: EmailStatus,
  profile: UserProfile | null,
) {
  if (mode === "verified") {
    return {
      subtitle: "已认证",
      badge: "邮箱已认证",
      badgeClassName:
        "border border-emerald-200/70 bg-emerald-50/80 text-emerald-700",
      hint:
        emailStatus.email ??
        profile?.email ??
        "已完成校园认证，可使用完整个人中心能力。",
    };
  }

  if (mode === "oauth_pending_email") {
    const freeDownloads =
      emailStatus.free_download_count ?? profile?.free_download_count;
    return {
      subtitle: "待完成校园认证",
      badge: "第三方登录用户",
      badgeClassName:
        "border border-amber-200/70 bg-amber-50/85 text-amber-700",
      hint:
        freeDownloads == null
          ? "当前账号已通过第三方账号登录，可补充绑定邮箱。"
          : `当前账号还可免费下载 ${freeDownloads} 次资源，完成邮箱认证后可按积分下载。`,
    };
  }

  return {
    subtitle: "游客模式",
    badge: "未登录",
    badgeClassName: "border border-gray-200/70 bg-white/75 text-gray-600",
    hint: "登录后可查看资源、贡献、通知和全部个人设置。",
  };
}

export function getResourceTypeLabel(
  type?: ResourceItem["resource_type"] | FavoriteItem["resource_type"] | string | null,
) {
  return getResourceCategoryLabel(type);
}

export function getPointsReasonLabel(reason: PointsRecord["reason"]) {
  if (reason === "daily_checkin") {
    return "每日签到";
  }

  if (reason === "upload_reward") {
    return "上传奖励";
  }

  if (reason === "evaluation_reward") {
    return "评价奖励";
  }

  if (reason === "download_cost") {
    return "下载扣减";
  }

  if (reason === "invite_reward") {
    return "邀请奖励";
  }

  if (reason === "invite_signup_reward") {
    return "邀请码注册奖励";
  }

  if (reason === "register_bonus") {
    return "初始积分";
  }

  return "管理员调整";
}

export function getNotificationTypeLabel(type: NotificationItem["type"]) {
  if (type === "liked") {
    return "收到点赞";
  }

  if (type === "commented") {
    return "收到评论";
  }

  return "系统通知";
}

export function isAnnouncementNotification(item: NotificationItem) {
  return (
    item.category === "announcement" ||
    item.source_type === "announcement"
  );
}

export function getNotificationBadgeLabel(item: NotificationItem) {
  if (isAnnouncementNotification(item)) {
    return "公告";
  }

  if (item.type === "liked" || item.type === "commented") {
    return getNotificationTypeLabel(item.type);
  }

  if (item.result === "approved") {
    return "处理通过";
  }

  if (item.result === "rejected") {
    return "处理未通过";
  }

  return "系统通知";
}

/** TDesign Tag theme for notification type badges (flat list UI). */
export function getNotificationTagTheme(
  item: NotificationItem,
): "primary" | "success" | "danger" | "warning" | "default" {
  if (isAnnouncementNotification(item)) {
    return "primary";
  }

  if (item.result === "approved") {
    return "success";
  }

  if (item.result === "rejected") {
    return "danger";
  }

  if (item.type === "liked" || item.type === "commented") {
    return "warning";
  }

  return "default";
}

/** @deprecated Prefer getNotificationTagTheme + flat list rows. Kept for any residual callers. */
export function getNotificationCardTone(item: NotificationItem) {
  const theme = getNotificationTagTheme(item);
  const map = {
    primary: {
      cardClassName: "",
      badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
      unreadClassName: "bg-sky-100 text-sky-700",
    },
    success: {
      cardClassName: "",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      unreadClassName: "bg-emerald-100 text-emerald-700",
    },
    danger: {
      cardClassName: "",
      badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
      unreadClassName: "bg-rose-100 text-rose-700",
    },
    warning: {
      cardClassName: "",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      unreadClassName: "bg-amber-100 text-amber-700",
    },
    default: {
      cardClassName: "",
      badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
      unreadClassName: "bg-blue-100 text-blue-700",
    },
  } as const;
  return map[theme];
}
