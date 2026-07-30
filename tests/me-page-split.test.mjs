/**
 * Drives shipped me-page pure helpers + structural ownership after the split.
 * Imports real modules under app/(features)/me — no re-implementation theater.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ME_ROOT = join(ROOT, "app/(features)/me");
const HELPERS = join(ME_ROOT, "components/shared/helpers.ts");
const ME_CACHE = join(ME_ROOT, "components/shared/meCache.ts");
const TYPES = join(ME_ROOT, "components/shared/types.ts");

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function lineCount(rel) {
  return read(rel).split("\n").length;
}

function listMeFiles(dir = ME_ROOT, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listMeFiles(full, acc);
    else if (/\.(tsx?|ts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const ALIAS_REGISTER = join(__dirname, "register-ts-path-alias.mjs");

function runHelpers(snippet) {
  const runner = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--import",
      pathToFileURL(ALIAS_REGISTER).href,
      "--input-type=module",
      "-e",
      `
import {
  applyCheckinToDashboard,
  clearCachedDailyCheckinDateKey,
  CONTRIBUTION_WEEKS,
  createBaseDashboard,
  createEmptyContributionSummary,
  createEmptyPaginated,
  createSkeletonContributionWeeks,
  getAccountMode,
  getAccountPresentation,
  getCachedDailyCheckinDateKey,
  hasCachedCheckinOnDate,
  hasCheckedInOnDate,
  MOBILE_CONTRIBUTION_WEEKS,
  parseMeTabParam,
  resolveProtectedPanelOpen,
  setCachedDailyCheckinDateKey,
  syncDailyCheckinCacheFromSummary,
} from ${JSON.stringify(pathToFileURL(HELPERS).href)};
${snippet}
`,
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.equal(runner.status, 0, runner.stderr || runner.stdout);
  const lines = runner.stdout.trim().split("\n");
  return JSON.parse(lines[lines.length - 1]);
}

function runMeCache(snippet) {
  const runner = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--import",
      pathToFileURL(ALIAS_REGISTER).href,
      "--input-type=module",
      "-e",
      `
import {
  buildDashboardFromCache,
  clearMeDashboardCache,
  getMeDashboardCacheKey,
  ME_DASHBOARD_CACHE_KEY_PREFIX,
  patchMeDashboardCache,
  readMeDashboardCache,
  readPersistedAuthShell,
  resetPersistedAuthShellCache,
  writeMeDashboardCache,
} from ${JSON.stringify(pathToFileURL(ME_CACHE).href)};
${snippet}
`,
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.equal(runner.status, 0, runner.stderr || runner.stdout);
  const lines = runner.stdout.trim().split("\n");
  return JSON.parse(lines[lines.length - 1]);
}

test("me page.tsx is composition-only and substantially thinner than the ~1320 monolith", () => {
  const pageLines = lineCount("app/(features)/me/page.tsx");
  assert.ok(
    pageLines < 400,
    `page.tsx still too large (${pageLines} lines); expected composition shell < 400`,
  );

  const page = read("app/(features)/me/page.tsx");
  // Orchestration imports — not leaf panel implementations
  assert.match(page, /useMeDashboard/);
  assert.match(page, /MeSidebar/);
  assert.match(page, /MeTabBar/);
  assert.match(page, /MePanels/);
  assert.match(page, /MeOverview/);
  assert.match(page, /MeResources/);
  assert.match(page, /MeFavorites/);
  assert.match(page, /MeEvaluations/);
  assert.match(page, /MeNotifications/);
  // Must not re-define leaf UI
  assert.ok(!/function FloatingPanel/.test(page));
  assert.ok(!/function SectionLoadingState/.test(page));
  assert.ok(!/function GuestTabState/.test(page));
  assert.ok(!/async function loadDashboard|const loadDashboard = useCallback/.test(page));
  assert.ok(!/dailyCheckin|getMyProfile/.test(page));
});

test("extracted modules exist and own former page responsibilities", () => {
  const required = [
    "app/(features)/me/hooks/useMeDashboard.ts",
    "app/(features)/me/components/FloatingPanel.tsx",
    "app/(features)/me/components/SectionStates.tsx",
    "app/(features)/me/components/MeSidebar.tsx",
    "app/(features)/me/components/MeTabBar.tsx",
    "app/(features)/me/components/MePanels.tsx",
    "app/(features)/me/components/shared/types.ts",
    "app/(features)/me/components/shared/helpers.ts",
  ];
  for (const rel of required) {
    assert.ok(existsSync(join(ROOT, rel)), `missing ${rel}`);
  }

  const hook = read("app/(features)/me/hooks/useMeDashboard.ts");
  assert.match(hook, /loadDashboard/);
  assert.match(hook, /dailyCheckin/);
  assert.match(hook, /getMyResources|loadResources/);
  assert.match(hook, /getMyFavorites|loadFavorites/);
  assert.match(hook, /getMyCourseEvaluations|loadEvaluations/);
  assert.match(hook, /OAUTH_BIND_ERROR_STORAGE_KEY/);
  assert.match(hook, /resolveProtectedPanelOpen|openProtectedPanel/);

  const floating = read("app/(features)/me/components/FloatingPanel.tsx");
  assert.match(floating, /TDesignFloatingShell/);
  assert.match(floating, /title=\{title\}/);
  // Compact form shell so inputs don't span an oversized dialog
  assert.match(floating, /maxWidth\s*=\s*["']28rem["']|maxWidth\s*=\s*maxWidth/);

  const captchaField = read(
    "app/(features)/me/components/CaptchaCodeField.tsx",
  );
  assert.match(captchaField, /from\s+['"]tdesign-react['"]/);
  assert.match(captchaField, /\bButton\b/);
  assert.match(captchaField, /获取验证码/);
  assert.match(captchaField, /td-me-captcha-row/);
  assert.match(captchaField, /td-form-field--grow|flex-1/);

  const utilities = read("app/styles/utilities.css");
  assert.match(utilities, /\.td-me-captcha-row/);
  assert.match(utilities, /margin-left:\s*auto/);
  assert.match(utilities, /\.td-me-list-item/);

  const passwordPanel = read(
    "app/(features)/me/components/panels/PasswordPanel.tsx",
  );
  assert.ok(
    !passwordPanel.includes(
      "修改密码仍通过邮箱验证码完成。验证码发送后，请回到此处继续填写新密码。",
    ),
    "password panel tip about returning after captcha must be removed",
  );
  assert.match(passwordPanel, /CaptchaCodeField/);
  assert.ok(
    !passwordPanel.includes("ActionSubmitButton"),
    "password captcha must use TDesign, not ActionSubmitButton",
  );

  const emailPanel = read("app/(features)/me/components/panels/EmailPanel.tsx");
  assert.match(emailPanel, /CaptchaCodeField/);
  assert.ok(
    !emailPanel.includes("ActionSubmitButton"),
    "email captcha must use TDesign, not ActionSubmitButton",
  );

  assert.match(utilities, /--td-brand-color:\s*var\(--first-color/);
  assert.match(utilities, /\.td-floating-shell--desktop\.t-dialog[\s\S]*border-radius:\s*8px/);

  const panels = read("app/(features)/me/components/MePanels.tsx");
  for (const panel of [
    "ProfilePanel",
    "PasswordPanel",
    "EmailPanel",
    "OAuthPanel",
    "PointsPanel",
    "DownloadsPanel",
    "FeedbackPanel",
    "ContributionPanel",
  ]) {
    assert.match(panels, new RegExp(panel));
  }

  // Panel keys remain in shared types (surface contract)
  const types = read("app/(features)/me/components/shared/types.ts");
  for (const key of [
    "overview",
    "resources",
    "favorites",
    "evaluations",
    "notifications",
    "guest",
    "profile",
    "password",
    "email",
    "oauth",
    "points",
    "invite",
    "downloads",
    "feedback",
    "correction",
    "contribution",
  ]) {
    assert.match(types, new RegExp(`"${key}"`));
  }
});

test("page still wires tabs, panels, OAuth storage key path, and check-in surface", () => {
  const page = read("app/(features)/me/page.tsx");
  assert.match(page, /parseMeTabParam|searchParams\.get\(["']tab["']\)/);
  assert.match(page, /openProtectedPanel|onOpenPanel/);
  assert.match(page, /handleCheckin|onCheckin/);

  const hook = read("app/(features)/me/hooks/useMeDashboard.ts");
  assert.match(hook, /OAUTH_BIND_ERROR_STORAGE_KEY/);
  assert.match(hook, /setOpenPanel\(["']oauth["']\)/);
  assert.match(hook, /dailyCheckin/);

  // Existing leaf tab components still present
  for (const leaf of [
    "MeOverview.tsx",
    "MeResources.tsx",
    "MeFavorites.tsx",
    "MeEvaluations.tsx",
    "MeNotifications.tsx",
  ]) {
    assert.ok(
      existsSync(join(ME_ROOT, "components", leaf)),
      `tab leaf missing: ${leaf}`,
    );
  }
});

test("createEmptyPaginated / createBaseDashboard / account-mode (shipped helpers)", () => {
  const out = runHelpers(`
const empty = createEmptyPaginated();
const emptyContrib = createEmptyContributionSummary();
const skeletonWeeks = createSkeletonContributionWeeks();
const mobileSkeletonWeeks = createSkeletonContributionWeeks(MOBILE_CONTRIBUTION_WEEKS);
const profile = {
  id: "u1",
  nickname: "测",
  email: "a@csu.edu.cn",
  email_verified: true,
  points: 10,
  role: "user",
  department_id: 1,
  grade: 2022,
  avatar_url: null,
  free_download_count: 0,
  oauth_bindings: null,
};
const emailVerified = {
  email: "a@csu.edu.cn",
  email_verified: true,
  free_download_count: 0,
};
const emailPending = {
  email: null,
  email_verified: false,
  free_download_count: 3,
};
const base = createBaseDashboard(profile, emailVerified);
const guestMode = getAccountMode(null, emailPending);
const verifiedMode = getAccountMode(profile, emailVerified);
const oauthMode = getAccountMode(
  { ...profile, email_verified: false, email: null },
  emailPending,
);
const presentation = getAccountPresentation(guestMode, emailPending, null);
console.log(JSON.stringify({
  emptyTotal: empty.total,
  emptyItems: empty.items,
  contribDays: emptyContrib.active_days,
  emptyWeeks: emptyContrib.weeks.length,
  skeletonWeekCount: skeletonWeeks.length,
  skeletonDayCount: skeletonWeeks[0]?.length ?? 0,
  mobileSkeletonWeekCount: mobileSkeletonWeeks.length,
  contributionWeeksConst: CONTRIBUTION_WEEKS,
  mobileWeeksConst: MOBILE_CONTRIBUTION_WEEKS,
  baseScore: base.contributionScore,
  baseResTotal: base.resources.total,
  baseFavTotal: base.favorites.total,
  baseProfileId: base.profile.id,
  baseEmail: base.emailStatus.email,
  hasDepartments: Array.isArray(base.departments),
  guestMode,
  verifiedMode,
  oauthMode,
  guestBadge: presentation.badge,
}));
`);

  assert.equal(out.emptyTotal, 0);
  assert.deepEqual(out.emptyItems, []);
  assert.equal(out.contribDays, 0);
  assert.equal(out.emptyWeeks, 0);
  assert.equal(out.skeletonWeekCount, out.contributionWeeksConst);
  assert.equal(out.skeletonDayCount, 7);
  assert.equal(out.mobileSkeletonWeekCount, out.mobileWeeksConst);
  assert.equal(out.contributionWeeksConst, 52);
  assert.equal(out.mobileWeeksConst, 15);
  assert.equal(out.baseScore, 0);
  assert.equal(out.baseResTotal, 0);
  assert.equal(out.baseFavTotal, 0);
  assert.equal(out.baseProfileId, "u1");
  assert.equal(out.baseEmail, "a@csu.edu.cn");
  assert.equal(out.hasDepartments, true);
  assert.equal(out.guestMode, "guest");
  assert.equal(out.verifiedMode, "verified");
  assert.equal(out.oauthMode, "oauth_pending_email");
  assert.equal(out.guestBadge, "未登录");
});

test("parseMeTabParam + resolveProtectedPanelOpen (shipped helpers)", () => {
  const out = runHelpers(`
const tabs = {
  overview: parseMeTabParam("overview"),
  resources: parseMeTabParam("resources"),
  favorites: parseMeTabParam("favorites"),
  evaluations: parseMeTabParam("evaluations"),
  notifications: parseMeTabParam("notifications"),
  bad: parseMeTabParam("nope"),
  empty: parseMeTabParam(null),
};
const decisions = {
  contribGuest: resolveProtectedPanelOpen("contribution", {
    isAuthenticated: false,
    isVerifiedCampusEmail: false,
  }),
  profileGuest: resolveProtectedPanelOpen("profile", {
    isAuthenticated: false,
    isVerifiedCampusEmail: false,
  }),
  passwordBlocked: resolveProtectedPanelOpen("password", {
    isAuthenticated: true,
    isVerifiedCampusEmail: false,
  }),
  emailBlocked: resolveProtectedPanelOpen("email", {
    isAuthenticated: true,
    isVerifiedCampusEmail: true,
  }),
  downloads: resolveProtectedPanelOpen("downloads", {
    isAuthenticated: true,
    isVerifiedCampusEmail: true,
  }),
  invite: resolveProtectedPanelOpen("invite", {
    isAuthenticated: true,
    isVerifiedCampusEmail: false,
  }),
  profileOk: resolveProtectedPanelOpen("profile", {
    isAuthenticated: true,
    isVerifiedCampusEmail: true,
  }),
};
console.log(JSON.stringify({ tabs, decisions }));
`);

  assert.equal(out.tabs.overview, "overview");
  assert.equal(out.tabs.resources, "resources");
  assert.equal(out.tabs.favorites, "favorites");
  assert.equal(out.tabs.evaluations, "evaluations");
  assert.equal(out.tabs.notifications, "notifications");
  assert.equal(out.tabs.bad, null);
  assert.equal(out.tabs.empty, null);

  assert.deepEqual(out.decisions.contribGuest, {
    action: "open",
    panel: "contribution",
  });
  assert.deepEqual(out.decisions.profileGuest, { action: "guest" });
  assert.deepEqual(out.decisions.passwordBlocked, { action: "block" });
  assert.deepEqual(out.decisions.emailBlocked, { action: "block" });
  assert.deepEqual(out.decisions.downloads, {
    action: "open",
    panel: "downloads",
    sideEffect: "downloads",
  });
  assert.deepEqual(out.decisions.invite, {
    action: "open",
    panel: "invite",
    sideEffect: "invite",
  });
  assert.deepEqual(out.decisions.profileOk, {
    action: "open",
    panel: "profile",
  });
});

test("hasCheckedInOnDate + applyCheckinToDashboard (shipped helpers)", () => {
  const out = runHelpers(`
const summary = createEmptyContributionSummary();
summary.weeks = [[
  {
    date: "2026-07-27",
    score: 1,
    level: 1,
    is_future: false,
    actions: [{ type: "daily_checkin", label: "签到", score: 1 }],
  },
  {
    date: "2026-07-26",
    score: 0,
    level: 0,
    is_future: false,
    actions: [],
  },
]];
const checked = hasCheckedInOnDate(summary, "2026-07-27");
const notChecked = hasCheckedInOnDate(summary, "2026-07-26");
const emptyKey = hasCheckedInOnDate(summary, "");

const profile = {
  id: "u1",
  nickname: "测",
  email: "a@csu.edu.cn",
  email_verified: true,
  points: 10,
  role: "user",
  department_id: 1,
  grade: 2022,
  avatar_url: null,
  free_download_count: 0,
  oauth_bindings: null,
};
const base = createBaseDashboard(profile, {
  email: profile.email,
  email_verified: true,
  free_download_count: 0,
});
const next = applyCheckinToDashboard(
  base,
  { balance_after: 12, points_gained: 2 },
  10,
  1_700_000_000_000,
);
console.log(JSON.stringify({
  checked,
  notChecked,
  emptyKey,
  nextPoints: next.profile.points,
  nextTotal: next.points.total,
  firstReason: next.points.items[0]?.reason,
  firstChange: next.points.items[0]?.change_amount,
  firstId: next.points.items[0]?.id,
}));
`);

  assert.equal(out.checked, true);
  assert.equal(out.notChecked, false);
  assert.equal(out.emptyKey, false);
  assert.equal(out.nextPoints, 12);
  assert.equal(out.nextTotal, 1);
  assert.equal(out.firstReason, "daily_checkin");
  assert.equal(out.firstChange, 2);
  assert.equal(out.firstId, "1700000000000");
});

test("daily checkin local cache avoids flash without network", () => {
  const out = runHelpers(`
const store = new Map();
const localStorageMock = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
globalThis.localStorage = localStorageMock;
globalThis.window = { localStorage: localStorageMock };

const userId = "user-42";
const today = "2026-07-27";
const yesterday = "2026-07-26";

// cold start: no cache
const cold = hasCachedCheckinOnDate(userId, today);

setCachedDailyCheckinDateKey(userId, today);
const warm = hasCachedCheckinOnDate(userId, today);
const wrongDay = hasCachedCheckinOnDate(userId, yesterday);
const wrongUser = hasCachedCheckinOnDate("other", today);
const raw = getCachedDailyCheckinDateKey(userId);

// sync from summary: checked in → keep/write
const summaryChecked = createEmptyContributionSummary();
summaryChecked.weeks = [[
  {
    date: today,
    score: 1,
    level: 1,
    is_future: false,
    actions: [{ type: "daily_checkin", label: "签到", score: 1 }],
  },
]];
syncDailyCheckinCacheFromSummary(userId, summaryChecked, today);
const afterSyncChecked = hasCachedCheckinOnDate(userId, today);

// sync from summary: day present without checkin → clear
const summaryEmpty = createEmptyContributionSummary();
summaryEmpty.weeks = [[
  {
    date: today,
    score: 0,
    level: 0,
    is_future: false,
    actions: [],
  },
]];
syncDailyCheckinCacheFromSummary(userId, summaryEmpty, today);
const afterSyncEmpty = hasCachedCheckinOnDate(userId, today);

// incomplete data (no today cell) must not wipe cache
setCachedDailyCheckinDateKey(userId, today);
const summaryIncomplete = createEmptyContributionSummary();
summaryIncomplete.weeks = [[]];
syncDailyCheckinCacheFromSummary(userId, summaryIncomplete, today);
const afterIncomplete = hasCachedCheckinOnDate(userId, today);

clearCachedDailyCheckinDateKey(userId);
const afterClear = hasCachedCheckinOnDate(userId, today);

console.log(JSON.stringify({
  cold,
  warm,
  wrongDay,
  wrongUser,
  raw,
  afterSyncChecked,
  afterSyncEmpty,
  afterIncomplete,
  afterClear,
}));
`);

  assert.equal(out.cold, false);
  assert.equal(out.warm, true);
  assert.equal(out.wrongDay, false);
  assert.equal(out.wrongUser, false);
  assert.equal(out.raw, "2026-07-27");
  assert.equal(out.afterSyncChecked, true);
  assert.equal(out.afterSyncEmpty, false);
  assert.equal(out.afterIncomplete, true);
  assert.equal(out.afterClear, false);
});

test("me dashboard cache read/write/patch (localStorage + session)", () => {
  const out = runMeCache(`
const store = new Map();
const localStorageMock = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
globalThis.localStorage = localStorageMock;
globalThis.window = { localStorage: localStorageMock };

const userId = "u-cache-1";
const cold = readMeDashboardCache(userId);

const resources = { items: [{ id: "r1" }], total: 3 };
const favorites = { items: [], total: 7 };
const courseEvaluations = { items: [{ id: "e1" }], total: 2 };
const contributions = {
  weeks: [[{ date: "2026-07-27", score: 1, level: 1, is_future: false, actions: [] }]],
  active_days: 1,
  current_streak: 1,
  max_day_score: 1,
};

writeMeDashboardCache(userId, {
  contributions,
  contributionScore: 12,
  unreadCount: 5,
  resources,
  favorites,
  courseEvaluations,
});

const warm = readMeDashboardCache(userId);
patchMeDashboardCache(userId, { unreadCount: 1, favorites: { items: [], total: 9 } });
const patched = readMeDashboardCache(userId);

clearMeDashboardCache(userId);
// session memory still holds until TTL — localStorage clear only
const afterClearStorage = localStorageMock.getItem(getMeDashboardCacheKey(userId));

console.log(JSON.stringify({
  coldIsNull: cold === null,
  warmUserId: warm?.userId,
  warmUnread: warm?.unreadCount,
  warmResourcesTotal: warm?.resources?.total,
  warmFavoritesTotal: warm?.favorites?.total,
  warmEvalTotal: warm?.courseEvaluations?.total,
  warmScore: warm?.contributionScore,
  warmWeeks: warm?.contributions?.weeks?.length,
  patchedUnread: patched?.unreadCount,
  patchedFavoritesTotal: patched?.favorites?.total,
  afterClearStorage,
  keyPrefix: ME_DASHBOARD_CACHE_KEY_PREFIX,
}));
`);

  assert.equal(out.coldIsNull, true);
  assert.equal(out.warmUserId, "u-cache-1");
  assert.equal(out.warmUnread, 5);
  assert.equal(out.warmResourcesTotal, 3);
  assert.equal(out.warmFavoritesTotal, 7);
  assert.equal(out.warmEvalTotal, 2);
  assert.equal(out.warmScore, 12);
  assert.equal(out.warmWeeks, 1);
  assert.equal(out.patchedUnread, 1);
  assert.equal(out.patchedFavoritesTotal, 9);
  assert.equal(out.afterClearStorage, null);
  assert.match(out.keyPrefix, /me-dashboard/);
});

test("readPersistedAuthShell + buildDashboardFromCache seed shell without network", () => {
  const out = runMeCache(`
const store = new Map();
const localStorageMock = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
globalThis.localStorage = localStorageMock;
globalThis.window = { localStorage: localStorageMock };
resetPersistedAuthShellCache();

const empty = readPersistedAuthShell();
const emptyAgain = readPersistedAuthShell();
localStorageMock.setItem("auth-storage", JSON.stringify({
  state: {
    access_token: "tok-1",
    user: {
      id: "u-shell",
      nickname: "壳",
      email: "a@csu.edu.cn",
      email_verified: true,
      points: 8,
      role: "user",
      department_id: 1,
      grade: 2022,
      avatar_url: null,
      free_download_count: 0,
      oauth_bindings: null,
    },
  },
}));
const warmAuth = readPersistedAuthShell();
const warmAuthAgain = readPersistedAuthShell();

writeMeDashboardCache("u-shell", {
  contributions: { weeks: [[
    { date: "2026-07-27", score: 0, level: 0, is_future: false, actions: [] },
  ]], active_days: 0, current_streak: 0, max_day_score: 0 },
  contributionScore: 4,
  unreadCount: 2,
  resources: { items: [], total: 11 },
  favorites: { items: [], total: 6 },
  courseEvaluations: { items: [], total: 3 },
});
const cache = readMeDashboardCache("u-shell");
const shell = buildDashboardFromCache(warmAuth.user, cache);

console.log(JSON.stringify({
  emptyToken: empty.accessToken,
  emptyStable: empty === emptyAgain,
  warmToken: warmAuth.accessToken,
  warmUserId: warmAuth.user?.id,
  warmStable: warmAuth === warmAuthAgain,
  shellScore: shell.contributionScore,
  shellResTotal: shell.resources.total,
  shellUnread: shell.unreadCount,
  shellProfileId: shell.profile.id,
}));
`);

  assert.equal(out.emptyToken, null);
  assert.equal(out.emptyStable, true);
  assert.equal(out.warmToken, "tok-1");
  assert.equal(out.warmUserId, "u-shell");
  assert.equal(out.warmStable, true);
  assert.equal(out.shellScore, 4);
  assert.equal(out.shellResTotal, 11);
  assert.equal(out.shellUnread, 2);
  assert.equal(out.shellProfileId, "u-shell");
});

test("MeTabBar uses TDesign Badge for tab counts", () => {
  const tabBar = read("app/(features)/me/components/MeTabBar.tsx");
  assert.match(tabBar, /from "tdesign-react"/);
  assert.match(tabBar, /Badge/);
  assert.match(tabBar, /showZero=\{false\}/);
  assert.match(tabBar, /resourcesTotal/);
  assert.match(tabBar, /favoritesTotal/);
  assert.match(tabBar, /evaluationsTotal/);
  assert.match(tabBar, /unreadCount/);
});

test("useMeDashboard prefetches list totals and hydrates me cache", () => {
  const hook = read("app/(features)/me/hooks/useMeDashboard.ts");
  assert.match(hook, /readMeDashboardCache/);
  assert.match(hook, /writeMeDashboardCache|persistDashboardCache/);
  assert.match(hook, /getMyResources/);
  assert.match(hook, /getMyFavorites/);
  assert.match(hook, /getMyCourseEvaluations/);
  assert.match(hook, /getUnreadNotificationCount/);
  assert.match(hook, /showDashboardLoadingPill/);
  assert.match(hook, /hasDisplayShell|readPersistedAuthShell/);
  assert.match(hook, /useLayoutEffect/);
});

test("me page only shows delayed loading pill when shell is empty", () => {
  const page = read("app/(features)/me/page.tsx");
  assert.match(page, /showDashboardLoadingPill/);
  assert.match(page, /delayMs=\{320\}/);
  assert.ok(
    !page.includes("!me.hasHydrated"),
    "must not flash loading pill during auth rehydrate alone",
  );
});

test("FloatingLoadingPill supports delay to avoid flash", () => {
  const asyncState = read("components/ui/AsyncState.tsx");
  assert.match(asyncState, /delayMs/);
  assert.match(asyncState, /setTimeout/);
});

test("package test script includes me split suite", () => {
  const pkg = JSON.parse(read("package.json"));
  // Glob picks up *.test.mjs (me-page-split + component-refactor)
  assert.ok(
    /tests\/\*\.test\.mjs|me-page-split/.test(pkg.scripts?.test ?? ""),
    `package.json test script should pick up me-page-split: ${pkg.scripts?.test}`,
  );
});
