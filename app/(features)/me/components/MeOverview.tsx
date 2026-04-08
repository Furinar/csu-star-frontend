"use client";

import GlassCard from "@/components/ui/GlassCard";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserProfile } from "@/types/auth";
import type { ContributionCell, ContributionSummary } from "@/types/me";
import {
  type AccountMode,
  formatDate,
  formatNumber,
  WEEKDAY_LABELS,
} from "./shared/helpers";

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
  | "correction"
  | "contribution";

interface MeOverviewProps {
  profile: UserProfile | null;
  accountMode: AccountMode;
  contributionData: ContributionSummary;
  onOpenPanel: (panel: PanelKey) => void;
}

const MOBILE_CONTRIBUTION_WEEKS = 15;
const contributionStats = [
  { label: "活跃天数", icon: "calendar-alt", key: "active_days" as const, suffix: " 天" },
  { label: "连续活跃", icon: "history", key: "current_streak" as const, suffix: " 天" },
  { label: "最高单日", icon: "chart-line", key: "max_day_score" as const, suffix: " 分" },
];

function getContributionClassName(cell: ContributionCell) {
  if (cell.is_future) {
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

export default function MeOverview({
  profile,
  accountMode,
  contributionData,
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
  const mobileContributionWeeks = contributionData.weeks.slice(
    -MOBILE_CONTRIBUTION_WEEKS,
  );
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
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 ml-5 text-md font-normal text-gray-800">
          CSU Star贡献图
        </h3>
        <GlassCard className="p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">社区贡献概览</p>
              <h4 className="mt-1 text-xl font-semibold text-gray-900">
                {accountMode === "guest"
                  ? "登录后开始累计你的社区贡献"
                  : (
                    <>
                      累计{" "}
                      <span className="text-emerald-400">
                        {formatNumber(contributionData.total_score)}
                      </span>{" "}
                      分贡献
                    </>
                  )}
              </h4>
              <div className="mt-2 flex justify-end sm:hidden">
                <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 whitespace-nowrap text-[10px] text-gray-500">
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
            <div className="hidden flex-wrap items-center justify-end gap-3 text-sm text-gray-600 sm:flex">
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

          <div className="flex gap-4 overflow-x-auto hide-scrollbar sm:hidden">
            <div className="flex flex-col justify-around py-[2px] text-xs text-gray-400">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="h-3 leading-3">
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {mobileContributionWeeks.map((week, weekIndex) => (
                <div key={`mobile-week-${weekIndex}`} className="flex flex-col gap-1">
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      className={`h-3 w-3 rounded-[2px] ${getContributionClassName(
                        cell,
                      )}`}
                      title={`${formatDate(cell.date)}${
                        cell.is_future
                          ? "\n未来日期"
                          : cell.score > 0
                            ? `\n${cell.score} 分贡献\n${cell.actions
                                .map((item) => `• ${item.label} +${item.score}`)
                                .join("\n")}`
                            : "\n暂无贡献"
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden gap-4 overflow-x-auto hide-scrollbar sm:flex">
            <div className="flex flex-col justify-around py-[2px] text-xs text-gray-400">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="h-3 leading-3">
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {contributionData.weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                  {week.map((cell) => (
                    <div
                      key={cell.date}
                      className={`h-3 w-3 rounded-[2px] ${getContributionClassName(
                        cell,
                      )}`}
                      title={`${formatDate(cell.date)}${
                        cell.is_future
                          ? "\n未来日期"
                          : cell.score > 0
                            ? `\n${cell.score} 分贡献\n${cell.actions
                                .map((item) => `• ${item.label} +${item.score}`)
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
              onClick={() => onOpenPanel("contribution")}
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
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
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
        </div>
        {accountMode !== "guest" ? (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-rose-50"
            >
              <i className="uil uil-signout text-base" />
              退出登录
            </button>
          </div>
        ) : null}
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
          className="absolute inset-0 z-10 rounded-xl sm:rounded-2xl"
          aria-label={title}
        />
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="absolute inset-0 z-10 rounded-xl sm:rounded-2xl"
          aria-label={title}
        />
      )}
      <GlassCard className="flex min-h-[58px] items-center gap-1.5 rounded-xl p-2 transition-colors group-hover:bg-white/60 sm:min-h-[88px] sm:items-start sm:gap-3 sm:rounded-2xl sm:p-3.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/50 text-sm shadow-inner transition-transform group-hover:scale-110 sm:mt-0.5 sm:h-9 sm:w-9 sm:text-lg">
          <i className={`uil uil-${icon}`} />
        </div>
        <div className="flex min-w-0 flex-1 items-center sm:block">
          <div className="flex w-full items-center gap-1.5 sm:gap-2">
            <h4 className="font-medium text-sm text-gray-900 sm:hidden">
              {mobileTitle ?? title}
            </h4>
            <h4 className="hidden font-medium text-gray-900 sm:block">{title}</h4>
            {badge ? (
              <span className="rounded-full bg-first/10 px-2 py-0.5 text-[11px] text-first">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 hidden break-words text-xs leading-5 text-gray-500 sm:block">
            {description}
          </p>
        </div>
      </GlassCard>
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
          ? "inline-flex min-w-0 items-center gap-1 whitespace-nowrap leading-none text-gray-500"
          : "inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-gray-600"
      }
    >
      <i
        className={`uil uil-${icon} shrink-0 ${
          mobile ? "text-[12px] text-gray-400" : "text-[15px] text-gray-400"
        }`}
      />
      <span className={mobile ? "text-[9px] text-gray-400" : "text-xs text-gray-400"}>
        {label}
      </span>
      <span className={mobile ? "text-[10px] font-medium text-gray-800" : "font-medium text-gray-800"}>
        {value}
      </span>
    </div>
  );
}
