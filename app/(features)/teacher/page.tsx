"use client";
import SearchBar from "@/components/ui/SearchBar";
import TeacherSlider from "./components/TeacherSlider";
import RankCard from "../../../components/ui/RankCard";
import { useRouter } from "next/navigation";

// 模拟数据
const mockRankData = [
  { id: "1", name: "李晨瑞", score: 9.8 },
  { id: "2", name: "陈一鑫", score: 9.5 },
  { id: "3", name: "张晨", score: 9.2 },
  { id: "4", name: "LCR", score: 8.9 },
  { id: "5", name: "CYX", score: 8.7 },
];

export default function Teacher() {
  const router = useRouter();

  return (
    <>
      <div className="container flex flex-col gap-10 mt-10 mb-20">
        <div>
          <SearchBar
            placeholder="搜索教师..."
            onSearch={(value) => {
              const keyword = value.trim();
              if (!keyword) return;
              router.push(`/search?type=teacher&q=${encodeURIComponent(keyword)}`);
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
              data={mockRankData.map((d) => ({ ...d, score: d.score - 0.1 }))}
            />
            <RankCard
              title="给分优异榜"
              data={mockRankData.map((d) => ({ ...d, score: d.score + 0.1 }))}
            />
            <RankCard
              title="考勤宽松榜"
              data={mockRankData.map((d) => ({ ...d, score: d.score - 0.2 }))}
            />
          </div>
        </div>
      </div>
    </>
  );
}
