"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FloatingLoadingPill,
  InlineErrorBar,
} from "@/components/ui/AsyncState";
import MeEvaluations from "./components/MeEvaluations";
import MeFavorites from "./components/MeFavorites";
import MeNotifications from "./components/MeNotifications";
import MeOverview from "./components/MeOverview";
import MePanels from "./components/MePanels";
import MeResources from "./components/MeResources";
import MeSidebar from "./components/MeSidebar";
import MeTabBar from "./components/MeTabBar";
import {
  GuestTabState,
  InlineRetryState,
  SectionLoadingState,
} from "./components/SectionStates";
import { parseMeTabParam } from "./components/shared/helpers";
import type { PanelKey, TabKey } from "./components/shared/types";
import { useMeDashboard } from "./hooks/useMeDashboard";

export default function Me() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  const me = useMeDashboard({ activeTab, setOpenPanel });

  useEffect(() => {
    const nextTab = parseMeTabParam(searchParams.get("tab"));
    if (nextTab) {
      setActiveTab(nextTab);
    }
  }, [searchParams]);

  // Desktop: fill viewport below sticky nav; only the main column scrolls.
  // Nav height matches BaseNav: calc(var(--header-height) + 1.5rem).
  return (
    <div className="px-3 py-6 sm:px-6 md:box-border md:h-[calc(100dvh-(var(--header-height)+1.5rem))] md:overflow-hidden md:py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 md:h-full md:flex-row md:items-stretch md:gap-8">
        <MeSidebar
          profile={me.profile}
          emailStatus={me.emailStatus}
          departments={me.departments}
          accountMode={me.accountMode}
          accountPresentation={me.accountPresentation}
          profileAvatarSrc={me.profileAvatarSrc}
          isCheckingIn={me.isCheckingIn}
          hasCheckedInToday={me.hasCheckedInToday}
          onOpenProfile={() => me.openProtectedPanel("profile")}
          onCheckin={() => void me.handleCheckin()}
          onRequireGuest={() => setOpenPanel("guest")}
        />

        <main className="w-full min-w-0 flex-1 md:min-h-0 md:overflow-y-auto md:pb-2 scrollbar-hide">
          <MeTabBar
            activeTab={activeTab}
            unreadCount={me.unreadCount}
            resourcesTotal={me.resources.total}
            favoritesTotal={me.favorites.total}
            evaluationsTotal={me.courseEvaluations.total}
            onTabChange={setActiveTab}
          />

          {me.loadError ? (
            <div className="mb-4 md:mb-6">
              <InlineErrorBar
                message={me.loadError}
                onRetry={() => void me.loadDashboard(true)}
                retryText="重新加载"
              />
            </div>
          ) : null}

          {activeTab === "overview" ? (
            <MeOverview
              profile={me.profile}
              accountMode={me.accountMode}
              contributionData={me.contributionSummary}
              contributionScore={me.contributionScore}
              onOpenPanel={me.openProtectedPanel}
            />
          ) : null}

          {activeTab === "resources" ? (
            me.profile ? (
              me.isLoadingResources ? (
                <SectionLoadingState label="资源列表加载中..." />
              ) : me.resourcesError ? (
                <InlineRetryState
                  message={me.resourcesError}
                  onRetry={() => {
                    me.setResourcesLoaded(false);
                    void me.loadResources();
                  }}
                />
              ) : (
                <MeResources resources={me.resources} />
              )
            ) : (
              <GuestTabState />
            )
          ) : null}

          {activeTab === "favorites" ? (
            me.profile ? (
              me.isLoadingFavorites ? (
                <SectionLoadingState label="收藏列表加载中..." />
              ) : me.favoritesError ? (
                <InlineRetryState
                  message={me.favoritesError}
                  onRetry={() => {
                    me.setFavoritesLoaded(false);
                    void me.loadFavorites();
                  }}
                />
              ) : (
                <MeFavorites favorites={me.favorites} />
              )
            ) : (
              <GuestTabState />
            )
          ) : null}

          {activeTab === "evaluations" ? (
            me.profile ? (
              me.isLoadingEvaluations ? (
                <SectionLoadingState label="评价列表加载中..." />
              ) : me.evaluationsError ? (
                <InlineRetryState
                  message={me.evaluationsError}
                  onRetry={() => {
                    me.setEvaluationsLoaded(false);
                    void me.loadEvaluations();
                  }}
                />
              ) : (
                <MeEvaluations courseEvaluations={me.courseEvaluations} />
              )
            ) : (
              <GuestTabState />
            )
          ) : null}

          {activeTab === "notifications" ? (
            me.profile ? (
              <MeNotifications
                onUnreadCountChange={me.handleNotificationUnreadChange}
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

      <MePanels
        openPanel={openPanel}
        profile={me.profile}
        emailStatus={me.emailStatus}
        departments={me.departments}
        accountMode={me.accountMode}
        isVerifiedCampusEmail={me.isVerifiedCampusEmail}
        points={me.points.items}
        downloads={me.downloads.items}
        inviteCode={me.inviteCode}
        isLoadingInvite={me.isLoadingInvite}
        isLoadingDownloads={me.isLoadingDownloads}
        onClose={() => setOpenPanel(null)}
        onProfileUpdated={me.handleProfileUpdated}
        onEmailVerified={me.handleEmailVerified}
        onCopyInviteCode={() => void me.handleCopyInviteCode()}
      />

      {me.showDashboardLoadingPill ? (
        <FloatingLoadingPill
          text="个人中心数据加载中..."
          delayMs={320}
        />
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
