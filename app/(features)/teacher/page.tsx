import { AnimatedTestimonial } from "@/components/ui/AnimatedTestimonial";
import SearchBar from "@/components/ui/SearchBar";

// SSG：纯静态页面，构建时生成
export const dynamic = "force-static";

export default function Teacher() {
  return (
    <>
      <div className="container flex flex-col gap-10 mt-10">
        <div>
          <SearchBar placeholder="搜索教师" />
        </div>

        <div>
          <AnimatedTestimonial />
        </div>

        <div className="rankBox border-red-500 border bg-amber-100 flex flex-col justify-between gap-10">
          <div className="flex justify-center border border-blue-500">
            <h1 className="font-bold text-lg">教师排行榜</h1>
          </div>

          <div className="flex gap-2 justify-between">
            <div className="flex items-center grow justify-center bg-white border border-gray-300 h-150">
              1
            </div>
            <div className="flex items-center grow justify-center bg-white border border-gray-300 h-150">
              2
            </div>
            <div className="flex items-center grow justify-center bg-white border border-gray-300 h-150">
              3
            </div>
            <div className="flex items-center grow justify-center bg-white border border-gray-300 h-150">
              4
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
