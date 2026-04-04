import { getDepartmentNameById } from "@/data/departments";
import { getResourceCategoryLabel } from "@/lib/resourceCategory";
import type { UserProfile } from "@/types/auth";
import type {
  ContributionSummary,
  Department,
  EmailStatus,
  FavoriteItem,
  NotificationItem,
  PaginatedData,
  PointsRecord,
  ResourceItem,
} from "@/types/me";

export type AccountMode = "guest" | "verified" | "oauth_pending_email";

export const FORM_INPUT_CLASS_NAME =
  "w-full rounded-xl border-none bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none shadow-[inset_2px_2px_5px_rgba(148,163,184,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] transition focus:ring-2 focus:ring-first/50 focus:bg-white";
export const FORM_TEXTAREA_CLASS_NAME = `${FORM_INPUT_CLASS_NAME} min-h-28 resize-none`;
export const PANEL_PRIMARY_BUTTON_CLASS_NAME =
  "rounded-xl bg-first px-6 py-2.5 text-sm font-medium text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60";
export const PANEL_SECONDARY_BUTTON_CLASS_NAME =
  "rounded-xl border border-gray-200/70 bg-white/70 px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";

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
    score: 5,
    detail: "上传资源为社区提供内容。",
  },
  {
    title: "教师评价 / 课程评价",
    score: 3,
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

export function createEmptyContributionSummary(): ContributionSummary {
  return {
    weeks: [],
    total_score: 0,
    active_days: 0,
    current_streak: 0,
    max_day_score: 0,
  };
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function assertApiResponse(
  response: { code: number; message?: string; msg?: string },
  fallback: string,
) {
  if (response.code !== 0 && response.code !== 200) {
    throw new Error(response.message || response.msg || fallback);
  }
}

export function toCampusEmail(value: string) {
  const trimmedValue = value.trim().toLowerCase();
  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.includes("@")) {
    return trimmedValue;
  }

  return `${trimmedValue}@csu.edu.cn`;
}

export function isCampusEmail(value: string) {
  return /@csu\.edu\.cn$/i.test(value.trim());
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
      badge: "校园邮箱已认证",
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
          ? "当前账号已通过第三方授权登录，请补充校园邮箱认证。"
          : `剩余 ${freeDownloads} 次免费下载，完成校园邮箱认证后解除限制。`,
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

  if (type === "audit") {
    return "审核通知";
  }

  return "系统通知";
}
