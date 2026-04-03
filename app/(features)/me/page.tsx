/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  dailyCheckin,
  getMeDashboard,
  getMyDownloads,
  getMyInviteCode,
} from "@/api/me";
import GlassCard from "@/components/ui/GlassCard";
import { useHasMounted } from "@/hooks/useHasMounted";
import { feedback } from "@/store/useFeedbackStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserProfile } from "@/types/auth";
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
  buildFallbackEmailStatus,
  createEmptyContributionSummary,
  createEmptyPaginated,
  formatDateTime,
  formatNumber,
  getAccountMode,
  getAccountPresentation,
  getDateKey,
  getDepartmentName,
  getErrorMessage,
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

export default function Me() {
  const hasMounted = useHasMounted();
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
  const contributionSummary =
    dashboard?.contributions ?? createEmptyContributionSummary();
  const unreadCount = dashboard?.unreadCount ?? 0;
  const accountMode = getAccountMode(profile, emailStatus);
  const accountPresentation = getAccountPresentation(
    accountMode,
    emailStatus,
    profile,
  );
  const todayKey = hasMounted ? getDateKey(new Date()) : "";
  const hasCheckedInToday = todayKey
    ? contributionSummary.weeks
        .flat()
        .find((item) => item.date === todayKey)
        ?.actions.some((item) => item.type === "daily_checkin") ?? false
    : false;

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
          feedback.error({ title: "个人中心加载失败", description: message });
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
    const noAuthRequiredPanels: PanelKey[] = [
      "feedback",
      "report",
      "contribution",
    ];
    if (noAuthRequiredPanels.includes(panel)) {
      setOpenPanel(panel);
      return;
    }

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
      if (result.already_checked_in) {
        feedback.info({
          title: "今天已经签到过了",
          description: "明天再来领取新的签到积分。",
        });
        void loadDashboard();
        return;
      }

      const currentPoints = profile.points ?? 0;
      const nextBalance =
        result.balance_after ?? currentPoints;
      const gainedPoints =
        result.points_gained ?? Math.max(0, nextBalance - currentPoints);

      setDashboard((current) => {
        if (!current) return current;
        const nextProfile = {
          ...current.profile,
          points: nextBalance,
        };
        const syntheticRecord: PointsRecord = {
          id: Date.now(),
          change_amount: gainedPoints,
          balance_after: nextBalance,
          reason: "daily_checkin",
          created_at: new Date().toISOString(),
        };
        const nextPoints = {
          total: current.points.total + 1,
          items: [syntheticRecord, ...current.points.items],
        };
        return { ...current, profile: nextProfile, points: nextPoints };
      });
      setUser({ ...profile, points: nextBalance });
      void loadDashboard();
      feedback.success({
        title: "签到成功",
        description:
          gainedPoints > 0
            ? `本次获得 ${gainedPoints} 积分，当前余额 ${nextBalance}。`
            : `当前积分余额 ${nextBalance}。`,
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

  const handleProfileUpdated = (
    nextProfile: UserProfile,
    updater: (current: MeDashboardData | null) => MeDashboardData | null,
  ) => {
    setDashboard(updater);
    setUser(nextProfile);
  };

  const handleEmailVerified = (
    nextProfile: UserProfile,
    updater: (current: MeDashboardData | null) => MeDashboardData | null,
  ) => {
    setDashboard(updater);
    setUser(nextProfile);
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode?.invite_code) return;
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

  const handleNotificationUnreadChange = (delta: number) => {
    setDashboard((current) =>
      current
        ? { ...current, unreadCount: Math.max(0, current.unreadCount + delta) }
        : current,
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white px-4 py-10 transition-colors duration-300 sm:px-6 lg:px-8">
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
                    {profile?.grade ? `${profile.grade}级` : "当前版本暂未接入年级资料"}
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

        {/* ── Main content ── */}
        <main className="w-full flex-1">
          <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200/50 pb-px hide-scrollbar">
            {[
              { key: "overview" as TabKey, label: "概览" },
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
              <MeResources resources={resources} />
            ) : (
              <GuestTabState />
            )
          ) : null}

          {activeTab === "favorites" ? (
            profile ? (
              <MeFavorites favorites={favorites} />
            ) : (
              <GuestTabState />
            )
          ) : null}

          {activeTab === "evaluations" ? (
            profile ? (
              <MeEvaluations
                teacherEvaluations={teacherEvaluations}
                courseEvaluations={courseEvaluations}
              />
            ) : (
              <GuestTabState />
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
            登录后即可管理你的个人信息、进行校园认证、查看积分和消息通知，并解锁社区的完整功能。
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
        description="修改你的昵称、头像或学院信息。"
        onClose={() => setOpenPanel(null)}
      >
        {profile ? (
          <ProfilePanel
            profile={profile}
            onClose={() => setOpenPanel(null)}
            onProfileUpdated={handleProfileUpdated}
          />
        ) : null}
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "password"}
        title="修改密码"
        description="通过校园邮箱验证码来重置你的登录密码。"
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
        description="绑定校园邮箱以获取在中南星的完整访问权限。"
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
        description="绑定你的其他账号，以后可以使用它们一键快捷登录。"
        onClose={() => setOpenPanel(null)}
      >
        <OAuthPanel
          accountMode={accountMode}
          bindings={profile?.oauth_bindings ?? null}
          onClose={() => setOpenPanel(null)}
        />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "points"}
        title="积分流水"
        description="你在资源上传、签到、邀请等行为产生的积分变化都会记录在这里。"
        onClose={() => setOpenPanel(null)}
      >
        <PointsPanel points={points.items} />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "invite"}
        title="分享邀请码"
        description="邀请身边的好友加入中南星社区，获取丰厚奖励。"
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
        description="查看你曾下载过的全部资源记录。"
        onClose={() => setOpenPanel(null)}
      >
        <DownloadsPanel
          downloads={downloads.items}
          isLoading={isLoadingDownloads}
        />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "feedback"}
        title="意见反馈"
        description="如果你有任何建议或遇到了问题，请告诉我们。"
        onClose={() => setOpenPanel(null)}
      >
        <FeedbackPanel
          mode="feedback"
          onClose={() => setOpenPanel(null)}
        />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "report"}
        title="违规举报与信息纠错"
        description="感谢你协助我们维护社区的环境与信息准确性。"
        onClose={() => setOpenPanel(null)}
      >
        <FeedbackPanel
          mode="report"
          onClose={() => setOpenPanel(null)}
        />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "contribution"}
        title="贡献度策略"
        description="了解你在社区的活跃度与贡献是如何计算的。"
        onClose={() => setOpenPanel(null)}
      >
        <ContributionPanel />
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

        .modal-scrollbar {
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.78) transparent;
        }

        .modal-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 999px;
        }

        .modal-scrollbar::-webkit-scrollbar-thumb {
          border: 3px solid transparent;
          border-radius: 999px;
          background-clip: content-box;
          background-color: rgba(148, 163, 184, 0.78);
        }

        .modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 116, 139, 0.92);
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] px-4 py-6 sm:px-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
        aria-label="关闭设置面板"
      />
      <div className="relative mx-auto flex h-full max-w-3xl items-center">
        <div className="max-h-[88vh] w-full overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-[0_30px_110px_rgba(15,23,42,0.16)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 bg-white/85 px-6 py-5">
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-gray-500 shadow-sm transition hover:bg-slate-50 hover:text-gray-800"
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
          <div className="modal-scrollbar max-h-[calc(88vh-5.5rem)] overflow-y-auto bg-white/80 px-6 py-5">
            {children}
          </div>
        </div>
      </div>
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
  description = "登录后即可查看你的资源、收藏和评价记录。",
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
