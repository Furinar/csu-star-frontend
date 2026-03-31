"use client";

import GlassCard from "@/components/ui/GlassCard";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserProfile } from "@/types/auth";
import {
  type AccountMode,
  type ContributionCell,
  type ContributionSummary,
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
  | "report"
  | "contribution";

interface MeOverviewProps {
  profile: UserProfile | null;
  accountMode: AccountMode;
  contributionData: ContributionSummary;
  onOpenPanel: (panel: PanelKey) => void;
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

export default function MeOverview({
  profile,
  accountMode,
  contributionData,
  onOpenPanel,
}: MeOverviewProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
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
            <div>
              <p className="text-sm text-gray-500">最近 26 周社区贡献</p>
              <h4 className="mt-1 text-xl font-semibold text-gray-900">
                {accountMode === "guest"
                  ? "登录后开始累计你的社区贡献"
                  : `累计 ${formatNumber(contributionData.totalScore)} 分贡献`}
              </h4>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <StatPill
                label="活跃天数"
                value={`${formatNumber(contributionData.activeDays)} 天`}
              />
              <StatPill
                label="连续活跃"
                value={`${formatNumber(contributionData.currentStreak)} 天`}
              />
              <StatPill
                label="最高单日"
                value={`${formatNumber(contributionData.maxDayScore)} 分`}
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
              {contributionData.weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {settingsActions.map((item) => (
            <SettingsActionCard
              key={item.key}
              title={item.title}
              icon={item.icon}
              description={item.desc}
              badge={item.badge}
              onClick={() => onOpenPanel(item.key)}
            />
          ))}
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
      <GlassCard className="flex min-h-[88px] items-start gap-3 p-3.5 transition-colors group-hover:bg-white/60">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/50 text-lg shadow-inner transition-transform group-hover:scale-110">
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
          <p className="mt-1 break-words text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </GlassCard>
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
