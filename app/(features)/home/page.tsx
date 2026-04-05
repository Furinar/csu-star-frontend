"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { listAnnouncements } from "@/api/misc";
import SearchBar from "@/components/ui/SearchBar";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import { feedback } from "@/store/useFeedbackStore";

const HOME_ANNOUNCEMENT_CHECK_DATE_KEY = "csustar:home-announcement-check-date";
const HOME_ANNOUNCEMENT_LATEST_ID_KEY = "csustar:home-announcement-latest-id";

export const dynamic = "force-static";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const checkedDate = window.localStorage.getItem(
      HOME_ANNOUNCEMENT_CHECK_DATE_KEY,
    );

    if (checkedDate === today) {
      return;
    }

    let cancelled = false;

    const checkAnnouncements = async () => {
      try {
        const announcements = await listAnnouncements();
        if (cancelled) {
          return;
        }

        const latestAnnouncement = announcements[0];
        const previousLatestId = Number(
          window.localStorage.getItem(HOME_ANNOUNCEMENT_LATEST_ID_KEY) ?? "",
        );

        if (
          latestAnnouncement &&
          Number.isFinite(previousLatestId) &&
          previousLatestId > 0 &&
          latestAnnouncement.id !== previousLatestId
        ) {
          feedback.info({
            title: latestAnnouncement.title,
            description: latestAnnouncement.content || "有新的平台公告。",
            duration: 0,
            actionLabel: "查看公告",
            onAction: () => {
              router.push("/me?tab=notifications");
            },
          });
        }

        if (latestAnnouncement) {
          window.localStorage.setItem(
            HOME_ANNOUNCEMENT_LATEST_ID_KEY,
            String(latestAnnouncement.id),
          );
        }
        window.localStorage.setItem(HOME_ANNOUNCEMENT_CHECK_DATE_KEY, today);
      } catch {
        window.localStorage.setItem(HOME_ANNOUNCEMENT_CHECK_DATE_KEY, today);
      }
    };

    void checkAnnouncements();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
