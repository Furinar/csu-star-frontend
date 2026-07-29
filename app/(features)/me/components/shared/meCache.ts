/**
 * Local persistence + session memory for /me dashboard lists and tab counts.
 * Enables instant badge totals and stale-while-revalidate tab content.
 */

import {
  LIST_CACHE_TTL_MS,
  readListCache,
  writeListCache,
} from "@/lib/listQueryCache";
import type { UserProfile } from "@/types/auth";
import type {
  ContributionSummary,
  CourseEvaluation,
  FavoriteItem,
  MeDashboardData,
  PaginatedData,
  ResourceItem,
} from "@/types/me";
import {
  buildFallbackEmailStatus,
  createBaseDashboard,
  createEmptyContributionSummary,
  createEmptyPaginated,
} from "./helpers";

/** Zustand persist key for auth-storage (useAuthStore). */
export const AUTH_STORAGE_KEY = "auth-storage";

export const ME_DASHBOARD_CACHE_VERSION = 1 as const;
export const ME_DASHBOARD_CACHE_KEY_PREFIX = "csu-star:me-dashboard:v1:";
/** localStorage snapshot TTL — longer than in-memory list cache */
export const ME_DASHBOARD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type MeDashboardCacheSnapshot = {
  version: typeof ME_DASHBOARD_CACHE_VERSION;
  userId: string;
  updatedAt: number;
  contributions: ContributionSummary;
  contributionScore: number;
  unreadCount: number;
  resources: PaginatedData<ResourceItem>;
  favorites: PaginatedData<FavoriteItem>;
  courseEvaluations: PaginatedData<CourseEvaluation>;
};

export function getMeDashboardCacheKey(userId: string) {
  return `${ME_DASHBOARD_CACHE_KEY_PREFIX}${userId}`;
}

export function buildMeSessionCacheKey(
  userId: string,
  section: "resources" | "favorites" | "evaluations" | "dashboard",
) {
  return `me:${userId}:${section}`;
}

function isPaginatedUnknown(value: unknown): value is PaginatedData<unknown> {
  if (!value || typeof value !== "object") return false;
  const record = value as { items?: unknown; total?: unknown };
  return Array.isArray(record.items) && typeof record.total === "number";
}

function normalizePaginatedCache<T>(
  value: unknown,
  fallback: PaginatedData<T> = createEmptyPaginated<T>(),
): PaginatedData<T> {
  if (!isPaginatedUnknown(value)) return fallback;
  return {
    items: (value.items ?? []) as T[],
    total: Math.max(0, value.total),
  };
}

function isContributionSummary(value: unknown): value is ContributionSummary {
  if (!value || typeof value !== "object") return false;
  const record = value as ContributionSummary;
  return Array.isArray(record.weeks);
}

export function readMeDashboardCache(
  userId: string | null | undefined,
  nowMs: number = Date.now(),
): MeDashboardCacheSnapshot | null {
  if (!userId || typeof window === "undefined") return null;

  // Prefer session memory (same SPA navigation) then localStorage.
  const sessionKey = buildMeSessionCacheKey(userId, "dashboard");
  const sessionHit = readListCache<MeDashboardCacheSnapshot>(
    sessionKey,
    ME_DASHBOARD_CACHE_TTL_MS,
  );
  if (sessionHit && sessionHit.userId === userId) {
    return sessionHit;
  }

  try {
    const raw = window.localStorage.getItem(getMeDashboardCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MeDashboardCacheSnapshot>;
    if (
      parsed.version !== ME_DASHBOARD_CACHE_VERSION ||
      parsed.userId !== userId ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }
    if (nowMs - parsed.updatedAt > ME_DASHBOARD_CACHE_TTL_MS) {
      window.localStorage.removeItem(getMeDashboardCacheKey(userId));
      return null;
    }

    const snapshot: MeDashboardCacheSnapshot = {
      version: ME_DASHBOARD_CACHE_VERSION,
      userId,
      updatedAt: parsed.updatedAt,
      contributions: isContributionSummary(parsed.contributions)
        ? parsed.contributions
        : createEmptyContributionSummary(),
      contributionScore:
        typeof parsed.contributionScore === "number"
          ? parsed.contributionScore
          : 0,
      unreadCount:
        typeof parsed.unreadCount === "number"
          ? Math.max(0, parsed.unreadCount)
          : 0,
      resources: normalizePaginatedCache<ResourceItem>(parsed.resources),
      favorites: normalizePaginatedCache<FavoriteItem>(parsed.favorites),
      courseEvaluations: normalizePaginatedCache<CourseEvaluation>(
        parsed.courseEvaluations,
      ),
    };

    writeListCache(sessionKey, snapshot);
    return snapshot;
  } catch {
    return null;
  }
}

export function writeMeDashboardCache(
  userId: string | null | undefined,
  partial: Omit<MeDashboardCacheSnapshot, "version" | "userId" | "updatedAt"> & {
    updatedAt?: number;
  },
  nowMs: number = Date.now(),
) {
  if (!userId || typeof window === "undefined") return;

  const snapshot: MeDashboardCacheSnapshot = {
    version: ME_DASHBOARD_CACHE_VERSION,
    userId,
    updatedAt: partial.updatedAt ?? nowMs,
    contributions: partial.contributions,
    contributionScore: partial.contributionScore,
    unreadCount: Math.max(0, partial.unreadCount),
    resources: partial.resources,
    favorites: partial.favorites,
    courseEvaluations: partial.courseEvaluations,
  };

  writeListCache(buildMeSessionCacheKey(userId, "dashboard"), snapshot);
  writeListCache(
    buildMeSessionCacheKey(userId, "resources"),
    snapshot.resources,
  );
  writeListCache(
    buildMeSessionCacheKey(userId, "favorites"),
    snapshot.favorites,
  );
  writeListCache(
    buildMeSessionCacheKey(userId, "evaluations"),
    snapshot.courseEvaluations,
  );

  try {
    window.localStorage.setItem(
      getMeDashboardCacheKey(userId),
      JSON.stringify(snapshot),
    );
  } catch {
    // ignore quota / private mode
  }
}

/** Patch tab counts / lists onto an existing cache without wiping other fields. */
export function patchMeDashboardCache(
  userId: string | null | undefined,
  patch: Partial<
    Omit<MeDashboardCacheSnapshot, "version" | "userId" | "updatedAt">
  >,
  nowMs: number = Date.now(),
) {
  if (!userId) return;
  const current =
    readMeDashboardCache(userId, nowMs) ??
    ({
      version: ME_DASHBOARD_CACHE_VERSION,
      userId,
      updatedAt: nowMs,
      contributions: createEmptyContributionSummary(),
      contributionScore: 0,
      unreadCount: 0,
      resources: createEmptyPaginated<ResourceItem>(),
      favorites: createEmptyPaginated<FavoriteItem>(),
      courseEvaluations: createEmptyPaginated<CourseEvaluation>(),
    } satisfies MeDashboardCacheSnapshot);

  writeMeDashboardCache(
    userId,
    {
      contributions: patch.contributions ?? current.contributions,
      contributionScore: patch.contributionScore ?? current.contributionScore,
      unreadCount: patch.unreadCount ?? current.unreadCount,
      resources: patch.resources ?? current.resources,
      favorites: patch.favorites ?? current.favorites,
      courseEvaluations: patch.courseEvaluations ?? current.courseEvaluations,
      updatedAt: nowMs,
    },
    nowMs,
  );
}

export function clearMeDashboardCache(userId: string | null | undefined) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getMeDashboardCacheKey(userId));
  } catch {
    // ignore
  }
}

