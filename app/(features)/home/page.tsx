"use client";

import {useRouter} from "next/navigation";
import SearchBar from "@/components/ui/SearchBar";
import {buildSearchPageHref} from "@/app/(features)/search/searchNavigation";

export const dynamic = "force-static";

export default function Home() {
  const router = useRouter();

  return (
      <>
        <div className="container mt-6 flex flex-col gap-6 md:mt-10 md:gap-10">
          <div className="title flex flex-col items-center justify-center gap-1.5 md:gap-2">
          <span className="hero-gradient-text text-[42px] font-bold leading-none sm:text-[54px] md:text-[70px]">
            CSUSTAR.com
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
        <span className="text-gray-500 text-sm text-center">
          著作权归中南小黑板所有
          <br/>
          本站仅供学习 严禁商业行为
        </span>
        </div>
      </>
  );
}
