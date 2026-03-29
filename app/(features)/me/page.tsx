/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import type {ReactNode} from "react";
import {useCallback, useEffect, useState} from "react";
import {
  dailyCheckin,
  getMeDashboard,
  getMyDownloads,
  getMyInviteCode,
} from "@/api/me";
import GlassCard from "@/components/ui/GlassCard";
import {feedback} from "@/store/useFeedbackStore";
import {useAuthStore} from "@/store/useAuthStore";
import type {UserProfile} from "@/types/auth";
import type {
  CourseEvaluation,
  DownloadRecord,
  FavoriteItem,
  InviteCodeInfo,
  MeDashboardData,
  PaginatedData,
  PointsRecord,
  ResourceItem,
  TeacherEvaluation,
} from "@/types/me";
import MeEvaluations from "./components/MeEvaluations";
import MeFavorites from "./components/MeFavorites";
import MeNotifications from "./components/MeNotifications";
import MeOverview from "./components/MeOverview";
import MeResources from "./components/MeResources";
import ContributionPanel from "./components/panels/ContributionPanel";
import DownloadsPanel from "./components/panels/DownloadsPanel";
import EmailPanel from "./components/panels/EmailPanel";
import FeedbackPanel from "./components/panels/FeedbackPanel";
import OAuthPanel from "./components/panels/OAuthPanel";
import PasswordPanel from "./components/panels/PasswordPanel";
import PointsPanel from "./components/panels/PointsPanel";
import ProfilePanel from "./components/panels/ProfilePanel";
import {
  type AccountMode,
  type ContributionAction,
  type ContributionCell,
  type ContributionSummary,
  buildFallbackEmailStatus,
  createEmptyPaginated,
  formatDateTime,
  formatNumber,
  getAccountMode,
  getAccountPresentation,
  getDateKey,
  getDepartmentName,
  getErrorMessage,
  startOfDay,
  addDays,
} from "./components/shared/helpers";

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

function getContributionLevel(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0) return 0;
  if (score < 3) return 1;
  if (score < 6) return 2;
  if (score < 9) return 3;
  return 4;
}