/** Re-export for callers that only need session TTL constant alignment. */
export { LIST_CACHE_TTL_MS };

export type PersistedAuthShell = {
  accessToken: string | null;
  user: UserProfile | null;
};

/** Stable empty shell — required for useSyncExternalStore getSnapshot caching. */
export const EMPTY_PERSISTED_AUTH_SHELL: PersistedAuthShell = {
  accessToken: null,
  user: null,
};

/** Cache last raw localStorage string + shell so getSnapshot is referentially stable. */
let persistedAuthRawCache: string | null | undefined = undefined;
let persistedAuthShellCache: PersistedAuthShell = EMPTY_PERSISTED_AUTH_SHELL;

/**
 * Synchronously read auth snapshot from localStorage (zustand persist shape).
 * Used to paint /me without waiting for AuthBootstrap rehydrate.
 * Safe on server: returns empty shell.
 *
 * IMPORTANT: returns a cached object when storage is unchanged. useSyncExternalStore
 * compares getSnapshot results with Object.is — a new object every call causes
 * "The result of getSnapshot should be cached" infinite re-renders.
 */
export function readPersistedAuthShell(): PersistedAuthShell {
  if (typeof window === "undefined") {
    return EMPTY_PERSISTED_AUTH_SHELL;
  }
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw === persistedAuthRawCache) {
      return persistedAuthShellCache;
    }
    persistedAuthRawCache = raw;

    if (!raw) {
      persistedAuthShellCache = EMPTY_PERSISTED_AUTH_SHELL;
      return persistedAuthShellCache;
    }

    const parsed = JSON.parse(raw) as {
      state?: {
        access_token?: unknown;
        user?: UserProfile | null;
      };
    };
    const state = parsed?.state;
    if (!state) {
      persistedAuthShellCache = EMPTY_PERSISTED_AUTH_SHELL;
      return persistedAuthShellCache;
    }

    const accessToken =
      typeof state.access_token === "string" && state.access_token
        ? state.access_token
        : null;
    const user =
      state.user && typeof state.user === "object" ? state.user : null;

    // Reuse previous shell when values are equal (common after re-read).
    const prev = persistedAuthShellCache;
    if (
      prev.accessToken === accessToken &&
      prev.user === user
    ) {
      return prev;
    }
    if (
      prev.accessToken === accessToken &&
      prev.user?.id === user?.id &&
      prev.user?.points === user?.points &&
      prev.user?.nickname === user?.nickname &&
      prev.user?.avatar_url === user?.avatar_url &&
      prev.user?.email_verified === user?.email_verified
    ) {
      return prev;
    }

    persistedAuthShellCache = { accessToken, user };
    return persistedAuthShellCache;
  } catch {
    persistedAuthRawCache = undefined;
    persistedAuthShellCache = EMPTY_PERSISTED_AUTH_SHELL;
    return persistedAuthShellCache;
  }
}

/** Test helper: drop cached getSnapshot results. */
export function resetPersistedAuthShellCache() {
  persistedAuthRawCache = undefined;
  persistedAuthShellCache = EMPTY_PERSISTED_AUTH_SHELL;
}

/** Merge profile + me cache into a full dashboard shell for instant paint. */
export function buildDashboardFromCache(
  profile: UserProfile,
  cache: MeDashboardCacheSnapshot | null,
): MeDashboardData {
  const base = createBaseDashboard(
    profile,
    buildFallbackEmailStatus(profile),
  );
  if (!cache) return base;
  return {
    ...base,
    contributions: cache.contributions,
    contributionScore: cache.contributionScore,
    unreadCount: cache.unreadCount,
    resources: cache.resources,
    favorites: cache.favorites,
    courseEvaluations: cache.courseEvaluations,
  };
}
