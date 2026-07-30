"use client";

import type { ReactNode } from "react";
import { Avatar, Button, Tag } from "tdesign-react";
import type { UserProfile } from "@/types/auth";
import type { Department, EmailStatus } from "@/types/me";
import type { AccountMode } from "./shared/helpers";
import { formatNumber, getDepartmentName } from "./shared/helpers";
import { ME_PANEL_PAD } from "./shared/styles";

export interface MeSidebarProps {
  profile: UserProfile | null;
  emailStatus: EmailStatus;
  departments: Department[];
  accountMode: AccountMode;
  accountPresentation: {
    badge: string;
    badgeClassName: string;
    subtitle: string;
    hint: string;
  };
  profileAvatarSrc: string;
  isCheckingIn: boolean;
  hasCheckedInToday: boolean;
  onOpenProfile: () => void;
  onCheckin: () => void;
  onRequireGuest: () => void;
}

function accountTagTheme(
  mode: AccountMode,
): "success" | "warning" | "default" {
  if (mode === "verified") return "success";
  if (mode === "oauth_pending_email") return "warning";
  return "default";
}

function MetaRow({
  iconPath,
  children,
  className = "",
}: {
  iconPath: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-sm text-slate-600 ${className}`}>
      <svg
        className="h-4 w-4 shrink-0 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={iconPath}
        />
      </svg>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

const ICON = {
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  building:
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  user: "M12 8c-3.866 0-7 2.239-7 5v3h14v-3c0-2.761-3.134-5-7-5zm0 0a4 4 0 100-8 4 4 0 000 8z",
};

export default function MeSidebar({
  profile,
  emailStatus,
  departments,
  accountMode,
  accountPresentation,
  profileAvatarSrc,
  isCheckingIn,
  hasCheckedInToday,
  onOpenProfile,
  onCheckin,
  onRequireGuest,
}: MeSidebarProps) {
  const checkinOrGuest =
    accountMode === "guest" ? onRequireGuest : onCheckin;
  const checkinDisabled = isCheckingIn || hasCheckedInToday;
  const checkinLabel =
    accountMode === "guest"
      ? "立即登录"
      : hasCheckedInToday
        ? "今日已签到"
        : isCheckingIn
          ? "签到中..."
          : "每日签到";
  const checkinLabelMobile =
    accountMode === "guest"
      ? "立即登录"
      : hasCheckedInToday
        ? "已签到"
        : isCheckingIn
          ? "签到中"
          : "签到";

  return (
    // Desktop: column is fixed height with the page shell; only main scrolls.
    // Sidebar itself stays put; overflow-y only if profile content is taller than viewport.
    <aside className="w-full flex-shrink-0 md:w-1/3 md:overflow-y-auto md:self-stretch lg:w-1/4">
      <div className="space-y-4 md:space-y-5">
        <div className={`${ME_PANEL_PAD} flex flex-col`}>
          <div className="flex w-full items-center gap-3 md:flex-col md:items-start">
            <button
              type="button"
              onClick={onOpenProfile}
              className="group relative shrink-0 cursor-pointer rounded-full text-left"
              aria-label={
                accountMode === "guest"
                  ? "登录后编辑个人资料"
                  : "打开编辑个人资料面板"
              }
            >
              <span className="block md:hidden">
                <Avatar
                  image={profileAvatarSrc}
                  alt={profile?.nickname ?? "用户头像"}
                  size="104px"
                />
              </span>
              <span className="hidden md:block">
                <Avatar
                  image={profileAvatarSrc}
                  alt={profile?.nickname ?? "用户头像"}
                  size="148px"
                />
              </span>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="px-2 text-center text-xs text-white sm:text-sm">
                  {accountMode === "guest" ? "登录后编辑资料" : "点击编辑资料"}
                </span>
              </div>
            </button>

            <div className="min-w-0 flex-1 space-y-1.5 text-right md:mt-3 md:w-full md:text-left">
              <Tag
                theme={accountTagTheme(accountMode)}
                variant="light"
                size="small"
              >
                {accountPresentation.badge}
              </Tag>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
                  {profile?.nickname ?? "游客"}
                </h1>
                <p className="text-sm text-slate-500 md:text-base">
                  {accountPresentation.subtitle}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 hidden text-sm leading-relaxed text-slate-600 md:block">
            {accountPresentation.hint}
          </p>

          <Button
            block
            variant="outline"
            theme="default"
            className="mt-3 md:mt-4"
            onClick={onOpenProfile}
          >
            {accountMode === "guest" ? "登录后完善资料" : "编辑个人资料"}
          </Button>

          {/* Mobile: meta + points */}
          <div className="mt-4 border-t border-slate-100 pt-4 md:hidden">
            <MetaRow iconPath={ICON.mail} className="mb-3">
              {emailStatus.email ?? "尚未绑定邮箱"}
            </MetaRow>

            <div className="flex w-full items-stretch rounded-md border border-slate-100 bg-slate-50/50">
              <div className="min-w-0 basis-1/2 space-y-2 p-3">
                <MetaRow iconPath={ICON.building}>
                  {getDepartmentName(departments, profile?.department_id)}
                </MetaRow>
                <MetaRow iconPath={ICON.book}>
                  {profile?.grade ? `${profile.grade}级` : "年级未填写"}
                </MetaRow>
                <MetaRow iconPath={ICON.user}>
                  {accountMode === "guest"
                    ? "游客模式"
                    : accountMode === "verified"
                      ? "已认证"
                      : "待认证"}
                </MetaRow>
              </div>

              <div className="my-3 w-px shrink-0 self-stretch bg-slate-200" />

              <div className="flex basis-1/2 flex-col items-center justify-center gap-2 p-3 text-center">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  STAR
                </div>
                <div className="hero-gradient-text min-w-[3ch] text-2xl font-semibold tabular-nums">
                  {formatNumber(profile?.points)}
                </div>
                <Button
                  size="small"
                  theme="primary"
                  disabled={checkinDisabled}
                  onClick={checkinOrGuest}
                >
                  {checkinLabelMobile}
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop: meta list */}
          <div className="mt-4 hidden space-y-2.5 border-t border-slate-100 pt-4 md:block">
            <MetaRow iconPath={ICON.mail}>
              {emailStatus.email ?? "尚未绑定邮箱"}
            </MetaRow>
            <MetaRow iconPath={ICON.building}>
              {getDepartmentName(departments, profile?.department_id)}
            </MetaRow>
            <MetaRow iconPath={ICON.book}>
              {profile?.grade ? `${profile.grade}级` : "年级未填写"}
            </MetaRow>
            <MetaRow iconPath={ICON.user}>
              {accountMode === "guest"
                ? "登录后可查看完整账号能力"
                : accountMode === "verified"
                  ? "校园认证身份已生效"
                  : "第三方登录，可继续完成邮箱认证"}
            </MetaRow>
          </div>
        </div>

        {/* Desktop: points + checkin as separate outlined panel */}
        <div className={`${ME_PANEL_PAD} hidden md:block`}>
          <div className="mb-3 text-sm font-medium text-slate-800">STAR 积分</div>
          <div className="flex items-center justify-between gap-3">
            <span className="hero-gradient-text min-w-[3ch] text-2xl font-semibold tabular-nums md:text-3xl">
              {formatNumber(profile?.points)}
            </span>
            <Button
              theme="primary"
              disabled={checkinDisabled}
              onClick={checkinOrGuest}
            >
              {checkinLabel}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
