"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/ui/SearchBar";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";

export const dynamic = "force-static";

const ENTRIES = [
  {
    href: "/resource",
    title: "学习资源",
    desc: "课件、笔记、试卷与实验资料，一站查找下载",
    icon: "uil-file-alt",
    tone: {
      well: "border-emerald-100 bg-emerald-50 text-emerald-600",
      hover: "hover:border-emerald-200 hover:bg-emerald-50/40",
      arrow: "text-emerald-500",
    },
  },
  {
    href: "/course",
    title: "课程评价",
    desc: "选课避坑与真实体验，看看学长学姐怎么说",
    icon: "uil-graduation-cap",
    tone: {
      well: "border-sky-100 bg-sky-50 text-sky-600",
      hover: "hover:border-sky-200 hover:bg-sky-50/40",
      arrow: "text-sky-500",
    },
  },
] as const;

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
            <br />
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

        {/* 原导航「资源 / 课程」入口迁到首页 */}
        <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {ENTRIES.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className={`group flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 transition-colors sm:px-5 sm:py-5 ${entry.tone.hover}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border sm:h-11 sm:w-11 ${entry.tone.well}`}
                aria-hidden
              >
                <i className={`uil ${entry.icon} text-xl sm:text-2xl`} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[15px] font-semibold text-slate-900 sm:text-base">
                    {entry.title}
                  </h2>
                  <i
                    className={`uil uil-arrow-right text-lg transition-transform duration-200 group-hover:translate-x-0.5 ${entry.tone.arrow}`}
                  />
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  {entry.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-16 flex w-full flex-col items-center justify-center gap-2 md:mt-20">
        <span className="text-center text-sm text-gray-500">
          著作权归中南小黑板所有
          <br />
          本站仅供学习 严禁商业行为
        </span>
      </div>
    </>
  );
}
