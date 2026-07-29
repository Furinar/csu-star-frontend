"use client";

import { useRouter } from "next/navigation";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "tdesign-react";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserProfile } from "@/types/auth";
import type { ContributionCell, ContributionSummary } from "@/types/me";
import {
  type AccountMode,
  CONTRIBUTION_WEEKS,
  createSkeletonContributionWeeks,
  fitContributionWeekCount,
  formatDate,
  formatNumber,
  WEEKDAY_LABELS,
} from "./shared/helpers";
import {
  ME_ICON_WELL,
  ME_PANEL_PAD,
  ME_SECTION_TITLE,
  ME_SETTINGS_TILE,
} from "./shared/styles";
import type { PanelKey } from "./shared/types";

interface MeOverviewProps {
  profile: UserProfile | null;
  accountMode: AccountMode;
  contributionData: ContributionSummary;
  contributionScore: number;
  onOpenPanel: (panel: PanelKey) => void;
}

/** Fixed heatmap block height: 7×12px cells + 6×4px gaps */
const CONTRIBUTION_GRID_MIN_HEIGHT_CLASS = "min-h-[6.75rem]";

const contributionStats = [
  { label: "活跃天数", icon: "calendar-alt", key: "active_days" as const, suffix: " 天" },
  { label: "连续活跃", icon: "history", key: "current_streak" as const, suffix: " 天" },
  { label: "最高单日", icon: "chart-line", key: "max_day_score" as const, suffix: " 分" },
];

