"use client";

import Link from "next/link";
import { PageEmpty, PageLoading } from "@/components/ui/AsyncState";
import type { UserProfile } from "@/types/auth";
import type {
  DownloadRecord,
  EmailStatus,
  InviteCodeInfo,
  MeDashboardData,
  PointsRecord,
} from "@/types/me";
import type { AccountMode } from "./shared/helpers";
import {
  PANEL_PRIMARY_BUTTON_CLASS_NAME,
  PANEL_SECONDARY_BUTTON_CLASS_NAME,
} from "./shared/helpers";
import type { PanelKey } from "./shared/types";
import FloatingPanel from "./FloatingPanel";
import ContributionPanel from "./panels/ContributionPanel";
import DownloadsPanel from "./panels/DownloadsPanel";
import EmailPanel from "./panels/EmailPanel";
import FeedbackPanel from "./panels/FeedbackPanel";
import OAuthPanel from "./panels/OAuthPanel";
import PasswordPanel from "./panels/PasswordPanel";
import PointsPanel from "./panels/PointsPanel";
import ProfilePanel from "./panels/ProfilePanel";

export interface MePanelsProps {
  openPanel: PanelKey | null;
  profile: UserProfile | null;
  emailStatus: EmailStatus;
  departments: MeDashboardData["departments"];
  accountMode: AccountMode;
  isVerifiedCampusEmail: boolean;
  points: PointsRecord[];
  downloads: DownloadRecord[];
  inviteCode: InviteCodeInfo | null;
  isLoadingInvite: boolean;
  isLoadingDownloads: boolean;
  onClose: () => void;
  onProfileUpdated: (
    nextProfile: UserProfile,
    updater: (current: MeDashboardData | null) => MeDashboardData | null,
  ) => void;
  onEmailVerified: (
    nextProfile: UserProfile,
    updater: (current: MeDashboardData | null) => MeDashboardData | null,
  ) => void;
  onCopyInviteCode: () => void;
}

export default function MePanels({
  openPanel,
  profile,
  emailStatus,
  departments,
  accountMode,
  isVerifiedCampusEmail,
  points,
  downloads,
  inviteCode,
  isLoadingInvite,
  isLoadingDownloads,
  onClose,
  onProfileUpdated,
  onEmailVerified,
  onCopyInviteCode,
}: MePanelsProps) {
  return (
    <>
      <FloatingPanel
        open={openPanel === "guest"}
        title="登录后可解锁完整个人中心"
        description="登录后即可继续使用资料编辑、校园认证、积分与通知等个人功能。"
        onClose={onClose}
      >
        <div className="space-y-4">
          <p className="td-me-hint">
            登录后即可管理个人信息、校园认证、积分与消息通知。
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/login" className={PANEL_PRIMARY_BUTTON_CLASS_NAME}>
              前往登录
            </Link>
            <Link
              href="/login?type=true"
              className={PANEL_SECONDARY_BUTTON_CLASS_NAME}
            >
              前往注册
            </Link>
          </div>
        </div>
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "profile"}
        title="编辑个人资料"
        description="修改你的昵称、学院和年级信息。"
        onClose={onClose}
      >
        {profile ? (
          <ProfilePanel
            profile={profile}
            departments={departments}
            onClose={onClose}
            onProfileUpdated={onProfileUpdated}
          />
        ) : null}
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "password" && isVerifiedCampusEmail}
        title="修改密码"
        description="通过邮箱验证码重置登录密码。"
        onClose={onClose}
      >
        <PasswordPanel
          initialEmail={emailStatus.email ?? profile?.email ?? ""}
          emailLocked={isVerifiedCampusEmail}
          onClose={onClose}
        />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "email" && !isVerifiedCampusEmail}
        title="绑定邮箱"
        description="绑定邮箱以获取在中南星的完整访问权限。"
        onClose={onClose}
      >
        {profile ? (
          <EmailPanel
            profile={profile}
            emailStatus={emailStatus}
            accountMode={accountMode}
            onClose={onClose}
            onEmailVerified={onEmailVerified}
          />
        ) : null}
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "oauth"}
        title="绑定第三方账号"
        description="绑定其他账号后可一键快捷登录。"
        onClose={onClose}
      >
        <OAuthPanel
          accountMode={accountMode}
          bindings={profile?.oauth_bindings ?? null}
          onClose={onClose}
        />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "points"}
        title="积分流水"
        description="资源上传、签到、邀请等行为产生的积分变化。"
        onClose={onClose}
      >
        <PointsPanel points={points} />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "invite"}
        title="分享邀请码"
        description="邀请好友加入中南星社区。"
        onClose={onClose}
      >
        {isLoadingInvite ? (
          <PageLoading
            text="邀请码加载中..."
            minHeight={false}
            className="min-h-[8rem] border-0 bg-transparent py-6 shadow-none"
          />
        ) : inviteCode ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">你的专属邀请码</p>
              <p className="mt-1 text-2xl font-semibold tracking-[0.12em] text-first">
                {inviteCode.invite_code}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                成功邀请 {inviteCode.used_count} 人
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onCopyInviteCode}
                className={PANEL_PRIMARY_BUTTON_CLASS_NAME}
              >
                复制邀请链接
              </button>
            </div>
          </div>
        ) : (
          <PageEmpty
            type="empty"
            title="暂无邀请码"
            description="请稍后再试。"
            className="min-h-[8rem] border-0 bg-transparent py-6 shadow-none"
            size="small"
          />
        )}
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "downloads"}
        title="下载记录"
        description="查看你曾下载过的资源。"
        onClose={onClose}
      >
        <DownloadsPanel
          downloads={downloads}
          isLoading={isLoadingDownloads}
        />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "feedback"}
        title="意见反馈"
        description="有建议或遇到问题，欢迎告诉我们。"
        onClose={onClose}
      >
        <FeedbackPanel mode="feedback" onClose={onClose} />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "correction"}
        title="信息纠错"
        description="课程或教师信息有误时，可在此提交更正建议。"
        onClose={onClose}
      >
        <FeedbackPanel mode="correction" onClose={onClose} />
      </FloatingPanel>

      <FloatingPanel
        open={openPanel === "contribution"}
        title="贡献度策略"
        description="了解社区活跃度与贡献如何计算。"
        onClose={onClose}
      >
        <ContributionPanel />
      </FloatingPanel>
    </>
  );
}
