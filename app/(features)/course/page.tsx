"use client";
import SearchBar from "@/components/ui/SearchBar";
import RankCard from "@/components/ui/RankCard";
import RandomBook from "@/app/(features)/course/components/RandomBook";
import { useRouter } from "next/navigation";

const mockRankData = [
    { id: "1", name: "原神", score: 9.8 },
    { id: "2", name: "绝区零", score: 9.5 },
    { id: "3", name: "崩坏", score: 9.2 },
    { id: "4", name: "星铁", score: 8.9 },
    { id: "5", name: "鸣潮", score: 8.7 },
];

export default function Course() {
  const router = useRouter();

  return (
      <>
          <div className="container flex flex-col gap-10 mt-10 mb-20">
              <div>
                  <SearchBar
                      placeholder="搜索课程..."
                      onSearch={(value) => {
                          const keyword = value.trim();
                          if (!keyword) return;
                          router.push(`/search?type=course&q=${encodeURIComponent(keyword)}`);
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
                          data={mockRankData.map((d) => ({ ...d, score: d.score - 0.1 }))}
                      />
                      <RankCard
                          title="课堂收获榜"
                          data={mockRankData.map((d) => ({ ...d, score: d.score + 0.1 }))}
                      />
                      <RankCard
                          title="考试难度榜"
                          data={mockRankData.map((d) => ({ ...d, score: d.score - 0.2 }))}
                      />
                  </div>
              </div>
          </div>
      </>
  );
}
