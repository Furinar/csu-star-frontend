"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  dailyCheckin,
  getMyContributions,
  getMyContributionScore,
  getMyCourseEvaluations,
  getMyDownloads,
  getMyEmailStatus,
  getMyFavorites,
  getMyInviteCode,
  getMyProfile,
  getMyResources,
  getUnreadNotificationCount,
} from "@/api/me";
import { useHasMounted } from "@/hooks/useHasMounted";
import { feedback } from "@/store/useFeedbackStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
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
} from "@/types/me";
import { DEFAULT_AVATAR_SRC, resolveAvatarSrc } from "@/lib/avatar";
import { OAUTH_BIND_ERROR_STORAGE_KEY } from "@/lib/oauth";
import {
  applyCheckinToDashboard,
  buildFallbackEmailStatus,
  createBaseDashboard,
  createEmptyContributionSummary,
  createEmptyPaginated,
  getAccountMode,
  getAccountPresentation,
  getDateKey,
  getErrorMessage,
  hasCachedCheckinOnDate,
  hasCheckedInOnDate,
  resolveProtectedPanelOpen,
  setCachedDailyCheckinDateKey,
  syncDailyCheckinCacheFromSummary,
} from "../components/shared/helpers";
import {
  buildDashboardFromCache,
  EMPTY_PERSISTED_AUTH_SHELL,
  patchMeDashboardCache,
  readMeDashboardCache,
  readPersistedAuthShell,
  writeMeDashboardCache,
  type PersistedAuthShell,
} from "../components/shared/meCache";
import type { PanelKey, TabKey } from "../components/shared/types";

const LIST_PAGE_SIZE = 100;

function subscribePersistedAuthNoop() {
  return () => {};
}

function getServerPersistedAuthShell(): PersistedAuthShell {
  return EMPTY_PERSISTED_AUTH_SHELL;
}

/**
 * Client-only sync read of auth localStorage; server snapshot stays empty.
 * getSnapshot (readPersistedAuthShell) must return a cached reference.
 */
function usePersistedAuthShell(): PersistedAuthShell {
  return useSyncExternalStore(
    subscribePersistedAuthNoop,
    readPersistedAuthShell,
    getServerPersistedAuthShell,
  );
}

export interface UseMeDashboardOptions {
  activeTab: TabKey;
  setOpenPanel: (panel: PanelKey | null) => void;
}

function mergePaginatedPreferIncoming<T>(
  incoming: PaginatedData<T> | undefined,
  current: PaginatedData<T> | undefined,
  empty: PaginatedData<T>,
): PaginatedData<T> {
  if (incoming) return incoming;
  if (current) return current;
  return empty;
}