function getContributionClassName(cell: ContributionCell) {
  if (cell.is_future) {
    return "bg-slate-50";
  }

  if (cell.level === 0) {
    return "bg-slate-100";
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

export default function MeOverview({
  profile,
  accountMode,
  contributionData,
  contributionScore,
  onOpenPanel,
}: MeOverviewProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const baseSettingsActions: Array<{
    key: PanelKey;
    title: string;
    mobileTitle?: string;
    icon: string;
    desc: ReactNode;
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
      title: "绑定邮箱",
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
      mobileTitle: "绑定账号",
      icon: "github-alt",
      desc:
        accountMode === "oauth_pending_email"
          ? "继续补绑其他方式"
          : (
              <>
                <span className="sm:hidden">绑定QQ等</span>
                <span className="hidden sm:inline">绑定QQ / GitHub / Google</span>
              </>
            ),
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
      key: "correction" as PanelKey,
      title: "信息纠错",
      icon: "edit-alt",
      desc: "提交课程或教师纠错",
    },
  ];
  const isVerified = accountMode === "verified";
  const hasContributionWeeks = contributionData.weeks.length > 0;
  const settingsActions = baseSettingsActions.filter((item) => {
    if (item.key === "password") {
      return isVerified;
    }
    if (item.key === "email") {
      return !isVerified;
    }
    return true;
  });

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h3 className={ME_SECTION_TITLE}>CSU Star 贡献图</h3>
        <div className={ME_PANEL_PAD}>
          <div className="mb-4 flex min-h-[4.5rem] flex-col gap-3 sm:min-h-[3.25rem] lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500">社区贡献概览</p>
              <h4 className="mt-1 min-h-[1.75rem] text-lg font-semibold text-slate-900 sm:text-xl">
                {accountMode === "guest"
                  ? "登录后开始累计你的社区贡献"
                  : (
                    <>
                      累计{" "}
                      <span className="inline-block min-w-[2.5ch] tabular-nums text-emerald-500">
                        {formatNumber(contributionScore)}
                      </span>{" "}
                      分贡献
                    </>
                  )}
              </h4>
              <div className="mt-2 flex justify-end sm:hidden">
                <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 whitespace-nowrap text-[10px] text-slate-500">
                  {contributionStats.map((item) => (
                    <ContributionStatItem
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      value={`${formatNumber(contributionData[item.key])}${item.suffix}`}
                      mobile
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden min-h-[1.5rem] flex-wrap items-center justify-end gap-3 text-sm text-slate-600 sm:flex">
              {contributionStats.map((item) => (
                <ContributionStatItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  value={`${formatNumber(contributionData[item.key])}${item.suffix}`}
                />
              ))}
            </div>
          </div>

          <AdaptiveContributionHeatmap
            sourceWeeks={contributionData.weeks}
            isSkeleton={!hasContributionWeeks}
            className={CONTRIBUTION_GRID_MIN_HEIGHT_CLASS}
          />

          <div className="mt-4 flex min-h-[1.25rem] flex-col gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => onOpenPanel("contribution")}
              className="text-left transition-colors hover:text-first"
            >
              了解我们如何计算贡献度
            </button>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <div className="h-3 w-3 rounded-[2px] bg-slate-100" />
              <div className="h-3 w-3 rounded-[2px] bg-green-100" />
              <div className="h-3 w-3 rounded-[2px] bg-green-200" />
              <div className="h-3 w-3 rounded-[2px] bg-green-400" />
              <div className="h-3 w-3 rounded-[2px] bg-green-600" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className={ME_SECTION_TITLE}>更多设置</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
          {settingsActions.map((item) => (
            <SettingsActionCard
              key={item.key}
              title={item.title}
              mobileTitle={item.mobileTitle}
              icon={item.icon}
              description={item.desc}
              badge={item.badge}
              onClick={() => onOpenPanel(item.key)}
            />
          ))}
          <SettingsActionCard
            title="赞助我们"
            icon="heart-alt"
            description="支持 CSU Star 持续更新"
            href="https://www.ifdian.net/a/csustar"
            external
          />
          {accountMode !== "guest" ? (
            <div className="col-end-[-1] flex items-end justify-end self-end">
              <Button theme="danger" variant="outline" onClick={handleLogout}>
                <i className="uil uil-signout mr-1.5 text-base" />
                退出登录
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Measure panel width and show as many trailing weeks as fit (mobile + desktop),
 * capped at one year ({@link CONTRIBUTION_WEEKS}).
 */
function AdaptiveContributionHeatmap({
  sourceWeeks,
  isSkeleton,
  className,
}: {
  sourceWeeks: ContributionCell[][];
  isSkeleton: boolean;
  className: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [weekCount, setWeekCount] = useState(CONTRIBUTION_WEEKS);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const next = fitContributionWeekCount(el.clientWidth, CONTRIBUTION_WEEKS);
      setWeekCount((prev) => (prev === next ? prev : next));
    };

    measure();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const weeks = useMemo(() => {
    if (isSkeleton || sourceWeeks.length === 0) {
      return createSkeletonContributionWeeks(weekCount);
    }
    return sourceWeeks.slice(-weekCount);
  }, [isSkeleton, sourceWeeks, weekCount]);

  return (
    <div ref={containerRef} className="w-full min-w-0">
      <ContributionHeatmap
        weeks={weeks}
        isSkeleton={isSkeleton || sourceWeeks.length === 0}
        className={className}
        weekKeyPrefix="week"
      />
    </div>
  );
}

function ContributionHeatmap({
  weeks,
  isSkeleton,
  className,
  weekKeyPrefix,
}: {
  weeks: ContributionCell[][];
  isSkeleton: boolean;
  className: string;
  weekKeyPrefix: string;
}) {
  return (
    <div
      className={`flex gap-4 overflow-hidden ${className}`}
      aria-busy={isSkeleton || undefined}
      aria-label={isSkeleton ? "贡献图加载中" : "贡献热力图"}
    >
      <div className="flex shrink-0 flex-col justify-around py-[2px] text-xs text-slate-400">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="h-3 leading-3">
            {label}
          </span>
        ))}
      </div>
      <div className={`flex min-w-0 gap-1 ${isSkeleton ? "animate-pulse" : ""}`}>
        {weeks.map((week, weekIndex) => (
          <div
            key={`${weekKeyPrefix}-${weekIndex}`}
            className="flex flex-col gap-1"
          >
            {week.map((cell) => (
              <div
                key={cell.date}
                className={`h-3 w-3 rounded-[2px] ${
                  isSkeleton
                    ? "bg-slate-100/90"
                    : getContributionClassName(cell)
                }`}
                title={
                  isSkeleton
                    ? undefined
                    : `${formatDate(cell.date)}${
                        cell.is_future
                          ? "\n未来日期"
                          : cell.score > 0
                            ? `\n${cell.score} 分贡献\n${cell.actions
                                .map((item) => `• ${item.label} +${item.score}`)
                                .join("\n")}`
                            : "\n暂无贡献"
                      }`
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsActionCard({
  title,
  mobileTitle,
  icon,
  description,
  badge,
  onClick,
  href,
  external = false,
}: {
  title: string;
  mobileTitle?: string;
  icon: string;
  description: ReactNode;
  badge?: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="group relative h-full">
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="absolute inset-0 z-10 cursor-pointer rounded-lg"
          aria-label={title}
        />
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="absolute inset-0 z-10 cursor-pointer rounded-lg"
          aria-label={title}
        />
      )}
      <div className={ME_SETTINGS_TILE}>
        <div className={ME_ICON_WELL}>
          <i className={`uil uil-${icon}`} />
        </div>
        <div className="flex min-w-0 flex-1 items-center sm:block">
          <div className="flex w-full items-center gap-1.5 sm:gap-2">
            <h4 className="text-sm font-medium text-slate-900 sm:hidden">
              {mobileTitle ?? title}
            </h4>
            <h4 className="hidden text-sm font-medium text-slate-900 sm:block">
              {title}
            </h4>
            {badge ? (
              <span className="rounded bg-first/10 px-1.5 py-0.5 text-[11px] text-first">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 hidden break-words text-xs leading-5 text-slate-500 sm:block">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ContributionStatItem({
  icon,
  label,
  value,
  mobile = false,
}: {
  icon: string;
  label: string;
  value: string;
  mobile?: boolean;
}) {
  return (
    <div
      className={
        mobile
          ? "inline-flex min-w-0 items-center gap-1 whitespace-nowrap leading-none text-slate-500"
          : "inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600"
      }
    >
      <i
        className={`uil uil-${icon} shrink-0 ${
          mobile ? "text-[12px] text-slate-400" : "text-[15px] text-slate-400"
        }`}
      />
      <span className={mobile ? "text-[9px] text-slate-400" : "text-xs text-slate-400"}>
        {label}
      </span>
      <span
        className={
          mobile
            ? "min-w-[2ch] tabular-nums text-[10px] font-medium text-slate-800"
            : "min-w-[2ch] tabular-nums font-medium text-slate-800"
        }
      >
        {value}
      </span>
    </div>
  );
}
