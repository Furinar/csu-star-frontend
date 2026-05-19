"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {getHomeNotificationSummary} from "@/api/me";
import SearchBar from "@/components/ui/SearchBar";
import {buildSearchPageHref} from "@/app/(features)/search/searchNavigation";
import {useAuthStore} from "@/store/useAuthStore";
import {feedback} from "@/store/useFeedbackStore";
import type {NotificationItem} from "@/types/me";

export const dynamic = "force-static";

export default function Home() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      return;
    }

    let cancelled = false;

    const openNotifications = () => {
      router.push("/me?tab=notifications");
    };

    const showToast = (item: NotificationItem) => {
      const isPersistent =
          item.type === "system" &&
          (item.category !== "announcement" || !item.is_pinned);
      const isApprovedModerationResult =
          item.type === "system" &&
          item.result === "approved" &&
          (item.category === "report" ||
              item.category === "correction" ||
              item.category === "feedback" ||
              item.category === "supplement");
      const isRejectedModerationResult =
          item.type === "system" &&
          item.result === "rejected" &&
          (item.category === "report" ||
              item.category === "correction" ||
              item.category === "feedback" ||
              item.category === "supplement");

      const showFeedbackToast = isRejectedModerationResult
          ? feedback.error
          : isApprovedModerationResult
              ? feedback.success
              : feedback.info;

      showFeedbackToast({
        title: item.title,
        description: item.content || "你有一条新的站内消息。",
        duration: isPersistent ? 0 : undefined,
        actionLabel: item.category === "announcement" ? "查看公告" : "查看通知",
        onAction: openNotifications,
      });
    };

    const loadHomeNotifications = async () => {
      try {
        const summary = await getHomeNotificationSummary();
        if (cancelled) {
          return;
        }

        [
          ...summary.announcements,
          ...summary.interactions,
          ...summary.system_messages,
        ].forEach(showToast);
      } catch {
      }
    };

    void loadHomeNotifications();

    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, router]);

  return (
      <>
        <div className="container mt-6 flex flex-col gap-6 md:mt-10 md:gap-10">
          <div className="title flex flex-col items-center justify-center gap-1.5 md:gap-2">
          <span className="hero-gradient-text text-[42px] font-bold leading-none sm:text-[54px] md:text-[70px]">
            CSUSTAR.wiki
          </span>
            <span className="subtitle text-center leading-tight">
            <span className="text-[18px] font-bold text-gray-600 sm:text-[21px] md:text-[25px]">
              让中南大学再次伟大
            </span>
            <br/>
            <span className="text-sm text-gray-500 sm:text-base md:text-lg">
              Make CSU Great Again
            </span>
          </span>
          </div>

          <div>
            <SearchBar
                placeholder="搜索资源、课程或教师..."
                onSearch={(value) => {
                  const searchHref = buildSearchPageHref(value, "all");

                  if (!searchHref) return;

                  router.push(searchHref);
                }}
            />
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 md:mt-10">
            <img
                src="/undraw_route-planning_2psv.svg"
                alt=""
                className="w-full max-w-[360px] sm:max-w-[440px] md:max-w-none"
            />
          </div>
        </div>

        <div className="w-full flex flex-col items-center justify-center gap-2 mt-20 md:mt-20">
        <span className="text-gray-500 text-sm">
          本站仅供学习 严禁商业行为
        </span>
        </div>
      </>
  );
}
