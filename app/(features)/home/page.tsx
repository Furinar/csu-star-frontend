"use client";

import SearchBar from "@/components/ui/SearchBar";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import { useRouter } from "next/navigation";

// SSG：纯静态页面，构建时生成
export const dynamic = "force-static";

export default function Home() {
  const router = useRouter();

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
                    <br/>
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


        </div>
      </>
  );
}
