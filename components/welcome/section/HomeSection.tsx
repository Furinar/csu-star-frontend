"use client";

import CollegeLoop from "@/components/welcome/CollegeLoop";
import HomeSearchBar from "@/components/welcome/HomeSearchBar";

export default function HomeSection() {
  return (
    <section className="pt-2 pb-6 md:pt-10 md:pb-8" id="home">
      <div className="container grid gap-y-3 md:gap-y-16 overflow-hidden md:overflow-visible mx-auto px-4 md:px-6">
        {/* 搜索框 */}
        <div className="w-full flex justify-center mt-2 md:mt-4 z-10 relative">
          <HomeSearchBar />
        </div>

        {/* 介绍区 */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] items-center gap-y-6 md:gap-x-8">
          <div className="text-left grid gap-y-5 md:gap-y-6">
            {/* 移动端：Logo + 品牌名同行 */}
            <div className="flex items-center gap-4 md:hidden">
              <svg
                className="w-20 h-20 fill-first shrink-0"
                viewBox="0 0 200 187"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="CSU Star Logo"
              >
                <mask id="mask0-mobile" mask-type="alpha">
                  <path d="M190.312 36.4879C206.582 62.1187 201.309 102.826 182.328 134.186C163.346 165.547 130.807 187.559 100.226 186.353C69.6454 185.297 41.0228 161.023 21.7403 129.362C2.45775 97.8511 -7.48481 59.1033 6.67581 34.5279C20.9871 10.1032 59.7028 -0.149132 97.9666 0.00163737C136.23 0.303176 174.193 10.857 190.312 36.4879Z" />
                </mask>
                <g mask="url(#mask0-mobile)">
                  <path d="M190.312 36.4879C206.582 62.1187 201.309 102.826 182.328 134.186C163.346 165.547 130.807 187.559 100.226 186.353C69.6454 185.297 41.0228 161.023 21.7403 129.362C2.45775 97.8511 -7.48481 59.1033 6.67581 34.5279C20.9871 10.1032 59.7028 -0.149132 97.9666 0.00163737C136.23 0.303176 174.193 10.857 190.312 36.4879Z" />
                  <image className="w-60" x="-9" y="-2" href="/csustar.svg" />
                </g>
              </svg>
              <div>
                <h2 className="text-2xl font-semibold leading-tight text-title">
                  南极星
                </h2>
                <span className="text-sm text-text-light tracking-wider">
                  CSU STAR
                </span>
              </div>
            </div>

            {/* 标题 */}
            <div className="grid gap-y-1">
              <h2 className="hidden md:block text-(length:--big-font-size)">
                南极星
              </h2>
              <h1 className="text-[2.25rem] font-bold leading-[1.1] tracking-tight md:text-(length:--big-font-size) md:font-semibold md:leading-normal md:tracking-normal">
                <span className="text-title">EXPLORE</span>
                <br className="md:hidden" />{" "}
                <span className="hero-gradient-text">CSU STAR</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-first" />
              <h3 className="text-(length:--h3-font-size) text-text font-medium">
                中南大学一站式综合平台
              </h3>
            </div>

            <p className="text-text leading-relaxed text-sm md:text-(length:--normal-font-size)">
              打破信息孤岛，连接校园资源，免费为中南大学师生提供便捷的数字化校园体验
            </p>

            {/* 按钮组 */}
            <div className="flex items-center gap-3 md:pt-4">
              <a href="/home" className="button button--flex">
                开始探索 <i className="uil uil-message button__icon" />
              </a>
              <a
                href="#about"
                className="button--link button--flex text-first text-sm font-medium md:hidden"
              >
                了解更多 <i className="uil uil-arrow-right ml-1" />
              </a>
            </div>
          </div>

          {/* 右侧图像区：仅桌面端 */}
          <div className="justify-self-center order-first md:order-last hidden md:block">
            <svg
              className="w-44 sm:w-52 md:w-60 lg:w-75 xl:w-90 fill-first"
              viewBox="0 0 200 187"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="CSU Star Logo"
            >
              <mask id="mask0" mask-type="alpha">
                <path d="M190.312 36.4879C206.582 62.1187 201.309 102.826 182.328 134.186C163.346 165.547 130.807 187.559 100.226 186.353C69.6454 185.297 41.0228 161.023 21.7403 129.362C2.45775 97.8511 -7.48481 59.1033 6.67581 34.5279C20.9871 10.1032 59.7028 -0.149132 97.9666 0.00163737C136.23 0.303176 174.193 10.857 190.312 36.4879Z" />
              </mask>
              <g mask="url(#mask0)">
                <path d="M190.312 36.4879C206.582 62.1187 201.309 102.826 182.328 134.186C163.346 165.547 130.807 187.559 100.226 186.353C69.6454 185.297 41.0228 161.023 21.7403 129.362C2.45775 97.8511 -7.48481 59.1033 6.67581 34.5279C20.9871 10.1032 59.7028 -0.149132 97.9666 0.00163737C136.23 0.303176 174.193 10.857 190.312 36.4879Z" />
                <image className="w-60" x="-9" y="-2" href="/csustar.svg" />
              </g>
            </svg>
          </div>
        </div>

        {/* 学院跑马灯 */}
        <div style={{ overflow: "hidden", position: "relative" }}>
          <CollegeLoop />
        </div>
      </div>
    </section>
  );
}
