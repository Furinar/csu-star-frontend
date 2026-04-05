"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getHomeNotificationSummary } from "@/api/me";
import SearchBar from "@/components/ui/SearchBar";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";
import type { NotificationItem } from "@/types/me";

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

      feedback.info({
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
      } catch {}
    };

    void loadHomeNotifications();

    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, router]);

  return (
    <>
      <div className="container mt-10 flex flex-col gap-10">
        <div className="title flex flex-col items-center justify-center">
          <span className="hero-gradient-text text-[70px] font-bold ">
            CSUSTAR.wiki
          </span>
          <span className="subtitle  text-center">
            <span className="text-[25px] font-bold text-gray-600">
              让中南大学再次伟大
            </span>
            <br />
            <span className="text-gray-500">Make CSU Great Again</span>
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

        <div className="mt-10 flex items-center justify-center gap-2">
          <img src="/undraw_route-planning_2psv.svg" alt="" />
        </div>
      </div>
    </>
  );
}
