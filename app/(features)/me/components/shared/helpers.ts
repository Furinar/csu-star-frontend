import { getDepartmentNameById } from "@/data/departments";
import type { UserProfile } from "@/types/auth";
import type {
  Department,
  EmailStatus,
  FavoriteItem,
  NotificationItem,
  PaginatedData,
  PointsRecord,
  ResourceItem,
} from "@/types/me";

export type AccountMode = "guest" | "verified" | "oauth_pending_email";

export type ContributionAction = {
  label: string;
  score: number;
};

export type ContributionCell = {
  key: string;
  date: Date;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
  actions: ContributionAction[];
};

export type ContributionSummary = {
  weeks: ContributionCell[][];
  totalScore: number;
  activeDays: number;
  currentStreak: number;
  maxDayScore: number;
};

export const FORM_INPUT_CLASS_NAME =
  "w-full rounded-xl border-none bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none shadow-[inset_2px_2px_5px_rgba(148,163,184,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] transition focus:ring-2 focus:ring-first/50 focus:bg-white";
export const FORM_TEXTAREA_CLASS_NAME = `${FORM_INPUT_CLASS_NAME} min-h-28 resize-none`;

export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

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
    score: 5,
    detail: "有效拉新会扩大社区供给，因此单次给予高分。",
  },
];

export function createEmptyPaginated<T>(): PaginatedData<T> {
  return {
    items: [],
    total: 0,
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

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

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

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(dateLike?: string | Date | null) {
  if (!dateLike) {
    return "--";
  }

  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
  type?: ResourceItem["resource_type"] | FavoriteItem["resource_type"],
) {
  if (type === "ppt") {
    return "课件";
  }

  if (type === "pdf") {
    return "文档";
  }

  if (type === "notes") {
    return "笔记";
  }

  if (type === "exam") {
    return "试卷";
  }

  if (type === "lab") {
    return "实验";
  }

  return "其他";
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
