import SearchBar from "@/components/ui/SearchBar";

// SSG：纯静态页面，构建时生成
export const dynamic = "force-static";

export default function Home() {
  return (
    <>
      <div className="container flex flex-col gap-10 mt-10">
        <div className="title flex flex-col justify-center items-center">
          <span className="hero-gradient-text text-[70px] font-bold ">
            CSUSTAR.wiki
          </span>
          <span className="subtitle  text-center">
            <span className="font-bold text-[25px] text-gray-600">
              让中南大学再次伟大
            </span>
            <br />
            <span className="text-gray-500">Make CSU Great Again</span>
          </span>
        </div>

        <div>
          <SearchBar placeholder="搜索资源、课程或教师..." />
        </div>

        <div className="announcement">
          <h2 className="text-2xl font-bold mb-4">公告</h2>
        </div>

        <div className="survival-guide">
          <h2 className="text-2xl font-bold mb-4">中南大学生存指南</h2>
        </div>
      </div>
    </>
  );
}
