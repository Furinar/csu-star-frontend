/* eslint-disable @next/next/no-img-element */
"use client";

import CryptoJS from "crypto-js";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { recoverPwd, sendCaptcha } from "@/api/auth";
import {
  bindCampusEmail,
  bindOAuthAccount,
  dailyCheckin,
  getMeDashboard,
  getMyDownloads,
  getMyInviteCode,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  submitCorrection,
  submitFeedback,
  submitReport,
  updateMyProfile,
  verifyCampusEmail,
} from "@/api/me";
import GlassCard from "@/components/ui/GlassCard";
import { feedback } from "@/store/useFeedbackStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserProfile } from "@/types/auth";
import type {
  AuditStatus,
  CourseEvaluation,
  CorrectionInput,
  Department,
  DownloadRecord,
  EmailStatus,
  FavoriteItem,
  FeedbackInput,
  InviteCodeInfo,
  MeDashboardData,
  MyProfileUpdateInput,
  NotificationItem,
  OAuthBindProvider,
  PaginatedData,
  PointsRecord,
  ReportReason,
  ReportTargetType,
  ResourceItem,
  TeacherEvaluation,
} from "@/types/me";

type AccountMode = "guest" | "verified" | "oauth_pending_email";
type TabKey =
  | "overview"
  | "resources"
  | "favorites"
  | "evaluations"
  | "notifications";
type PanelKey =
  | "guest"
  | "profile"
  | "password"
  | "email"
  | "oauth"
  | "points"
  | "invite"
  | "downloads"
  | "feedback"
  | "report"
  | "contribution";

type ContributionAction = {
  label: string;
  score: number;
};

type ContributionCell = {
  key: string;
  date: Date;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
  actions: ContributionAction[];
};

type ContributionSummary = {
  weeks: ContributionCell[][];
  totalScore: number;
  activeDays: number;
  currentStreak: number;
  maxDayScore: number;
};

const FORM_INPUT_CLASS_NAME =
  "w-full rounded-xl border border-gray-200/60 bg-white/60 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-first/60 focus:bg-white";
const FORM_TEXTAREA_CLASS_NAME = `${FORM_INPUT_CLASS_NAME} min-h-28 resize-none`;

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

