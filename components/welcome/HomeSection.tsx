"use client";

import CollegeLoop from "@/components/welcome/CollegeLoop";
import { Input } from "antd";
import type { GetProps } from "antd";
const { Search } = Input;
type SearchProps = GetProps<typeof Input.Search>;
const onSearch: SearchProps["onSearch"] = (value, _e, info) =>
  console.log(info?.source, value);

export default function HomeSection() {
  return (
    <section className="pt-4 pb-2 md:pt-24 md:pb-8" id="home">
      <div className="container">
        {/* 搜索框 */}
        <div className="flex justify-center">
          <Search
            placeholder="搜索课程资源/老师"
            variant="outlined"
            allowClear
            enterButton="Search"
            size="large"
            onSearch={onSearch}
            className="shadow-md hover:shadow-lg bg-transparent"
            style={{
              width: "50%",
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] items-center md:gap-x-8 pt-9">
          {/* 介绍区 */}
          <div className="text-left">
            {/* 移动端：Logo + 品牌名同行 */}
            <div className="flex items-center gap-4 mb-5 md:hidden">
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
                  <image className="w-55" x="12" y="18" href="/csustar.png" />
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
            <h2 className="hidden md:block text-(length:--big-font-size)">
              南极星
            </h2>
            <h1 className="text-[2.25rem] font-bold leading-[1.1] tracking-tight mb-1 md:text-(length:--big-font-size) md:font-semibold md:leading-normal md:tracking-normal">
              <span className="text-title">EXPLORE</span>
              <br className="md:hidden" />{" "}
              <span className="hero-gradient-text">CSU STAR</span>
            </h1>

            <div className="flex items-center gap-2 mt-4 mb-3 md:mt-0">
              <div className="w-1 h-5 rounded-full bg-first" />
              <h3 className="text-(length:--h3-font-size) text-text font-medium">
                中南大学一站式综合平台
              </h3>
            </div>

            <p className="mb-5 md:mb-8 text-text leading-relaxed text-sm md:text-(length:--normal-font-size)">
              打破信息孤岛，连接校园资源，免费为中南大学师生提供便捷的数字化校园体验
            </p>

            {/* 按钮组 */}
            <div className="flex items-center gap-3">
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

            {/* 数据亮点条：仅移动端
            <div className="flex items-center gap-4 mt-6 pt-5 border-t border-border md:hidden">
              <div className="flex-1 text-center">
                <div className="text-lg font-bold text-first">30+</div>
                <div className="text-xs text-text-light">覆盖学院</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex-1 text-center">
                <div className="text-lg font-bold text-first">
                  <i className="fa-solid fa-shield-halved text-sm" />
                </div>
                <div className="text-xs text-text-light">免费使用</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex-1 text-center">
                <div className="text-lg font-bold text-first">
                  <i className="fa-solid fa-bolt text-sm" />
                </div>
                <div className="text-xs text-text-light">全校覆盖</div>
              </div>
            </div> */}
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
                <image className="w-55" x="12" y="18" href="/csustar.png" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* 跑马灯 */}
      <div
        className="container mt-6"
        style={{ overflow: "hidden", position: "relative" }}
      >
        <CollegeLoop />
      </div>
    </section>
  );
}