function buildContributionSummary(
    resources: PaginatedData<ResourceItem>,
    teacherEvaluations: PaginatedData<TeacherEvaluation>,
    courseEvaluations: PaginatedData<CourseEvaluation>,
    points: PaginatedData<PointsRecord>,
): ContributionSummary {
  const contributionMap = new Map<
      string,
      { score: number; actions: ContributionAction[] }
  >();

  const addContribution = (
      createdAt: string | undefined,
      score: number,
      label: string,
  ) => {
    if (!createdAt || score <= 0) return;
    const key = getDateKey(createdAt);
    if (!key) return;
    const current = contributionMap.get(key) ?? {score: 0, actions: []};
    contributionMap.set(key, {
      score: current.score + score,
      actions: [...current.actions, {label, score}],
    });
  };

  if (resources.items)
    resources.items.forEach((item) => addContribution(item.created_at, 5, "资源上传"));
  if (teacherEvaluations.items)
    teacherEvaluations.items.forEach((item) => addContribution(item.created_at, 3, "发布教师评价"));
  if (courseEvaluations.items)
    courseEvaluations.items.forEach((item) => addContribution(item.created_at, 3, "发布课程评价"));
  points.items.forEach((item) => {
    if (item.reason === "daily_checkin") addContribution(item.created_at, 1, "每日签到");
    if (item.reason === "invite_reward") addContribution(item.created_at, 5, "邀请奖励");
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
        key, date, score,
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
    if (!entry || entry.score <= 0) break;
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  return {weeks, totalScore, activeDays, currentStreak, maxDayScore};
}

export default function Me() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const [dashboard, setDashboard] = useState<MeDashboardData | null>(null);
  const [downloads, setDownloads] = useState<PaginatedData<DownloadRecord>>(
      createEmptyPaginated(),
  );
  const [inviteCode, setInviteCode] = useState<InviteCodeInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingDownloads, setIsLoadingDownloads] = useState(false);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const accessToken = useAuthStore((state) => state.access_token);
  const storedUser = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const setUser = useAuthStore((state) => state.setUser);

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
      accountMode, emailStatus, profile,
  );
  const contributionSummary = buildContributionSummary(
      resources, teacherEvaluations, courseEvaluations, points,
  );
  const hasCheckedInToday = points.items.some(
      (item) =>
          item.reason === "daily_checkin" &&
          getDateKey(item.created_at) === getDateKey(new Date()),
  );

  const loadDashboard = useCallback(
      async (showToast = false) => {
        if (!accessToken) {
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
            feedback.error({title: "个人中心加载失败", description: message});
          }
        } finally {
          setIsLoadingDashboard(false);
        }
      },
      [accessToken, setUser],
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!accessToken) {
      setDashboard(null);
      setDownloads(createEmptyPaginated());
      setInviteCode(null);
      setLoadError("");
      return;
    }
    void loadDashboard();
  }, [accessToken, hasHydrated, loadDashboard]);

  const loadDownloadsData = async () => {
    if (!accessToken) return;
    setIsLoadingDownloads(true);
    try {
      const data = await getMyDownloads({page: 1, size: 20});
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

  const loadInviteCodeData = async () => {
    if (!accessToken) return;
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
    if (panel === "downloads") void loadDownloadsData();
    if (panel === "invite") void loadInviteCodeData();
    setOpenPanel(panel);
  };

  const handleCheckin = async () => {
    if (!profile || !accessToken) {
      setOpenPanel("guest");
      return;
    }
    if (hasCheckedInToday || isCheckingIn) return;
    setIsCheckingIn(true);
    try {
      const result = await dailyCheckin();
      setDashboard((current) => {
        if (!current) return current;
        const nextProfile = {...current.profile, points: result.balance_after};
        const syntheticRecord: PointsRecord = {
          id: Date.now(),
          change_amount: result.points_gained,
          balance_after: result.balance_after,
          reason: "daily_checkin",
          created_at: new Date().toISOString(),
        };
        const nextPoints = result.already_checked_in
            ? current.points
            : {total: current.points.total + 1, items: [syntheticRecord, ...current.points.items]};
        return {...current, profile: nextProfile, points: nextPoints};
      });
      setUser({...profile, points: result.balance_after});
      feedback.success({
        title: result.already_checked_in ? "今天已经签到过了" : "签到成功",
        description: result.already_checked_in
            ? "明天再来领取新的签到积分。"
            : `本次获得 ${result.points_gained} 积分，当前余额 ${result.balance_after}。`,
      });
    } catch (error) {
      feedback.error({title: "签到失败", description: getErrorMessage(error, "请稍后重试")});
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleProfileUpdated = (nextProfile: UserProfile, updater: (current: MeDashboardData | null) => MeDashboardData | null) => {
    setDashboard(updater);
    setUser(nextProfile);
  };

  const handleEmailVerified = (nextProfile: UserProfile, updater: (current: MeDashboardData | null) => MeDashboardData | null) => {
    setDashboard(updater);
    setUser(nextProfile);
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode?.invite_code) return;
    try {
      await navigator.clipboard.writeText(inviteCode.invite_code);
      feedback.success({title: "邀请码已复制", description: `分享给好友即可使用：${inviteCode.invite_code}`});
    } catch {
      feedback.warning({title: "复制失败", description: "浏览器未授予剪贴板权限，请手动复制。"});
    }
  };

  const handleNotificationUnreadChange = (delta: number) => {
    setDashboard((current) =>
        current
            ? {...current, unreadCount: Math.max(0, current.unreadCount + delta)}
            : current,
    );
  };

  return (
      <div
          className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4 py-10 transition-colors duration-300 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row">
          {/* ── Sidebar ── */}
          <aside className="w-full flex-shrink-0 md:w-1/3 lg:w-1/4">
            <div className="sticky top-24 space-y-6">
              <GlassCard className="flex flex-col items-center p-6 text-center md:items-start md:text-left">
                <div className="group relative mb-4 cursor-pointer">
                  <img
                      className="h-48 w-48 rounded-full border-4 border-white/50 object-cover shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                      src={profile?.avatar_url || "/furina.jpg"}
                      alt="User Avatar"
                  />
                  <div
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
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
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <span>{emailStatus.email ?? "尚未绑定校园邮箱"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <span>{getDepartmentName(departments, profile?.department_id)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    <span>{profile?.grade ? `${profile.grade}级` : "年级未填写"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.866 0-7 2.239-7 5v3h14v-3c0-2.761-3.134-5-7-5zm0 0a4 4 0 100-8 4 4 0 000 8z"/>
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

          {/* ── Main content ── */}
          <main className="w-full flex-1">
            <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200/50 pb-px hide-scrollbar">
              {[
                {key: "overview" as TabKey, label: "概览"},
                {key: "resources" as TabKey, label: "我的资源", count: resources.total},
                {key: "favorites" as TabKey, label: "收藏夹", count: favorites.total},
                {key: "evaluations" as TabKey, label: "我的评价", count: teacherEvaluations.total + courseEvaluations.total},
                {key: "notifications" as TabKey, label: "通知与公告", count: unreadCount},
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
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
                <MeOverview
                    profile={profile}
                    accountMode={accountMode}
                    contributionData={contributionSummary}
                    onOpenPanel={openProtectedPanel}
                />
            ) : null}

            {activeTab === "resources" ? (
                profile ? (
                    <MeResources resources={resources}/>
                ) : (
                    <GuestTabState/>
                )
            ) : null}

            {activeTab === "favorites" ? (
                profile ? (
                    <MeFavorites favorites={favorites}/>
                ) : (
                    <GuestTabState/>
                )
            ) : null}

            {activeTab === "evaluations" ? (
                profile ? (
                    <MeEvaluations
                        teacherEvaluations={teacherEvaluations}
                        courseEvaluations={courseEvaluations}
                    />
                ) : (
                    <GuestTabState/>
                )
            ) : null}

            {activeTab === "notifications" ? (
                profile ? (
                    <MeNotifications
                        onUnreadCountChange={handleNotificationUnreadChange}
                    />
                ) : (
                    <GuestTabState
                        title="登录后查看通知与公告"
                        description="系统公告、审核提醒和互动通知会在登录后展示。"
                    />
                )
            ) : null}
          </main>
        </div>

        {/* ── Floating Panels ── */}
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
          {profile ? (
              <ProfilePanel
                  profile={profile}
                  departments={departments}
                  onClose={() => setOpenPanel(null)}
                  onProfileUpdated={handleProfileUpdated}
              />
          ) : null}
        </FloatingPanel>

        <FloatingPanel
            open={openPanel === "password"}
            title="修改密码"
            description="保持原有风格，但不再跳转找回密码页面，直接在悬浮卡片里完成验证码与新密码设置。"
            onClose={() => setOpenPanel(null)}
        >
          <PasswordPanel
              initialEmail={emailStatus.email ?? profile?.email ?? ""}
              onClose={() => setOpenPanel(null)}
          />
        </FloatingPanel>

        <FloatingPanel
            open={openPanel === "email"}
            title="绑定校园邮箱"
            description="区分校园认证用户与第三方登录用户的关键状态都在这里完成。"
            onClose={() => setOpenPanel(null)}
        >
          {profile ? (
              <EmailPanel
                  profile={profile}
                  emailStatus={emailStatus}
                  accountMode={accountMode}
                  onClose={() => setOpenPanel(null)}
                  onEmailVerified={handleEmailVerified}
              />
          ) : null}
        </FloatingPanel>

        <FloatingPanel
            open={openPanel === "oauth"}
            title="绑定第三方账号"
            description="接口按文档要求保留 provider + code 绑定方式，避免强制跳离当前页面。"
            onClose={() => setOpenPanel(null)}
        >
          <OAuthPanel
              accountMode={accountMode}
              onClose={() => setOpenPanel(null)}
              onOAuthBound={() => {}}
          />
        </FloatingPanel>

        <FloatingPanel
            open={openPanel === "points"}
            title="积分流水"
            description="你在资源上传、签到、邀请等行为产生的积分变化都会记录在这里。"
            onClose={() => setOpenPanel(null)}
        >
          <PointsPanel points={points.items}/>
        </FloatingPanel>

        <FloatingPanel
            open={openPanel === "invite"}
            title="分享邀请码"
            description="邀请码直接放在当前页悬浮卡片里查看和复制，无需再切走。"
            onClose={() => setOpenPanel(null)}
        >
          {isLoadingInvite ? (
              <SectionEmptyState title="邀请码加载中..." description="请稍候。"/>
          ) : inviteCode ? (
              <div className="space-y-4">
                <GlassCard className="border border-white/50 p-5">
                  <p className="text-sm text-gray-500">你的专属邀请码</p>
                  <p className="mt-2 text-3xl font-black tracking-[0.18em] hero-gradient-text">
                    {inviteCode.invite_code}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                    <StatPill label="成功邀请" value={`${inviteCode.used_count} 人`}/>
                    <StatPill label="有效期" value={formatDateTime(inviteCode.expires_at)}/>
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
              <SectionEmptyState title="暂无邀请码" description="请稍后再试。"/>
          )}
        </FloatingPanel>

        <FloatingPanel
            open={openPanel === "downloads"}
            title="下载记录"
            description="结合个人中心文档中的下载历史接口，统一收进概览页下方的设置入口。"
            onClose={() => setOpenPanel(null)}
        >
          <DownloadsPanel downloads={downloads.items} isLoading={isLoadingDownloads}/>
        </FloatingPanel>

        <FloatingPanel
            open={openPanel === "feedback"}
            title="意见反馈"
            description="延续现有页面风格，把建议提交入口直接收进玻璃卡片。"
            onClose={() => setOpenPanel(null)}
        >
          <FeedbackPanel initialContact={profile?.email ?? ""} mode="feedback" onClose={() => setOpenPanel(null)}/>
        </FloatingPanel>

        <FloatingPanel
            open={openPanel === "report"}
            title="举报 / 纠错"
            description="同一张悬浮卡片内处理内容治理和信息修正，不额外切换页面。"
            onClose={() => setOpenPanel(null)}
        >
          <FeedbackPanel initialContact={profile?.email ?? ""} mode="report" onClose={() => setOpenPanel(null)}/>
        </FloatingPanel>

        <FloatingPanel
            open={openPanel === "contribution"}
            title="贡献度策略"
            description="贡献图不再用随机色块，而是按个人中心真实行为生成。"
            onClose={() => setOpenPanel(null)}
        >
          <ContributionPanel/>
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
  open, title, description, children, onClose, headerAction,
}: {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  headerAction?: ReactNode;
}) {
  if (!open) return null;

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
                <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
              </div>
              <div className="flex items-center gap-3">
                {headerAction}
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/55 text-gray-500 transition hover:bg-white/80 hover:text-gray-800"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

function StatPill({label, value}: { label: string; value: string }) {
  return (
      <div className="rounded-full border border-gray-200/70 bg-white/55 px-3 py-1.5 text-xs text-gray-600">
        <span className="mr-2 text-gray-400">{label}</span>
        <span className="font-medium text-gray-800">{value}</span>
      </div>
  );
}

function SectionEmptyState({title, description}: { title: string; description: string }) {
  return (
      <GlassCard className="border-dashed p-12 text-center">
        <img src="/undraw_mcp-server_7kvc.svg" alt="空状态插画" className="mx-auto mb-4 h-24 w-auto opacity-90"/>
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
        <img src="/undraw_halloween-2025_o47f.svg" alt="游客模式插画" className="mx-auto mb-4 opacity-90"/>
        <h3 className="mb-2 text-xl font-medium text-gray-800">{title}</h3>
        <p className="mx-auto max-w-md text-gray-500">{description}</p>
      </GlassCard>
  );
}