const CONTRIBUTION_RULES = [
  {
    title: "通过审核的资源上传",
    score: 6,
    detail: "直接增加社区可复用内容，是最高权重贡献。",
  },
  {
    title: "待审核资源上传",
    score: 2,
    detail: "鼓励持续提交，但在审核通过前保持较低权重。",
  },
  {
    title: "草稿资源",
    score: 1,
    detail: "记录创作行为，避免未完成内容被高估。",
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

function createEmptyPaginated<T>(): PaginatedData<T> {
  return {
    items: [],
    total: 0,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function assertApiResponse(
  response: { code: number; message?: string; msg?: string },
  fallback: string,
) {
  if (response.code !== 0 && response.code !== 200) {
    throw new Error(response.message || response.msg || fallback);
  }
}

function toCampusEmail(value: string) {
  const trimmedValue = value.trim().toLowerCase();
  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.includes("@")) {
    return trimmedValue;
  }

  return `${trimmedValue}@csu.edu.cn`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function getDateKey(dateLike: Date | string) {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildFallbackEmailStatus(user: UserProfile | null): EmailStatus {
  return {
    email: user?.email ?? null,
    email_verified: Boolean(user?.email_verified),
    free_download_count: user?.free_download_count ?? null,
  };
}

function formatDate(dateLike?: string | Date | null) {
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

function formatDateTime(dateLike?: string | Date | null) {
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

function formatNumber(value: number | undefined | null) {
  return new Intl.NumberFormat("zh-CN").format(value ?? 0);
}

function getDepartmentName(departments: Department[], departmentId?: number) {
  if (!departmentId) {
    return "学院未填写";
  }

  return (
    departments.find((item) => item.id === departmentId)?.name ?? "学院未填写"
  );
}

function getAccountMode(profile: UserProfile | null, emailStatus: EmailStatus) {
  if (!profile) {
    return "guest";
  }

  if (emailStatus.email_verified || profile.email_verified) {
    return "verified";
  }

  return "oauth_pending_email";
}

function getAccountPresentation(
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

function getAuditStatusLabel(status: AuditStatus) {
  if (status === "approved") {
    return "已通过";
  }

  if (status === "pending") {
    return "待审核";
  }

  if (status === "rejected") {
    return "未通过";
  }

  return "草稿";
}

function getAuditStatusClassName(status: AuditStatus) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-gray-200 bg-gray-100/80 text-gray-600";
}

function getResourceTypeLabel(
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

function getPointsReasonLabel(reason: PointsRecord["reason"]) {
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

function getNotificationTypeLabel(type: NotificationItem["type"]) {
  if (type === "audit_pass") {
    return "审核通过";
  }

  if (type === "audit_reject") {
    return "审核拒绝";
  }

  if (type === "liked") {
    return "收到点赞";
  }

  if (type === "commented") {
    return "收到评论";
  }

  return "系统通知";
}

function getFavoriteType(item: FavoriteItem) {
  if (item.resource_type) {
    return "resource";
  }

  if (item.name) {
    return "teacher";
  }

  return "course";
}

function getFavoriteTypeLabel(item: FavoriteItem) {
  const type = getFavoriteType(item);
  if (type === "resource") {
    return "资源";
  }

  if (type === "teacher") {
    return "教师";
  }

  return "课程";
}

function getFavoriteTitle(item: FavoriteItem) {
  return item.title || item.name || item.title_label || "未命名收藏";
}

function getContributionLevel(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0) {
    return 0;
  }

  if (score < 3) {
    return 1;
  }

  if (score < 6) {
    return 2;
  }

  if (score < 9) {
    return 3;
  }

  return 4;
}

function getContributionClassName(cell: ContributionCell) {
  if (cell.isFuture) {
    return "bg-white/30 border border-white/30";
  }

  if (cell.level === 0) {
    return "bg-gray-100";
  }

  if (cell.level === 1) {
    return "bg-green-100";
  }

  if (cell.level === 2) {
    return "bg-green-200";
  }

  if (cell.level === 3) {
    return "bg-green-400";
  }

  return "bg-green-600";
}

function buildContributionSummary(
  resources: PaginatedData<ResourceItem>,
  teacherEvaluations: PaginatedData<TeacherEvaluation>,
  courseEvaluations: PaginatedData<CourseEvaluation>,
  points: PaginatedData<PointsRecord>,
): ContributionSummary {
  const contributionMap = new Map<
    string,
    {
      score: number;
      actions: ContributionAction[];
    }
  >();

  const addContribution = (
    createdAt: string | undefined,
    score: number,
    label: string,
  ) => {
    if (!createdAt || score <= 0) {
      return;
    }

    const key = getDateKey(createdAt);
    if (!key) {
      return;
    }

    const current = contributionMap.get(key) ?? {
      score: 0,
      actions: [],
    };

    contributionMap.set(key, {
      score: current.score + score,
      actions: [...current.actions, { label, score }],
    });
  };

  resources.items.forEach((item) => {
    const score =
      item.status === "approved"
        ? 6
        : item.status === "pending"
          ? 2
          : item.status === "draft"
            ? 1
            : 0;
    addContribution(
      item.created_at,
      score,
      `${getAuditStatusLabel(item.status)}资源上传`,
    );
  });

  teacherEvaluations.items.forEach((item) => {
    addContribution(item.created_at, 3, "发布教师评价");
  });

  courseEvaluations.items.forEach((item) => {
    addContribution(item.created_at, 3, "发布课程评价");
  });

  points.items.forEach((item) => {
    if (item.reason === "daily_checkin") {
      addContribution(item.created_at, 1, "每日签到");
    }

    if (item.reason === "invite_reward") {
      addContribution(item.created_at, 5, "邀请奖励");
    }
  });

  const today = startOfDay(new Date());
  const currentWeekStart = addDays(today, -today.getDay());
  const start = addDays(currentWeekStart, -25 * 7);
  const weeks: ContributionCell[][] = [];

  let totalScore = 0;
  let activeDays = 0;
  let maxDayScore = 0;

  for (let weekIndex = 0; weekIndex < 26; weekIndex += 1) {
    const cells: ContributionCell[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = addDays(start, weekIndex * 7 + dayIndex);
      const key = getDateKey(date);
      const entry = contributionMap.get(key);
      const isFuture = date.getTime() > today.getTime();
      const score = isFuture ? 0 : (entry?.score ?? 0);

      if (!isFuture && score > 0) {
        totalScore += score;
        activeDays += 1;
        maxDayScore = Math.max(maxDayScore, score);
      }

      cells.push({
        key,
        date,
        score,
        level: getContributionLevel(score),
        isFuture,
        actions: entry?.actions ?? [],
      });
    }

    weeks.push(cells);
  }

  let currentStreak = 0;
  let cursor = today;
  while (true) {
    const key = getDateKey(cursor);
    const entry = contributionMap.get(key);
    if (!entry || entry.score <= 0) {
      break;
    }

    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    weeks,
    totalScore,
    activeDays,
    currentStreak,
    maxDayScore,
  };
}

export default function Me() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const [dashboard, setDashboard] = useState<MeDashboardData | null>(null);
  const [downloads, setDownloads] = useState<PaginatedData<DownloadRecord>>(
    createEmptyPaginated(),
  );
  const [notifications, setNotifications] = useState<
    PaginatedData<NotificationItem>
  >(createEmptyPaginated());
  const [inviteCode, setInviteCode] = useState<InviteCodeInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingDownloads, setIsLoadingDownloads] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isBindingOAuth, setIsBindingOAuth] = useState(false);
  const [isSendingPasswordCode, setIsSendingPasswordCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [resourceFilter, setResourceFilter] = useState<"all" | AuditStatus>(
    "all",
  );
  const [favoriteFilter, setFavoriteFilter] = useState<
    "all" | "resource" | "course" | "teacher"
  >("all");
  const [evaluationFilter, setEvaluationFilter] = useState<
    "all" | "teacher" | "course"
  >("all");
  const [oauthProviders, setOAuthProviders] = useState<OAuthBindProvider[]>([]);
  const [reportMode, setReportMode] = useState<"report" | "correction">(
    "report",
  );
  const [profileForm, setProfileForm] = useState({
    nickname: "",
    avatar_url: "",
    department_id: "",
    grade: "",
  });
  const [emailForm, setEmailForm] = useState({
    email: "",
    captcha: "",
  });
  const [oauthForm, setOAuthForm] = useState({
    provider: "qq" as OAuthBindProvider,
    code: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    email: "",
    captcha: "",
    password: "",
    confirmPassword: "",
  });
  const [feedbackForm, setFeedbackForm] = useState<FeedbackInput>({
    type: "suggestion",
    title: "",
    content: "",
    contact: "",
    screenshots: [],
  });
  const [reportForm, setReportForm] = useState({
    target_type: "resource" as ReportTargetType,
    target_id: "",
    reason: "other" as ReportReason,
    description: "",
  });
  const [correctionForm, setCorrectionForm] = useState<CorrectionInput>({
    target_type: "resource",
    target_id: 0,
    field_name: "",
    original_value: "",
    correct_value: "",
    description: "",
  });

  const accessToken = useAuthStore((state) => state.access_token);
  const storedUser = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const storedUserId = storedUser?.id;

  const profile = dashboard?.profile ?? storedUser;
  const emailStatus =
    dashboard?.emailStatus ?? buildFallbackEmailStatus(storedUser);
  const departments = dashboard?.departments ?? [];
  const resources =
    dashboard?.resources ?? createEmptyPaginated<ResourceItem>();
  const favorites =
    dashboard?.favorites ?? createEmptyPaginated<FavoriteItem>();
  const teacherEvaluations =
    dashboard?.teacherEvaluations ?? createEmptyPaginated<TeacherEvaluation>();
  const courseEvaluations =
    dashboard?.courseEvaluations ?? createEmptyPaginated<CourseEvaluation>();
  const points = dashboard?.points ?? createEmptyPaginated<PointsRecord>();
  const unreadCount = dashboard?.unreadCount ?? 0;
  const accountMode = getAccountMode(profile, emailStatus);
  const accountPresentation = getAccountPresentation(
    accountMode,
    emailStatus,
    profile,
  );
  const contributionSummary = buildContributionSummary(
    resources,
    teacherEvaluations,
    courseEvaluations,
    points,
  );
  const hasCheckedInToday = points.items.some(
    (item) =>
      item.reason === "daily_checkin" &&
      getDateKey(item.created_at) === getDateKey(new Date()),
  );

  const loadDashboard = useCallback(
    async (showToast = false) => {
      if (!accessToken || !storedUserId) {
        setDashboard(null);
        setLoadError("");
        return;
      }

      setIsLoadingDashboard(true);
      setLoadError("");

      try {
        const data = await getMeDashboard();
        setDashboard(data);
        setUser(data.profile);
      } catch (error) {
        const message = getErrorMessage(error, "个人中心数据加载失败");
        setLoadError(message);
        if (showToast) {
          feedback.error({
            title: "个人中心加载失败",
            description: message,
          });
        }
      } finally {
        setIsLoadingDashboard(false);
      }
    },
    [accessToken, setUser, storedUserId],
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!accessToken || !storedUserId) {
      setDashboard(null);
      setDownloads(createEmptyPaginated());
      setNotifications(createEmptyPaginated());
      setInviteCode(null);
      setLoadError("");
      return;
    }

    void loadDashboard();
  }, [accessToken, hasHydrated, loadDashboard, storedUserId]);

  const loadDownloadsData = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoadingDownloads(true);
    try {
      const data = await getMyDownloads({ page: 1, size: 20 });
      setDownloads(data);
    } catch (error) {
      feedback.error({
        title: "下载记录加载失败",
        description: getErrorMessage(error, "暂时无法获取下载记录"),
      });
    } finally {
      setIsLoadingDownloads(false);
    }
  };

  const loadNotificationsData = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoadingNotifications(true);
    try {
      const data = await listMyNotifications({ page: 1, size: 20 });
      setNotifications(data);
    } catch (error) {
      feedback.error({
        title: "通知列表加载失败",
        description: getErrorMessage(error, "暂时无法获取通知"),
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const loadInviteCodeData = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoadingInvite(true);
    try {
      const data = await getMyInviteCode();
      setInviteCode(data);
    } catch (error) {
      feedback.error({
        title: "邀请码加载失败",
        description: getErrorMessage(error, "暂时无法获取邀请码"),
      });
    } finally {
      setIsLoadingInvite(false);
    }
  };

  const openProtectedPanel = (panel: PanelKey) => {
    if (!profile || !accessToken) {
      setOpenPanel("guest");
      return;
    }

    if (panel === "profile") {
      setProfileForm({
        nickname: profile.nickname ?? "",
        avatar_url: profile.avatar_url ?? "",
        department_id: profile.department_id ? `${profile.department_id}` : "",
        grade: profile.grade ? `${profile.grade}` : "",
      });
    }

    if (panel === "email") {
      setEmailForm({
        email: emailStatus.email ?? profile.email ?? "",
        captcha: "",
      });
    }

    if (panel === "password") {
      setPasswordForm({
        email: emailStatus.email ?? profile.email ?? "",
        captcha: "",
        password: "",
        confirmPassword: "",
      });
    }

    if (panel === "oauth") {
      setOAuthForm({
        provider: "qq",
        code: "",
      });
    }

    if (panel === "feedback") {
      setFeedbackForm({
        type: "suggestion",
        title: "",
        content: "",
        contact: profile.email ?? "",
        screenshots: [],
      });
    }

    if (panel === "report") {
      setReportMode("report");
      setReportForm({
        target_type: "resource",
        target_id: "",
        reason: "other",
        description: "",
      });
      setCorrectionForm({
        target_type: "resource",
        target_id: 0,
        field_name: "",
        original_value: "",
        correct_value: "",
        description: "",
      });
    }

    if (panel === "downloads") {
      void loadDownloadsData();
    }

    if (panel === "invite") {
      void loadInviteCodeData();
    }

    setOpenPanel(panel);
  };

  const handleCheckin = async () => {
    if (!profile || !accessToken) {
      setOpenPanel("guest");
      return;
    }

    if (hasCheckedInToday || isCheckingIn) {
      return;
    }

    setIsCheckingIn(true);
    try {
      const result = await dailyCheckin();

      setDashboard((current) => {
        if (!current) {
          return current;
        }

        const nextProfile = {
          ...current.profile,
          points: result.balance_after,
        };
        const syntheticRecord: PointsRecord = {
          id: Date.now(),
          change_amount: result.points_gained,
          balance_after: result.balance_after,
          reason: "daily_checkin",
          created_at: new Date().toISOString(),
        };
        const nextPoints = result.already_checked_in
          ? current.points
          : {
              total: current.points.total + 1,
              items: [syntheticRecord, ...current.points.items],
            };

        return {
          ...current,
          profile: nextProfile,
          points: nextPoints,
        };
      });

      setUser({
        ...profile,
        points: result.balance_after,
      });

      feedback.success({
        title: result.already_checked_in ? "今天已经签到过了" : "签到成功",
        description: result.already_checked_in
          ? "明天再来领取新的签到积分。"
          : `本次获得 ${result.points_gained} 积分，当前余额 ${result.balance_after}。`,
      });
    } catch (error) {
      feedback.error({
        title: "签到失败",
        description: getErrorMessage(error, "请稍后重试"),
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !accessToken) {
      setOpenPanel("guest");
      return;
    }

    if (!profileForm.nickname.trim()) {
      feedback.warning({
        title: "昵称不能为空",
        description: "请填写要展示的昵称。",
      });
      return;
    }

    const payload: MyProfileUpdateInput = {
      nickname: profileForm.nickname.trim(),
      avatar_url: profileForm.avatar_url.trim() || undefined,
      department_id: profileForm.department_id
        ? Number(profileForm.department_id)
        : undefined,
      grade: profileForm.grade ? Number(profileForm.grade) : undefined,
    };

    setIsSavingProfile(true);
    try {
      const nextProfile = await updateMyProfile(payload);
      setDashboard((current) =>
        current
          ? {
              ...current,
              profile: nextProfile,
            }
          : current,
      );
      setUser(nextProfile);
      setOpenPanel(null);
      feedback.success({
        title: "资料已更新",
        description: "个人信息已经同步到你的主页。",
      });
    } catch (error) {
      feedback.error({
        title: "资料保存失败",
        description: getErrorMessage(error, "请稍后再试"),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendEmailCode = async () => {
    const email = toCampusEmail(emailForm.email);
    if (!email) {
      feedback.warning({
        title: "请输入校园邮箱",
        description: "支持直接填写邮箱前缀，系统会自动补全为 `@csu.edu.cn`。",
      });
      return;
    }

    setIsSendingEmailCode(true);
    try {
      const message = await bindCampusEmail({ email });
      setEmailForm((current) => ({
        ...current,
        email,
      }));
      feedback.success({
        title: "验证码已发送",
        description: message,
      });
    } catch (error) {
      feedback.error({
        title: "发送失败",
        description: getErrorMessage(error, "请检查邮箱后重试"),
      });
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!profile) {
      setOpenPanel("guest");
      return;
    }

    const email = toCampusEmail(emailForm.email);
    if (!email || !emailForm.captcha.trim()) {
      feedback.warning({
        title: "信息不完整",
        description: "请先填写邮箱并输入收到的验证码。",
      });
      return;
    }

    setIsVerifyingEmail(true);
    try {
      await verifyCampusEmail({
        email,
        captcha: emailForm.captcha.trim(),
      });

      const nextProfile = {
        ...profile,
        email,
        email_verified: true,
        free_download_count: null,
      };

      setDashboard((current) =>
        current
          ? {
              ...current,
              profile: nextProfile,
              emailStatus: {
                email,
                email_verified: true,
                free_download_count: null,
              },
            }
          : current,
      );
      setUser(nextProfile);
      setOpenPanel(null);
      feedback.success({
        title: "校园邮箱认证完成",
        description: "你的个人中心已切换为校园认证状态。",
      });
    } catch (error) {
      feedback.error({
        title: "验证失败",
        description: getErrorMessage(error, "验证码无效或已过期"),
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleBindOAuth = async () => {
    if (!profile) {
      setOpenPanel("guest");
      return;
    }

    if (!oauthForm.code.trim()) {
      feedback.warning({
        title: "请填写授权码",
        description: "当前接口需要 provider 与 code 两个字段完成绑定。",
      });
      return;
    }

    setIsBindingOAuth(true);
    try {
      const result = await bindOAuthAccount({
        provider: oauthForm.provider,
        code: oauthForm.code.trim(),
      });

      setOAuthProviders((current) =>
        current.includes(result.provider)
          ? current
          : [...current, result.provider],
      );
      setOpenPanel(null);
      feedback.success({
        title: "第三方账号已绑定",
        description: `${result.provider === "qq" ? "QQ" : "微信"} 已可用于快捷登录。`,
      });
    } catch (error) {
      feedback.error({
        title: "绑定失败",
        description: getErrorMessage(error, "请检查授权码后重试"),
      });
    } finally {
      setIsBindingOAuth(false);
    }
  };

  const handleSendPasswordCode = async () => {
    const email = toCampusEmail(passwordForm.email);
    if (!email) {
      feedback.warning({
        title: "请先填写邮箱",
        description: "修改密码仍通过校园邮箱验证码完成。",
      });
      return;
    }

    setIsSendingPasswordCode(true);
    try {
      const response = await sendCaptcha(email);
      assertApiResponse(response, "验证码发送失败");
      setPasswordForm((current) => ({
        ...current,
        email,
      }));
      feedback.success({
        title: "验证码已发送",
        description: "请前往邮箱查收后继续完成密码修改。",
      });
    } catch (error) {
      feedback.error({
        title: "发送失败",
        description: getErrorMessage(error, "请稍后再试"),
      });
    } finally {
      setIsSendingPasswordCode(false);
    }
  };

  const handleResetPassword = async () => {
    const email = toCampusEmail(passwordForm.email);
    if (
      !email ||
      !passwordForm.captcha.trim() ||
      !passwordForm.password.trim()
    ) {
      feedback.warning({
        title: "信息不完整",
        description: "邮箱、验证码和新密码都不能为空。",
      });
      return;
    }

    if (passwordForm.password.trim().length < 8) {
      feedback.warning({
        title: "密码长度不足",
        description: "新密码至少需要 8 位。",
      });
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      feedback.warning({
        title: "两次输入不一致",
        description: "请确认新密码和确认密码保持一致。",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await recoverPwd({
        email,
        password: CryptoJS.SHA256(passwordForm.password).toString(
          CryptoJS.enc.Hex,
        ),
        captcha: passwordForm.captcha.trim(),
      });
      assertApiResponse(response, "密码修改失败");
      setOpenPanel(null);
      feedback.success({
        title: "密码已更新",
        description: "下次登录请使用新的密码。",
      });
    } catch (error) {
      feedback.error({
        title: "修改失败",
        description: getErrorMessage(error, "请检查验证码后重试"),
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.title.trim() || !feedbackForm.content.trim()) {
      feedback.warning({
        title: "内容不完整",
        description: "请至少填写标题和反馈内容。",
      });
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        ...feedbackForm,
        title: feedbackForm.title.trim(),
        content: feedbackForm.content.trim(),
        contact: feedbackForm.contact?.trim() || null,
      });
      setOpenPanel(null);
      feedback.success({
        title: "反馈已提交",
        description: "感谢你的建议，我们会尽快处理。",
      });
    } catch (error) {
      feedback.error({
        title: "提交失败",
        description: getErrorMessage(error, "请稍后重试"),
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportForm.target_id.trim()) {
      feedback.warning({
        title: "请填写目标 ID",
        description: "举报需要明确的对象编号。",
      });
      return;
    }

    setIsSubmittingReport(true);
    try {
      await submitReport({
        target_type: reportForm.target_type,
        target_id: reportForm.target_id.trim(),
        reason: reportForm.reason,
        description: reportForm.description.trim() || null,
      });
      setOpenPanel(null);
      feedback.success({
        title: "举报已提交",
        description: "我们会结合内容与上下文尽快核查。",
      });
    } catch (error) {
      feedback.error({
        title: "提交失败",
        description: getErrorMessage(error, "请稍后重试"),
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSubmitCorrection = async () => {
    if (
      !correctionForm.target_id ||
      Number.isNaN(Number(correctionForm.target_id))
    ) {
      feedback.warning({
        title: "目标 ID 无效",
        description: "纠错需要数字类型的对象 ID。",
      });
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      await submitCorrection({
        ...correctionForm,
        target_id: Number(correctionForm.target_id),
        field_name: correctionForm.field_name?.trim() || null,
        original_value: correctionForm.original_value?.trim() || null,
        correct_value: correctionForm.correct_value?.trim() || null,
        description: correctionForm.description?.trim() || null,
      });
      setOpenPanel(null);
      feedback.success({
        title: "纠错已提交",
        description: "感谢协助完善平台内容。",
      });
    } catch (error) {
      feedback.error({
        title: "提交失败",
        description: getErrorMessage(error, "请稍后重试"),
      });
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: true,
              }
            : item,
        ),
      }));
      setDashboard((current) =>
        current
          ? {
              ...current,
              unreadCount: Math.max(
                0,
                current.unreadCount - (current.unreadCount > 0 ? 1 : 0),
              ),
            }
          : current,
      );
    } catch (error) {
      feedback.error({
        title: "操作失败",
        description: getErrorMessage(error, "无法标记通知状态"),
      });
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((current) => ({
        ...current,
        items: current.items.map((item) => ({
          ...item,
          is_read: true,
        })),
      }));
      setDashboard((current) =>
        current
          ? {
              ...current,
              unreadCount: 0,
            }
          : current,
      );
      feedback.success({
        title: "全部通知已标记为已读",
      });
    } catch (error) {
      feedback.error({
        title: "操作失败",
        description: getErrorMessage(error, "请稍后再试"),
      });
    }
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode?.invite_code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteCode.invite_code);
      feedback.success({
        title: "邀请码已复制",
        description: `分享给好友即可使用：${inviteCode.invite_code}`,
      });
    } catch {
      feedback.warning({
        title: "复制失败",
        description: "浏览器未授予剪贴板权限，请手动复制。",
      });
    }
  };

  const filteredResources =
    resourceFilter === "all"
      ? resources.items
      : resources.items.filter((item) => item.status === resourceFilter);

  const filteredFavorites =
    favoriteFilter === "all"
      ? favorites.items
      : favorites.items.filter(
          (item) => getFavoriteType(item) === favoriteFilter,
        );

  const filteredTeacherEvaluations =
    evaluationFilter === "all" || evaluationFilter === "teacher"
      ? teacherEvaluations.items
      : [];
  const filteredCourseEvaluations =
    evaluationFilter === "all" || evaluationFilter === "course"
      ? courseEvaluations.items
      : [];

  const settingsActions: Array<{
    key: PanelKey;
    title: string;
    icon: string;
    desc: string;
    badge?: string;
  }> = [
    {
      key: "password" as PanelKey,
      title: "修改密码",
      icon: "keyhole-circle",
      desc: accountMode === "guest" ? "登录后可改密" : "邮箱验证码改密",
    },
    {
      key: "email" as PanelKey,
      title: "绑定校园邮箱",
      icon: "envelope-shield",
      desc:
        accountMode === "verified"
          ? "校园认证已完成"
          : accountMode === "oauth_pending_email"
            ? "补齐校园认证"
            : "登录后完成校园认证",
    },
    {
      key: "oauth" as PanelKey,
      title: "绑定第三方账号",
      icon: "github-alt",
      desc:
        accountMode === "oauth_pending_email"
          ? "继续补绑其他方式"
          : "绑定 QQ / 微信",
    },
    {
      key: "points" as PanelKey,
      title: "积分流水",
      icon: "chart-bar-alt",
      desc: `余额 ${formatNumber(profile?.points)}，查看变动`,
    },
    {
      key: "invite" as PanelKey,
      title: "分享邀请码",
      icon: "share",
      desc: "邀请可得积分奖励",
    },
    {
      key: "downloads" as PanelKey,
      title: "下载记录",
      icon: "import",
      desc: "查看最近下载历史",
    },
    {
      key: "feedback" as PanelKey,
      title: "意见反馈",
      icon: "comment-alt-edit",
      desc: "提交建议或问题",
    },
    {
      key: "report" as PanelKey,
      title: "举报/纠错",
      icon: "multiply",
      desc: "提交举报或纠错",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-10 transition-colors duration-300 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row">
        <aside className="w-full flex-shrink-0 md:w-1/3 lg:w-1/4">
          <div className="sticky top-24 space-y-6">
            <GlassCard className="flex flex-col items-center p-6 text-center md:items-start md:text-left">
              <div className="group relative mb-4 cursor-pointer">
                <img
                  className="h-48 w-48 rounded-full border-4 border-white/50 object-cover shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                  src={profile?.avatar_url || "/furina.jpg"}
                  alt="User Avatar"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-sm text-white">
                    {accountMode === "guest" ? "登录后更换头像" : "编辑资料"}
                  </span>
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${accountPresentation.badgeClassName}`}
                >
                  {accountPresentation.badge}
                </span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile?.nickname ?? "游客"}
                  </h1>
                  <h2 className="text-lg font-light text-gray-500">
                    {accountPresentation.subtitle}
                  </h2>
                </div>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-gray-700">
                {accountPresentation.hint}
              </p>

              <button
                type="button"
                onClick={() => openProtectedPanel("profile")}
                className="mb-6 w-full rounded-xl border border-gray-200/50 bg-white/50 px-4 py-1.5 font-medium text-gray-800 shadow-sm transition-all hover:bg-white/80"
              >
                {accountMode === "guest" ? "登录后完善资料" : "编辑个人资料"}
              </button>

              <div className="w-full space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{emailStatus.email ?? "尚未绑定校园邮箱"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span>
                    {getDepartmentName(departments, profile?.department_id)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span>
                    {profile?.grade ? `${profile.grade}级` : "年级未填写"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-3.866 0-7 2.239-7 5v3h14v-3c0-2.761-3.134-5-7-5zm0 0a4 4 0 100-8 4 4 0 000 8z"
                    />
                  </svg>
                  <span>
                    {accountMode === "guest"
                      ? "登录后可查看完整账号能力"
                      : accountMode === "verified"
                        ? "校园认证身份已生效"
                        : "第三方登录，可继续完成校园邮箱认证"}
                  </span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">
                STAR 积分
              </h3>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="hero-gradient-text text-3xl font-black">
                    {formatNumber(profile?.points)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={
                    accountMode === "guest"
                      ? () => setOpenPanel("guest")
                      : handleCheckin
                  }
                  disabled={isCheckingIn || hasCheckedInToday}
                  className="rounded-lg bg-first px-3 py-1.5 text-sm font-medium text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {accountMode === "guest"
                    ? "立即登录"
                    : hasCheckedInToday
                      ? "今日已签到"
                      : isCheckingIn
                        ? "签到中..."
                        : "每日签到"}
                </button>
              </div>
            </GlassCard>
          </div>
        </aside>

        <main className="w-full flex-1">
          <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200/50 pb-px hide-scrollbar">
            {[
              {
                key: "overview" as TabKey,
                label: "概览",
              },
              {
                key: "resources" as TabKey,
                label: "我的资源",
                count: resources.total,
              },
              {
                key: "favorites" as TabKey,
                label: "收藏夹",
                count: favorites.total,
              },
              {
                key: "evaluations" as TabKey,
                label: "我的评价",
                count: teacherEvaluations.total + courseEvaluations.total,
              },
              {
                key: "notifications" as TabKey,
                label: "通知与公告",
                count: unreadCount,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (
                      tab.key === "notifications" &&
                      accessToken &&
                      notifications.items.length === 0 &&
                      !isLoadingNotifications
                    ) {
                      void loadNotificationsData();
                    }
                  }}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "border-first text-gray-900"
                      : "rounded-t-lg border-transparent text-gray-600 hover:bg-gray-100/50 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === "number" && tab.count > 0 ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        tab.key === "notifications"
                          ? "bg-rose-500/12 text-rose-600"
                          : "bg-gray-200/50 text-gray-600"
                      }`}
                    >
                      {formatNumber(tab.count)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {loadError ? (
            <GlassCard className="mb-6 border border-amber-200/70 bg-amber-50/70 p-4">
              <div className="flex flex-col gap-2 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadDashboard(true)}
                  className="rounded-lg bg-white/70 px-3 py-1.5 font-medium text-amber-700 transition hover:bg-white"
                >
                  重新加载
                </button>
              </div>
            </GlassCard>
          ) : null}

          {activeTab === "overview" ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 ml-5 text-md font-normal text-gray-800">
                  CSU Star贡献图
                </h3>
                <GlassCard className="p-6">
                  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        最近 26 周社区贡献
                      </p>
                      <h4 className="mt-1 text-xl font-semibold text-gray-900">
                        {accountMode === "guest"
                          ? "登录后开始累计你的社区贡献"
                          : `累计 ${formatNumber(contributionSummary.totalScore)} 分贡献`}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <StatPill
                        label="活跃天数"
                        value={`${formatNumber(contributionSummary.activeDays)} 天`}
                      />
                      <StatPill
                        label="连续活跃"
                        value={`${formatNumber(contributionSummary.currentStreak)} 天`}
                      />
                      <StatPill
                        label="最高单日"
                        value={`${formatNumber(contributionSummary.maxDayScore)} 分`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 overflow-x-auto hide-scrollbar">
                    <div className="flex flex-col justify-around py-[2px] text-xs text-gray-400">
                      {WEEKDAY_LABELS.map((label) => (
                        <span key={label} className="h-3 leading-3">
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {contributionSummary.weeks.map((week, weekIndex) => (
                        <div
                          key={`week-${weekIndex}`}
                          className="flex flex-col gap-1"
                        >
                          {week.map((cell) => (
                            <div
                              key={cell.key}
                              className={`h-3 w-3 rounded-[2px] ${getContributionClassName(
                                cell,
                              )}`}
                              title={`${formatDate(cell.date)}${
                                cell.isFuture
                                  ? "\n未来日期"
                                  : cell.score > 0
                                    ? `\n${cell.score} 分贡献\n${cell.actions
                                        .map(
                                          (item) =>
                                            `• ${item.label} +${item.score}`,
                                        )
                                        .join("\n")}`
                                    : "\n暂无贡献"
                              }`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setOpenPanel("contribution")}
                      className="text-left transition hover:text-blue-500"
                    >
                      了解我们如何计算贡献度
                    </button>
                    <div className="flex items-center gap-1">
                      <span>Less</span>
                      <div className="h-3 w-3 rounded-[2px] bg-gray-100" />
                      <div className="h-3 w-3 rounded-[2px] bg-green-100" />
                      <div className="h-3 w-3 rounded-[2px] bg-green-200" />
                      <div className="h-3 w-3 rounded-[2px] bg-green-400" />
                      <div className="h-3 w-3 rounded-[2px] bg-green-600" />
                      <span>More</span>
                    </div>
                  </div>
                </GlassCard>
              </div>

              <div>
                <h3 className="mb-3 ml-5 text-md font-normal text-gray-800">
                  更多设置
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {settingsActions.map((item) => (
                    <SettingsActionCard
                      key={item.key}
                      title={item.title}
                      icon={item.icon}
                      description={item.desc}
                      badge={item.badge}
                      onClick={() => openProtectedPanel(item.key)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "notifications" ? (
            profile ? (
              <NotificationBoard
                notifications={notifications}
                isLoading={isLoadingNotifications}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onMarkRead={handleMarkNotificationRead}
              />
            ) : (
              <GuestTabState
                title="登录后查看通知与公告"
                description="系统公告、审核提醒和互动通知会在登录后展示。"
              />
            )
          ) : null}

          {activeTab === "resources" ? (
            profile ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all" as const, label: "全部" },
                    { key: "approved" as const, label: "已通过" },
                    { key: "pending" as const, label: "待审核" },
                    { key: "draft" as const, label: "草稿" },
                    { key: "rejected" as const, label: "未通过" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setResourceFilter(item.key)}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        resourceFilter === item.key
                          ? "bg-first text-white"
                          : "border border-gray-200/70 bg-white/50 text-gray-600 hover:bg-white/70"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {filteredResources.length > 0 ? (
                  <div className="space-y-4">
                    {filteredResources.map((item) => (
                      <GlassCard key={item.id} className="p-5">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.title}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              上传于 {formatDateTime(item.created_at)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getAuditStatusClassName(
                              item.status,
                            )}`}
                          >
                            {getAuditStatusLabel(item.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <StatPill
                            label="类型"
                            value={getResourceTypeLabel(item.resource_type)}
                          />
                          <StatPill
                            label="下载"
                            value={formatNumber(item.downloads)}
                          />
                          <StatPill
                            label="浏览"
                            value={formatNumber(item.views)}
                          />
                          <StatPill
                            label="点赞"
                            value={formatNumber(item.likes)}
                          />
                          <StatPill
                            label="热度"
                            value={`${item.hot_score ?? 0}`}
                          />
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                ) : (
                  <SectionEmptyState
                    title="当前筛选下没有资源"
                    description="你上传的资源会按审核状态显示在这里。"
                  />
                )}
              </div>
            ) : (
              <GuestTabState />
            )
          ) : null}

          {activeTab === "favorites" ? (
            profile ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all" as const, label: "全部" },
                    { key: "resource" as const, label: "资源" },
                    { key: "course" as const, label: "课程" },
                    { key: "teacher" as const, label: "教师" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFavoriteFilter(item.key)}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        favoriteFilter === item.key
                          ? "bg-first text-white"
                          : "border border-gray-200/70 bg-white/50 text-gray-600 hover:bg-white/70"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {filteredFavorites.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filteredFavorites.map((item) => (
                      <GlassCard
                        key={`${getFavoriteType(item)}-${item.id}`}
                        className="p-5"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {getFavoriteTitle(item)}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              收藏于 {formatDateTime(item.created_at)}
                            </p>
                          </div>
                          <span className="rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-xs text-gray-600">
                            {getFavoriteTypeLabel(item)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          {item.resource_type ? (
                            <StatPill
                              label="资源类型"
                              value={getResourceTypeLabel(item.resource_type)}
                            />
                          ) : null}
                          {item.avg_score != null ? (
                            <StatPill
                              label="评分"
                              value={`${item.avg_score}`}
                            />
                          ) : null}
                          {item.hot_score != null ? (
                            <StatPill
                              label="热度"
                              value={`${item.hot_score}`}
                            />
                          ) : null}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                ) : (
                  <SectionEmptyState
                    title="还没有符合条件的收藏"
                    description="你收藏过的资源、课程和教师会统一展示在这里。"
                  />
                )}
              </div>
            ) : (
              <GuestTabState />
            )
          ) : null}

          {activeTab === "evaluations" ? (
            profile ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all" as const, label: "全部" },
                    { key: "teacher" as const, label: "教师评价" },
                    { key: "course" as const, label: "课程评价" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setEvaluationFilter(item.key)}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        evaluationFilter === item.key
                          ? "bg-first text-white"
                          : "border border-gray-200/70 bg-white/50 text-gray-600 hover:bg-white/70"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {filteredTeacherEvaluations.length === 0 &&
                filteredCourseEvaluations.length === 0 ? (
                  <SectionEmptyState
                    title="暂无评价记录"
                    description="你发布的教师评价和课程评价会汇总在这里。"
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredTeacherEvaluations.map((item) => (
                      <GlassCard key={`teacher-${item.id}`} className="p-5">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-xs text-gray-600">
                                教师评价
                              </span>
                              <span className="text-sm text-gray-500">
                                #{item.teacher_id}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                              发布于 {formatDateTime(item.created_at)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getAuditStatusClassName(
                              item.status,
                            )}`}
                          >
                            {getAuditStatusLabel(item.status)}
                          </span>
                        </div>
                        <p className="mb-3 text-sm leading-6 text-gray-700">
                          {item.comment || "未填写文字评价"}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <StatPill
                            label="综合评分"
                            value={`${item.avg_rating}`}
                          />
                          <StatPill
                            label="教学质量"
                            value={`${item.rating_quality ?? "-"}`}
                          />
                          <StatPill
                            label="给分宽松"
                            value={`${item.rating_grading ?? "-"}`}
                          />
                          <StatPill
                            label="考勤要求"
                            value={`${item.rating_attendance ?? "-"}`}
                          />
                          <StatPill
                            label="点赞"
                            value={formatNumber(item.likes)}
                          />
                        </div>
                      </GlassCard>
                    ))}

                    {filteredCourseEvaluations.map((item) => (
                      <GlassCard key={`course-${item.id}`} className="p-5">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-xs text-gray-600">
                                课程评价
                              </span>
                              <span className="text-sm text-gray-500">
                                #{item.course_id}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                              发布于 {formatDateTime(item.created_at)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getAuditStatusClassName(
                              item.status,
                            )}`}
                          >
                            {getAuditStatusLabel(item.status)}
                          </span>
                        </div>
                        <p className="mb-3 text-sm leading-6 text-gray-700">
                          {item.comment || "未填写文字评价"}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <StatPill
                            label="综合评分"
                            value={`${item.avg_rating}`}
                          />
                          <StatPill
                            label="作业量"
                            value={`${item.rating_homework ?? "-"}`}
                          />
                          <StatPill
                            label="收获感"
                            value={`${item.rating_gain ?? "-"}`}
                          />
                          <StatPill
                            label="考试难度"
                            value={`${item.rating_exam_difficulty ?? "-"}`}
                          />
                          <StatPill
                            label="点赞"
                            value={formatNumber(item.likes)}
                          />
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <GuestTabState />
            )
          ) : null}
        </main>
      </div>

      <FloatingPanel
        open={openPanel === "guest"}
        title="登录后可解锁完整个人中心"
        description="登录后即可继续使用资料编辑、校园认证、积分与通知等个人功能。"
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-gray-600">
            完成登录后，你可以直接在当前页面内继续处理资料编辑、校园邮箱认证、积分查询和其他设置，不需要再进入独立设置页。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              前往登录
            </Link>
            <Link
              href="/login?type=true"
              className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white"
            >
              前往注册
            </Link>
          </div>
        </div>
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "profile"}
        title="编辑个人资料"
        description="在当前页面内直接修改昵称、头像、学院和年级，不再跳转其他设置页。"
        onClose={() => setOpenPanel(null)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-gray-600">
            <span>昵称</span>
            <input
              className={FORM_INPUT_CLASS_NAME}
              value={profileForm.nickname}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  nickname: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600">
            <span>头像 URL</span>
            <input
              className={FORM_INPUT_CLASS_NAME}
              value={profileForm.avatar_url}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  avatar_url: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600">
            <span>学院</span>
            <select
              className={FORM_INPUT_CLASS_NAME}
              value={profileForm.department_id}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  department_id: event.target.value,
                }))
              }
            >
              <option value="">请选择学院</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-gray-600">
            <span>入学年份</span>
            <input
              className={FORM_INPUT_CLASS_NAME}
              placeholder="例如 2022"
              value={profileForm.grade}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  grade: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpenPanel(null)}
            className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProfile ? "保存中..." : "保存资料"}
          </button>
        </div>
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "password"}
        title="修改密码"
        description="保持原有风格，但不再跳转找回密码页面，直接在悬浮卡片里完成验证码与新密码设置。"
        onClose={() => setOpenPanel(null)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-gray-600 md:col-span-2">
            <span>校园邮箱</span>
            <input
              className={FORM_INPUT_CLASS_NAME}
              placeholder="填写邮箱前缀或完整邮箱"
              value={passwordForm.email}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600">
            <span>验证码</span>
            <input
              className={FORM_INPUT_CLASS_NAME}
              placeholder="6 位验证码"
              value={passwordForm.captcha}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  captcha: event.target.value,
                }))
              }
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSendPasswordCode}
              disabled={isSendingPasswordCode}
              className="w-full rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSendingPasswordCode ? "发送中..." : "发送验证码"}
            </button>
          </div>
          <label className="space-y-2 text-sm text-gray-600">
            <span>新密码</span>
            <input
              type="password"
              className={FORM_INPUT_CLASS_NAME}
              value={passwordForm.password}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600">
            <span>确认密码</span>
            <input
              type="password"
              className={FORM_INPUT_CLASS_NAME}
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpenPanel(null)}
            className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isResettingPassword}
            className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResettingPassword ? "提交中..." : "确认修改"}
          </button>
        </div>
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "email"}
        title="绑定校园邮箱"
        description="区分校园认证用户与第三方登录用户的关键状态都在这里完成。"
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-4">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${accountPresentation.badgeClassName}`}
          >
            当前状态：{accountPresentation.badge}。{accountPresentation.hint}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-600 md:col-span-2">
              <span>校园邮箱</span>
              <input
                className={FORM_INPUT_CLASS_NAME}
                placeholder="填写邮箱前缀或完整邮箱"
                value={emailForm.email}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm text-gray-600">
              <span>验证码</span>
              <input
                className={FORM_INPUT_CLASS_NAME}
                placeholder="6 位验证码"
                value={emailForm.captcha}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    captcha: event.target.value,
                  }))
                }
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={isSendingEmailCode}
                className="w-full rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingEmailCode ? "发送中..." : "发送验证码"}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpenPanel(null)}
            className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleVerifyEmail}
            disabled={isVerifyingEmail}
            className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifyingEmail ? "验证中..." : "完成认证"}
          </button>
        </div>
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "oauth"}
        title="绑定第三方账号"
        description="接口按文档要求保留 provider + code 绑定方式，避免强制跳离当前页面。"
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "qq" as OAuthBindProvider, label: "QQ" },
              { key: "wechat" as OAuthBindProvider, label: "微信" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setOAuthForm((current) => ({
                    ...current,
                    provider: item.key,
                  }))
                }
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  oauthForm.provider === item.key
                    ? "bg-first text-white"
                    : "border border-gray-200/70 bg-white/50 text-gray-600 hover:bg-white/70"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-200/70 bg-white/55 px-4 py-3 text-sm text-gray-600">
            {accountMode === "oauth_pending_email"
              ? "当前账户已经是第三方登录态，继续绑定可补齐更多快捷登录方式。"
              : "如果后端返回授权码，可直接在这里完成绑定，无需跳转到独立设置页。"}
            {oauthProviders.length > 0 ? (
              <p className="mt-2">
                已成功绑定：
                {oauthProviders
                  .map((item) => (item === "qq" ? "QQ" : "微信"))
                  .join(" / ")}
              </p>
            ) : null}
          </div>
          <label className="space-y-2 text-sm text-gray-600">
            <span>OAuth 授权码</span>
            <textarea
              className={FORM_TEXTAREA_CLASS_NAME}
              placeholder="将 provider 对应的 code 粘贴到这里"
              value={oauthForm.code}
              onChange={(event) =>
                setOAuthForm((current) => ({
                  ...current,
                  code: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpenPanel(null)}
            className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleBindOAuth}
            disabled={isBindingOAuth}
            className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBindingOAuth ? "绑定中..." : "确认绑定"}
          </button>
        </div>
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "points"}
        title="积分流水"
        description="你在资源上传、签到、邀请等行为产生的积分变化都会记录在这里。"
        onClose={() => setOpenPanel(null)}
      >
        {points.items.length > 0 ? (
          <div className="space-y-3">
            {points.items.map((item) => (
              <GlassCard key={item.id} className="border border-white/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {getPointsReasonLabel(item.reason)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        item.change_amount >= 0
                          ? "text-emerald-600"
                          : "text-rose-500"
                      }`}
                    >
                      {item.change_amount >= 0 ? "+" : ""}
                      {item.change_amount}
                    </p>
                    <p className="text-sm text-gray-500">
                      余额 {item.balance_after}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <SectionEmptyState
            title="还没有积分流水"
            description="签到、上传资源和邀请好友后会自动产生积分记录。"
          />
        )}
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "invite"}
        title="分享邀请码"
        description="邀请码直接放在当前页悬浮卡片里查看和复制，无需再切走。"
        onClose={() => setOpenPanel(null)}
      >
        {isLoadingInvite ? (
          <SectionEmptyState title="邀请码加载中..." description="请稍候。" />
        ) : inviteCode ? (
          <div className="space-y-4">
            <GlassCard className="border border-white/50 p-5">
              <p className="text-sm text-gray-500">你的专属邀请码</p>
              <p className="mt-2 text-3xl font-black tracking-[0.18em] hero-gradient-text">
                {inviteCode.invite_code}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                <StatPill
                  label="成功邀请"
                  value={`${inviteCode.used_count} 人`}
                />
                <StatPill
                  label="有效期"
                  value={formatDateTime(inviteCode.expires_at)}
                />
              </div>
            </GlassCard>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCopyInviteCode}
                className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white"
              >
                复制邀请码
              </button>
            </div>
          </div>
        ) : (
          <SectionEmptyState title="暂无邀请码" description="请稍后再试。" />
        )}
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "downloads"}
        title="下载记录"
        description="结合个人中心文档中的下载历史接口，统一收进概览页下方的设置入口。"
        onClose={() => setOpenPanel(null)}
      >
        {isLoadingDownloads ? (
          <SectionEmptyState title="下载记录加载中..." description="请稍候。" />
        ) : downloads.items.length > 0 ? (
          <div className="space-y-3">
            {downloads.items.map((item) => (
              <GlassCard key={item.id} className="border border-white/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.resource.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>{getResourceTypeLabel(item.resource.resource_type)}</p>
                    <p>消耗 {item.points_cost} 积分</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <SectionEmptyState
            title="暂无下载记录"
            description="下载过的资源会按时间倒序展示在这里。"
          />
        )}
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "feedback"}
        title="意见反馈"
        description="延续现有页面风格，把建议提交入口直接收进玻璃卡片。"
        onClose={() => setOpenPanel(null)}
      >
        <div className="grid grid-cols-1 gap-4">
          <label className="space-y-2 text-sm text-gray-600">
            <span>反馈类型</span>
            <select
              className={FORM_INPUT_CLASS_NAME}
              value={feedbackForm.type}
              onChange={(event) =>
                setFeedbackForm((current) => ({
                  ...current,
                  type: event.target.value as FeedbackInput["type"],
                }))
              }
            >
              <option value="suggestion">建议</option>
              <option value="bug">问题反馈</option>
              <option value="complaint">投诉</option>
              <option value="other">其他</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-gray-600">
            <span>标题</span>
            <input
              className={FORM_INPUT_CLASS_NAME}
              value={feedbackForm.title}
              onChange={(event) =>
                setFeedbackForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600">
            <span>内容</span>
            <textarea
              className={FORM_TEXTAREA_CLASS_NAME}
              value={feedbackForm.content}
              onChange={(event) =>
                setFeedbackForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
            />
          </label>
          <label className="space-y-2 text-sm text-gray-600">
            <span>联系方式</span>
            <input
              className={FORM_INPUT_CLASS_NAME}
              value={feedbackForm.contact ?? ""}
              onChange={(event) =>
                setFeedbackForm((current) => ({
                  ...current,
                  contact: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpenPanel(null)}
            className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmitFeedback}
            disabled={isSubmittingFeedback}
            className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingFeedback ? "提交中..." : "提交反馈"}
          </button>
        </div>
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "report"}
        title="举报 / 纠错"
        description="同一张悬浮卡片内处理内容治理和信息修正，不额外切换页面。"
        onClose={() => setOpenPanel(null)}
      >
        <div className="mb-4 flex gap-2">
          {[
            { key: "report" as const, label: "举报" },
            { key: "correction" as const, label: "纠错" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setReportMode(item.key)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                reportMode === item.key
                  ? "bg-first text-white"
                  : "border border-gray-200/70 bg-white/50 text-gray-600 hover:bg-white/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {reportMode === "report" ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-600">
                <span>目标类型</span>
                <select
                  className={FORM_INPUT_CLASS_NAME}
                  value={reportForm.target_type}
                  onChange={(event) =>
                    setReportForm((current) => ({
                      ...current,
                      target_type: event.target.value as ReportTargetType,
                    }))
                  }
                >
                  <option value="resource">资源</option>
                  <option value="evaluation">评价</option>
                  <option value="comment">评论</option>
                  <option value="user">用户</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>原因</span>
                <select
                  className={FORM_INPUT_CLASS_NAME}
                  value={reportForm.reason}
                  onChange={(event) =>
                    setReportForm((current) => ({
                      ...current,
                      reason: event.target.value as ReportReason,
                    }))
                  }
                >
                  <option value="copyright">侵权</option>
                  <option value="spam">垃圾内容</option>
                  <option value="inappropriate">不当内容</option>
                  <option value="other">其他</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-gray-600 md:col-span-2">
                <span>目标 ID</span>
                <input
                  className={FORM_INPUT_CLASS_NAME}
                  value={reportForm.target_id}
                  onChange={(event) =>
                    setReportForm((current) => ({
                      ...current,
                      target_id: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600 md:col-span-2">
                <span>补充说明</span>
                <textarea
                  className={FORM_TEXTAREA_CLASS_NAME}
                  value={reportForm.description}
                  onChange={(event) =>
                    setReportForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSubmittingReport}
                className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingReport ? "提交中..." : "提交举报"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-600">
                <span>目标类型</span>
                <select
                  className={FORM_INPUT_CLASS_NAME}
                  value={correctionForm.target_type}
                  onChange={(event) =>
                    setCorrectionForm((current) => ({
                      ...current,
                      target_type: event.target
                        .value as CorrectionInput["target_type"],
                    }))
                  }
                >
                  <option value="resource">资源</option>
                  <option value="course">课程</option>
                  <option value="teacher">教师</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>目标 ID</span>
                <input
                  className={FORM_INPUT_CLASS_NAME}
                  value={correctionForm.target_id || ""}
                  onChange={(event) =>
                    setCorrectionForm((current) => ({
                      ...current,
                      target_id: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>字段名</span>
                <input
                  className={FORM_INPUT_CLASS_NAME}
                  value={correctionForm.field_name ?? ""}
                  onChange={(event) =>
                    setCorrectionForm((current) => ({
                      ...current,
                      field_name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>原始值</span>
                <input
                  className={FORM_INPUT_CLASS_NAME}
                  value={correctionForm.original_value ?? ""}
                  onChange={(event) =>
                    setCorrectionForm((current) => ({
                      ...current,
                      original_value: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600">
                <span>正确值</span>
                <input
                  className={FORM_INPUT_CLASS_NAME}
                  value={correctionForm.correct_value ?? ""}
                  onChange={(event) =>
                    setCorrectionForm((current) => ({
                      ...current,
                      correct_value: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm text-gray-600 md:col-span-2">
                <span>补充说明</span>
                <textarea
                  className={FORM_TEXTAREA_CLASS_NAME}
                  value={correctionForm.description ?? ""}
                  onChange={(event) =>
                    setCorrectionForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmitCorrection}
                disabled={isSubmittingCorrection}
                className="rounded-xl bg-first px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingCorrection ? "提交中..." : "提交纠错"}
              </button>
            </div>
          </>
        )}
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "contribution"}
        title="贡献度策略"
        description="贡献图不再用随机色块，而是按个人中心真实行为生成。"
        onClose={() => setOpenPanel(null)}
      >
        <div className="space-y-3">
          {CONTRIBUTION_RULES.map((rule) => (
            <GlassCard key={rule.title} className="border border-white/50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{rule.title}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {rule.detail}
                  </p>
                </div>
                <span className="rounded-full border border-gray-200 bg-white/60 px-3 py-1 text-sm font-semibold text-first">
                  +{rule.score} 分
                </span>
              </div>
            </GlassCard>
          ))}
          <p className="text-sm leading-6 text-gray-600">
            这套规则的核心是“内容生产权重大于纯活跃”。上传通过审核的资源与高质量评价会直接主导热力图颜色，签到与邀请作为辅助信号存在，但不会盖过真正能帮助他人的贡献。
          </p>
        </div>
      </FloatingPanel>

      {!hasHydrated || (accessToken && !dashboard && isLoadingDashboard) ? (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-[5] flex justify-center">
          <div className="rounded-full bg-white/70 px-4 py-2 text-sm text-gray-500 shadow-sm backdrop-blur-sm">
            个人中心数据加载中...
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function FloatingPanel({
  open,
  title,
  description,
  children,
  onClose,
  headerAction,
}: {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  headerAction?: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] px-4 py-6 sm:px-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/15 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="关闭设置面板"
      />
      <div className="relative mx-auto flex h-full max-w-3xl items-center">
        <GlassCard className="max-h-[88vh] w-full overflow-hidden border border-white/70">
          <div className="flex items-start justify-between gap-4 border-b border-white/40 px-6 py-5">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/55 text-gray-500 transition hover:bg-white/80 hover:text-gray-800"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path
                    d="M15 9L9 15M9 9L15 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="max-h-[calc(88vh-5.5rem)] overflow-y-auto px-6 py-5">
            {children}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function SettingsActionCard({
  title,
  icon,
  description,
  badge,
  onClick,
}: {
  title: string;
  icon: string;
  description: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <div className="group relative h-full">
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 z-10 rounded-2xl"
        aria-label={title}
      />
      <GlassCard className="flex h-[76px] items-start gap-3 overflow-hidden p-3.5 transition-colors group-hover:bg-white/60">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-lg shadow-inner transition-transform group-hover:scale-110">
          <i className={`uil uil-${icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{title}</h4>
            {badge ? (
              <span className="rounded-full bg-first/10 px-2 py-0.5 text-[11px] text-first">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] leading-4 text-gray-500">
            {description}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

function NotificationBoard({
  notifications,
  isLoading,
  onMarkAllRead,
  onMarkRead,
}: {
  notifications: PaginatedData<NotificationItem>;
  isLoading: boolean;
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
}) {
  const announcementItems = notifications.items.filter(
    (item) => item.type === "system",
  );
  const messageItems = notifications.items.filter(
    (item) => item.type !== "system",
  );

  if (isLoading) {
    return (
      <SectionEmptyState title="通知与公告加载中..." description="请稍候。" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {notifications.items.length > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="rounded-xl border border-gray-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-white"
          >
            全部标记已读
          </button>
        ) : null}
      </div>

      <NotificationSection
        title="公告"
        description="系统公告与平台提醒"
        items={announcementItems}
        emptyTitle="暂无公告"
        emptyDescription="新的平台公告会展示在这里。"
        onMarkRead={onMarkRead}
      />

      <NotificationSection
        title="通知"
        description="审核结果、点赞评论等互动消息"
        items={messageItems}
        emptyTitle="暂无通知"
        emptyDescription="新的互动通知会展示在这里。"
        onMarkRead={onMarkRead}
      />
    </div>
  );
}

function NotificationSection({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
  onMarkRead,
}: {
  title: string;
  description: string;
  items: NotificationItem[];
  emptyTitle: string;
  emptyDescription: string;
  onMarkRead: (id: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="ml-1">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <GlassCard key={item.id} className="border border-white/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-xs text-gray-600">
                      {item.type === "system"
                        ? "公告"
                        : getNotificationTypeLabel(item.type)}
                    </span>
                    {!item.is_read ? (
                      <span className="rounded-full bg-first/10 px-2 py-1 text-[11px] text-first">
                        未读
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 font-medium text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {item.content || "暂无附加内容"}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
                {!item.is_read ? (
                  <button
                    type="button"
                    onClick={() => void onMarkRead(item.id)}
                    className="rounded-xl border border-gray-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-white"
                  >
                    标记已读
                  </button>
                ) : null}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <SectionEmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-gray-200/70 bg-white/55 px-3 py-1.5 text-xs text-gray-600">
      <span className="mr-2 text-gray-400">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function SectionEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <GlassCard className="border-dashed p-12 text-center">
      <img
        src="/undraw_mcp-server_7kvc.svg"
        alt="空状态插画"
        className="mx-auto mb-4 h-24 w-auto opacity-90"
      />
      <h3 className="mb-2 text-xl font-medium text-gray-800">{title}</h3>
      <p className="mx-auto max-w-md text-gray-500">{description}</p>
    </GlassCard>
  );
}

function GuestTabState({
  title = "登录后查看个人内容",
  description = "资源、收藏、评价等个人数据都已接入接口，但需要登录后才能拉取与展示。",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <GlassCard className="border-dashed p-12 text-center">
      <img
        src="/undraw_halloween-2025_o47f.svg"
        alt="游客模式插画"
        className="mx-auto mb-4 opacity-90"
      />
      <h3 className="mb-2 text-xl font-medium text-gray-800">{title}</h3>
      <p className="mx-auto max-w-md text-gray-500">{description}</p>
    </GlassCard>
  );
}
