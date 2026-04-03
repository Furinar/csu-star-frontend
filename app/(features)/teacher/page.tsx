"use client";
import { useEffect, useState } from "react";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import SearchLandingSection from "@/app/(features)/search/components/SearchLandingSection";
import SearchBar from "@/components/ui/SearchBar";
import { buildTeacherPath } from "@/lib/paths";
import TeacherSlider from "./components/TeacherSlider";
import RankCard from "../../../components/ui/RankCard";
import { useRouter } from "next/navigation";
import { getTeacherRankings } from "@/api/ranking";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import TeacherGlobalEvaluationModal from "./components/TeacherGlobalEvaluationModal";

type RankCardItem = {
  id: string;
  name: string;
  score: number;
};

const PAGE_SIZE = 5;

const mapRankItems = (
  items: Array<{ id: number; name: string; score: number }>,
): RankCardItem[] =>
  items.slice(0, PAGE_SIZE).map((item) => ({
    id: String(item.id),
    name: item.name,
    score: item.score,
  }));

export default function Teacher() {
  const router = useRouter();
  const [qualityRanks, setQualityRanks] = useState<RankCardItem[]>([]);
  const [gradingRanks, setGradingRanks] = useState<RankCardItem[]>([]);
  const [attendanceRanks, setAttendanceRanks] = useState<RankCardItem[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  useEffect(() => {
    let active = true;

    Promise.all([
      getTeacherRankings({
        rank_type: "avg_quality",
        page: 1,
        size: PAGE_SIZE,
        is_increased: false,
      }),
      getTeacherRankings({
        rank_type: "avg_grading",
        page: 1,
        size: PAGE_SIZE,
        is_increased: false,
      }),
      getTeacherRankings({
        rank_type: "avg_attendance",
        page: 1,
        size: PAGE_SIZE,
        is_increased: false,
      }),
    ])
      .then(([quality, grading, attendance]) => {
        if (!active) return;
        setQualityRanks(mapRankItems(quality.items));
        setGradingRanks(mapRankItems(grading.items));
        setAttendanceRanks(mapRankItems(attendance.items));
      })
      .catch((error) => {
        console.error(error);
        if (!active) return;
        setQualityRanks([]);
        setGradingRanks([]);
        setAttendanceRanks([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className="container flex flex-col gap-10 mt-10 mb-20">
        <div>
          <SearchBar
            placeholder="搜索教师..."
            onSearch={(value) => {
              const searchHref = buildSearchPageHref(value, "teacher");

              if (!searchHref) return;

              router.push(searchHref);
            }}
          />
        </div>

        <TeacherSlider />

        <div className="flex flex-col gap-6 w-full mt-8 relative z-10 bg-gray-100 rounded-[40px] pb-10 px-10 pt-7">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob -z-10"></div>
          <div className="absolute top-0 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 -z-10"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 -z-10"></div>

          <div className="flex items-center justify-between mb-2 mt-4">
            <div className="head flex w-full">
              <h2 className="text-3xl font-extrabold text-transparent pl-5 flex-1">
                教师综合评价榜单
              </h2>

              <span className="mr-7 cursor-pointer">查看全部排行榜</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <RankCard
              title="教学质量排行榜"
              data={qualityRanks}
              onItemClick={(item) =>
                router.push(buildTeacherPath(Number(item.id)))
              }
            />
            <RankCard
              title="给分优异榜"
              data={gradingRanks}
              onItemClick={(item) =>
                router.push(buildTeacherPath(Number(item.id)))
              }
            />
            <RankCard
              title="考勤宽松榜"
              data={attendanceRanks}
              onItemClick={(item) =>
                router.push(buildTeacherPath(Number(item.id)))
              }
            />
          </div>
        </div>

        <SearchLandingSection
          type="teacher"
          title="教师列表"
          description="页面底部直接展示教师搜索结果，来自搜索接口的空关键词请求。"
        />
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-[100] overflow-hidden">
        <div className="absolute bottom-8 right-8 pointer-events-auto">
          <DetailFloatingActionButton
            label="写评价"
            tone="teacher"
            onClick={() => setIsComposerOpen(true)}
          />
        </div>
      </div>

      <TeacherGlobalEvaluationModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
      />
    </>
  );
}