export function useMeDashboard({
  activeTab,
  setOpenPanel,
}: UseMeDashboardOptions) {
  const hasMounted = useHasMounted();
  const [dashboard, setDashboard] = useState<MeDashboardData | null>(null);
  const [downloads, setDownloads] = useState<PaginatedData<DownloadRecord>>(
    createEmptyPaginated(),
  );
  const [inviteCode, setInviteCode] = useState<InviteCodeInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [isLoadingDownloads, setIsLoadingDownloads] = useState(false);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [evaluationsLoaded, setEvaluationsLoaded] = useState(false);
  const [resourcesError, setResourcesError] = useState("");
  const [favoritesError, setFavoritesError] = useState("");
  const [evaluationsError, setEvaluationsError] = useState("");
  const cacheHydratedUserRef = useRef<string | null>(null);
  const dashboardRef = useRef<MeDashboardData | null>(null);

  const storeAccessToken = useAuthStore((state) => state.access_token);
  const storedUser = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const setUser = useAuthStore((state) => state.setUser);
  // Paint with localStorage auth before Zustand rehydrate finishes.
  const persistedAuth = usePersistedAuthShell();
  const accessToken = storeAccessToken ?? persistedAuth.accessToken;

  const profile =
    dashboard?.profile ?? storedUser ?? persistedAuth.user ?? null;
  const emailStatus =
    dashboard?.emailStatus ?? buildFallbackEmailStatus(profile);
  dashboardRef.current = dashboard;
  const departments = dashboard?.departments ?? [];
  const resources =
    dashboard?.resources ?? createEmptyPaginated<ResourceItem>();
  const favorites =
    dashboard?.favorites ?? createEmptyPaginated<FavoriteItem>();
  const courseEvaluations =
    dashboard?.courseEvaluations ?? createEmptyPaginated<CourseEvaluation>();
  const points = dashboard?.points ?? createEmptyPaginated<PointsRecord>();
  const contributionSummary =
    dashboard?.contributions ?? createEmptyContributionSummary();
  const liveUnreadCount = useNotificationStore((state) => state.unreadCount);
  const setLiveUnreadCount = useNotificationStore(
    (state) => state.setUnreadCount,
  );
  const unreadCount = liveUnreadCount;
  const accountMode = getAccountMode(profile, emailStatus);
  const accountPresentation = getAccountPresentation(
    accountMode,
    emailStatus,
    profile,
  );
  const profileAvatarSrc = resolveAvatarSrc(
    profile?.avatar_url,
    DEFAULT_AVATAR_SRC,
  );
  const isVerifiedCampusEmail = Boolean(
    emailStatus.email_verified || profile?.email_verified,
  );
  const todayKey = hasMounted ? getDateKey(new Date()) : "";
  const userId = profile?.id;
  // Prefer local cache so re-entering "我的" does not flash "未签到" before API returns.
  const hasCheckedInToday =
    hasCheckedInOnDate(contributionSummary, todayKey) ||
    hasCachedCheckinOnDate(userId, todayKey);

  const persistDashboardCache = useCallback(
    (data: MeDashboardData) => {
      const id = data.profile?.id;
      if (!id) return;
      writeMeDashboardCache(id, {
        contributions: data.contributions,
        contributionScore: data.contributionScore,
        unreadCount: data.unreadCount,
        resources: data.resources,
        favorites: data.favorites,
        courseEvaluations: data.courseEvaluations,
      });
    },
    [],
  );

  const loadDashboard = useCallback(
    async (showToast = false) => {
      if (!accessToken) {
        setDashboard(null);
        setLoadError("");
        return;
      }
      // Silent revalidate when we already have shell data (cache / auth user).
      // Avoids flashing "个人中心数据加载中..." on every re-entry.
      const hasDisplayShell = Boolean(
        dashboardRef.current ||
          useAuthStore.getState().user ||
          readPersistedAuthShell().user,
      );
      if (!hasDisplayShell) {
        setIsLoadingDashboard(true);
      }
      setLoadError("");
      try {
        // Fetch profile/core + tab list totals together so badges show without
        // opening each tab. List payloads are reused when the user opens a tab.
        const [
          profileResult,
          emailStatusResult,
          contributionsResult,
          contributionScoreResult,
          unreadCountResult,
          resourcesResult,
          favoritesResult,
          evaluationsResult,
        ] = await Promise.allSettled([
          getMyProfile(),
          getMyEmailStatus(),
          getMyContributions(),
          getMyContributionScore(),
          getUnreadNotificationCount(),
          getMyResources({ page: 1, size: LIST_PAGE_SIZE }),
          getMyFavorites({ page: 1, size: LIST_PAGE_SIZE }),
          getMyCourseEvaluations({ page: 1, size: LIST_PAGE_SIZE }),
        ]);

        if (profileResult.status !== "fulfilled") {
          throw profileResult.reason;
        }

        if (emailStatusResult.status !== "fulfilled") {
          throw emailStatusResult.reason;
        }

        const baseDashboard = createBaseDashboard(
          profileResult.value,
          emailStatusResult.value,
        );
        const nextResources =
          resourcesResult.status === "fulfilled"
            ? resourcesResult.value
            : undefined;
        const nextFavorites =
          favoritesResult.status === "fulfilled"
            ? favoritesResult.value
            : undefined;
        const nextEvaluations =
          evaluationsResult.status === "fulfilled"
            ? evaluationsResult.value
            : undefined;

        const data: MeDashboardData = {
          ...baseDashboard,
          unreadCount:
            unreadCountResult.status === "fulfilled"
              ? unreadCountResult.value
              : 0,
          contributions:
            contributionsResult.status === "fulfilled"
              ? contributionsResult.value
              : createEmptyContributionSummary(),
          contributionScore:
            contributionScoreResult.status === "fulfilled"
              ? contributionScoreResult.value.score
              : 0,
          resources:
            nextResources ?? createEmptyPaginated<ResourceItem>(),
          favorites:
            nextFavorites ?? createEmptyPaginated<FavoriteItem>(),
          courseEvaluations:
            nextEvaluations ?? createEmptyPaginated<CourseEvaluation>(),
        };

        setDashboard((current) => {
          const merged: MeDashboardData = {
            ...data,
            resources: mergePaginatedPreferIncoming(
              nextResources,
              current?.resources,
              data.resources,
            ),
            favorites: mergePaginatedPreferIncoming(
              nextFavorites,
              current?.favorites,
              data.favorites,
            ),
            teacherEvaluations:
              current?.teacherEvaluations ?? data.teacherEvaluations,
            courseEvaluations: mergePaginatedPreferIncoming(
              nextEvaluations,
              current?.courseEvaluations,
              data.courseEvaluations,
            ),
            points: current?.points ?? data.points,
            // Keep contribution score if this request failed but we already had one
            contributionScore:
              contributionScoreResult.status === "fulfilled"
                ? data.contributionScore
                : (current?.contributionScore ?? data.contributionScore),
            contributions:
              contributionsResult.status === "fulfilled"
                ? data.contributions
                : (current?.contributions ?? data.contributions),
            unreadCount:
              unreadCountResult.status === "fulfilled"
                ? data.unreadCount
                : (current?.unreadCount ?? data.unreadCount),
          };
          persistDashboardCache(merged);
          return merged;
        });

        if (nextResources) setResourcesLoaded(true);
        if (nextFavorites) setFavoritesLoaded(true);
        if (nextEvaluations) setEvaluationsLoaded(true);

        if (unreadCountResult.status === "fulfilled") {
          setLiveUnreadCount(data.unreadCount);
        }
        setUser(profileResult.value);
        // Keep local check-in cache in sync for instant UI on next visit.
        syncDailyCheckinCacheFromSummary(
          profileResult.value.id,
          data.contributions,
          getDateKey(new Date()),
        );
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
    [accessToken, persistDashboardCache, setLiveUnreadCount, setUser],
  );

  const loadResources = useCallback(async () => {
    if (!accessToken || isLoadingResources || resourcesLoaded) return;

    setIsLoadingResources(true);
    setResourcesError("");
    try {
      const data = await getMyResources({ page: 1, size: LIST_PAGE_SIZE });
      setDashboard((current) => {
        if (!current) return current;
        const next = { ...current, resources: data };
        persistDashboardCache(next);
        return next;
      });
      setResourcesLoaded(true);
    } catch (error) {
      const message = getErrorMessage(error, "资源列表加载失败");
      setResourcesError(message);
    } finally {
      setIsLoadingResources(false);
    }
  }, [accessToken, isLoadingResources, persistDashboardCache, resourcesLoaded]);

  const loadFavorites = useCallback(async () => {
    if (!accessToken || isLoadingFavorites || favoritesLoaded) return;

    setIsLoadingFavorites(true);
    setFavoritesError("");
    try {
      const data = await getMyFavorites({ page: 1, size: LIST_PAGE_SIZE });
      setDashboard((current) => {
        if (!current) return current;
        const next = { ...current, favorites: data };
        persistDashboardCache(next);
        return next;
      });
      setFavoritesLoaded(true);
    } catch (error) {
      const message = getErrorMessage(error, "收藏列表加载失败");
      setFavoritesError(message);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [accessToken, favoritesLoaded, isLoadingFavorites, persistDashboardCache]);

  const loadEvaluations = useCallback(async () => {
    if (!accessToken || isLoadingEvaluations || evaluationsLoaded) return;

    setIsLoadingEvaluations(true);
    setEvaluationsError("");
    try {
      const courseData = await getMyCourseEvaluations({
        page: 1,
        size: LIST_PAGE_SIZE,
      });
      setDashboard((current) => {
        if (!current) return current;
        const next = { ...current, courseEvaluations: courseData };
        persistDashboardCache(next);
        return next;
      });
      setEvaluationsLoaded(true);
    } catch (error) {
      const message = getErrorMessage(error, "评价列表加载失败");
      setEvaluationsError(message);
    } finally {
      setIsLoadingEvaluations(false);
    }
  }, [
    accessToken,
    evaluationsLoaded,
    isLoadingEvaluations,
    persistDashboardCache,
  ]);

  // Paint me-cache before first browser paint when possible (after auth shell exists).
  useLayoutEffect(() => {
    const authUser =
      useAuthStore.getState().user ?? readPersistedAuthShell().user;
    const userId = authUser?.id;
    if (!userId || cacheHydratedUserRef.current === userId) return;

    const cached = readMeDashboardCache(userId);
    // Always seed a shell from profile so loadDashboard stays silent.
    const shell = buildDashboardFromCache(authUser, cached);
    setDashboard((current) => {
      if (current?.profile?.id === userId) {
        if (!cached) return current;
        return {
          ...current,
          resources:
            current.resources.total > 0 || current.resources.items.length > 0
              ? current.resources
              : cached.resources,
          favorites:
            current.favorites.total > 0 || current.favorites.items.length > 0
              ? current.favorites
              : cached.favorites,
          courseEvaluations:
            current.courseEvaluations.total > 0 ||
            current.courseEvaluations.items.length > 0
              ? current.courseEvaluations
              : cached.courseEvaluations,
          contributions:
            current.contributions.weeks.length > 0
              ? current.contributions
              : cached.contributions,
          contributionScore:
            current.contributionScore || cached.contributionScore,
          unreadCount: current.unreadCount || cached.unreadCount,
        };
      }
      return shell;
    });
    if (cached) {
      setResourcesLoaded(true);
      setFavoritesLoaded(true);
      setEvaluationsLoaded(true);
      const liveUnread = useNotificationStore.getState().unreadCount;
      if (liveUnread === 0 && cached.unreadCount > 0) {
        setLiveUnreadCount(cached.unreadCount);
      }
    }
    cacheHydratedUserRef.current = userId;
  }, [accessToken, hasHydrated, persistedAuth.user?.id, setLiveUnreadCount]);

  // Network revalidate after auth is ready (silent when shell already painted).
  useEffect(() => {
    if (!hasHydrated) return;
    if (!accessToken) {
      cacheHydratedUserRef.current = null;
      setDashboard(null);
      setDownloads(createEmptyPaginated());
      setInviteCode(null);
      setLoadError("");
      setResourcesLoaded(false);
      setFavoritesLoaded(false);
      setEvaluationsLoaded(false);
      setResourcesError("");
      setFavoritesError("");
      setEvaluationsError("");
      return;
    }

    void loadDashboard();
  }, [accessToken, hasHydrated, loadDashboard]);

  // Tab open: only fetch if dashboard prefetch/cache did not already populate.
  useEffect(() => {
    if (!accessToken) return;

    if (activeTab === "resources") {
      void loadResources();
      return;
    }

    if (activeTab === "favorites") {
      void loadFavorites();
      return;
    }

    if (activeTab === "evaluations") {
      void loadEvaluations();
    }
  }, [
    accessToken,
    activeTab,
    loadEvaluations,
    loadFavorites,
    loadResources,
  ]);

  useEffect(() => {
    if (!hasMounted) return;
    const message = sessionStorage.getItem(OAUTH_BIND_ERROR_STORAGE_KEY);
    if (!message) return;
    sessionStorage.removeItem(OAUTH_BIND_ERROR_STORAGE_KEY);
    feedback.error({
      title: "第三方账号绑定失败",
      description: message,
    });
    setOpenPanel("oauth");
  }, [hasMounted, setOpenPanel]);

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
    const decision = resolveProtectedPanelOpen(panel, {
      isAuthenticated: Boolean(profile && accessToken),
      isVerifiedCampusEmail,
    });

    if (decision.action === "guest") {
      setOpenPanel("guest");
      return;
    }
    if (decision.action === "block") {
      return;
    }
    if (decision.sideEffect === "downloads") void loadDownloadsData();
    if (decision.sideEffect === "invite") void loadInviteCodeData();
    setOpenPanel(decision.panel);
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
      const checkinDateKey = getDateKey(new Date());
      if (result.already_checked_in) {
        setCachedDailyCheckinDateKey(profile.id, checkinDateKey);
        feedback.info({
          title: "今天已经签到过了",
          description: "明天再来领取新的签到积分。",
        });
        void loadDashboard();
        return;
      }

      const currentPoints = profile.points ?? 0;
      const nextBalance = result.balance_after ?? currentPoints;
      const gainedPoints =
        result.points_gained ?? Math.max(0, nextBalance - currentPoints);

      // Persist before setState so the next render already shows 今日已签到.
      setCachedDailyCheckinDateKey(profile.id, checkinDateKey);
      setDashboard((current) => {
        if (!current) return current;
        const next = applyCheckinToDashboard(current, result, currentPoints);
        persistDashboardCache(next);
        return next;
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
    setDashboard((current) => {
      const next = updater(current);
      if (next) persistDashboardCache(next);
      return next;
    });
    setUser(nextProfile);
  };

  const handleEmailVerified = (
    nextProfile: UserProfile,
    updater: (current: MeDashboardData | null) => MeDashboardData | null,
  ) => {
    setDashboard((current) => {
      const next = updater(current);
      if (next) persistDashboardCache(next);
      return next;
    });
    setUser(nextProfile);
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode?.invite_code) return;
    try {
      const inviteLink = `${window.location.origin}/login?type=true&invite_code=${encodeURIComponent(inviteCode.invite_code)}`;
      await navigator.clipboard.writeText(inviteLink);
      feedback.success({
        title: "邀请链接已复制",
        description: "好友打开链接后会自动填充邀请码。",
      });
    } catch {
      feedback.warning({
        title: "复制失败",
        description: "浏览器未授予剪贴板权限，请手动复制邀请链接。",
      });
    }
  };

  const handleNotificationUnreadChange = (delta: number) => {
    const next = Math.max(0, liveUnreadCount + delta);
    setLiveUnreadCount(next);
    setDashboard((current) => {
      if (!current) return current;
      const merged = { ...current, unreadCount: next };
      patchMeDashboardCache(merged.profile.id, { unreadCount: next });
      return merged;
    });
  };

  // Only block with a loading pill when there is nothing meaningful to paint.
  const showDashboardLoadingPill = Boolean(
    hasHydrated &&
      accessToken &&
      !profile &&
      !dashboard &&
      isLoadingDashboard,
  );

  return {
    hasHydrated,
    accessToken,
    dashboard,
    profile,
    emailStatus,
    departments,
    resources,
    favorites,
    courseEvaluations,
    points,
    contributionSummary,
    contributionScore: dashboard?.contributionScore ?? 0,
    unreadCount,
    accountMode,
    accountPresentation,
    profileAvatarSrc,
    isVerifiedCampusEmail,
    hasCheckedInToday,
    downloads,
    inviteCode,
    loadError,
    isLoadingDashboard,
    showDashboardLoadingPill,
    isLoadingResources,
    isLoadingFavorites,
    isLoadingEvaluations,
    isLoadingDownloads,
    isLoadingInvite,
    isCheckingIn,
    resourcesError,
    favoritesError,
    evaluationsError,
    loadDashboard,
    loadResources,
    loadFavorites,
    loadEvaluations,
    openProtectedPanel,
    handleCheckin,
    handleProfileUpdated,
    handleEmailVerified,
    handleCopyInviteCode,
    handleNotificationUnreadChange,
    setResourcesLoaded,
    setFavoritesLoaded,
    setEvaluationsLoaded,
  };
}
