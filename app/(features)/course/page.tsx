"use client";
import { useEffect, useState } from "react";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import SearchLandingSection from "@/app/(features)/search/components/SearchLandingSection";
import SearchBar from "@/components/ui/SearchBar";
import RankCard from "@/components/ui/RankCard";
import RandomBook from "@/app/(features)/course/components/RandomBook";
import { buildCoursePath } from "@/lib/paths";
import { useRouter } from "next/navigation";
import { getCourseRankings } from "@/api/ranking";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import CourseGlobalEvaluationModal from "./components/CourseGlobalEvaluationModal";

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

export default function Course() {
  const router = useRouter();
  const [homeworkRanks, setHomeworkRanks] = useState<RankCardItem[]>([]);
  const [gainRanks, setGainRanks] = useState<RankCardItem[]>([]);
  const [examRanks, setExamRanks] = useState<RankCardItem[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      getCourseRankings({
        rank_type: "avg_homework",
        page: 1,
        size: PAGE_SIZE,
        is_increased: false,
      }),
      getCourseRankings({
        rank_type: "avg_gain",
        page: 1,
        size: PAGE_SIZE,
        is_increased: false,
      }),
      getCourseRankings({
        rank_type: "avg_exam_diff",
        page: 1,
        size: PAGE_SIZE,
        is_increased: false,
      }),
    ])
      .then(([homework, gain, exam]) => {
        if (!active) return;
        setHomeworkRanks(mapRankItems(homework.items));
        setGainRanks(mapRankItems(gain.items));
        setExamRanks(mapRankItems(exam.items));
      })
      .catch((error) => {
        console.error(error);
        if (!active) return;
        setHomeworkRanks([]);
        setGainRanks([]);
        setExamRanks([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className="container flex flex-col gap-10 mt-10 mb-20 over">
        <div>
          <SearchBar
            placeholder="搜索课程..."
            onSearch={(value) => {
              const searchHref = buildSearchPageHref(value, "course");

              if (!searchHref) return;

              router.push(searchHref);
            }}
          />
        </div>

        <RandomBook />

        <div className="flex flex-col gap-6 w-full mt-8 relative z-10 bg-gray-100 rounded-[40px] pb-10 px-10 pt-7">
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob -z-10"></div>
          <div className="absolute bottom-0 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 -z-10"></div>
          <div className="absolute top-16 left-2/5 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 -z-10"></div>

          <div className="flex items-center justify-between mb-2 mt-4">
            <div className="head flex w-full">
              <h2 className="text-3xl font-extrabold text-transparent pl-5 flex-1">
                课程综合评价榜单
              </h2>

              <span className="mr-7 cursor-pointer">查看全部排行榜</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <RankCard
              title="任务轻松榜"
              data={homeworkRanks}
              onItemClick={(item) =>
                router.push(buildCoursePath(Number(item.id)))
              }
            />
            <RankCard
              title="课堂收获榜"
              data={gainRanks}
              onItemClick={(item) =>
                router.push(buildCoursePath(Number(item.id)))
              }
            />
            <RankCard
              title="考试难度榜"
              data={examRanks}
              onItemClick={(item) =>
                router.push(buildCoursePath(Number(item.id)))
              }
            />
          </div>
        </div>

        <SearchLandingSection
          type="course"
          title="课程列表"
          description="页面底部直接展示课程搜索结果，来自搜索接口的空关键词请求。"
        />
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-[100] overflow-hidden">
        <div className="absolute bottom-8 right-8 pointer-events-auto">
          <DetailFloatingActionButton
            label="写评价"
            tone="course"
            onClick={() => setIsComposerOpen(true)}
          />
        </div>
      </div>

      <CourseGlobalEvaluationModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
      />
    </>
  );
}
