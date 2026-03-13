"use client";

import CollegeLoop from "@/components/ui/CollegeLoop";
import SearchBar from "@/components/ui/SearchBar";
import Reveal from "@/components/effects/Reveal";

export default function HomeSection() {
  return (
    <section className="snap-section flex flex-col" id="home">
      <div className="container flex-1 flex flex-col justify-start gap-y-6 md:gap-y-10 overflow-visible mx-auto px-4 md:px-6 py-4">
        {/* <Reveal
          direction="up"
          delay={0}
          className="w-full flex justify-center z-10 relative"
        >
          <SearchBar wrapperClassName="pt-2 md:pt-4" onSearch={(val) => console.log('Searching:', val)} />
        </Reveal> */}
        <div className="pt-10"></div>

        <div className="md:pt-20 grid grid-cols-1 md:grid-cols-[1fr_1fr] items-center gap-y-6 md:gap-x-8">
          <div className="text-left grid gap-y-5 md:gap-y-6">
            <Reveal
              direction="left"
              delay={100}
              className="flex items-center gap-4 md:hidden"
            >
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
            </Reveal>

            <Reveal direction="up" delay={150}>
              <div className="">
                <h2 className="hidden md:block md:text-6xl">南极星</h2>
                <h1 className="text-[2.25rem] font-bold leading-[1.1] tracking-tight md:text-6xl md:font-semibold md:leading-normal md:tracking-normal">
                  <span className="text-title">EXPLORE</span>
                  <br className="md:hidden" />{" "}
                  <span className="hero-gradient-text">CSU STAR</span>
                </h1>
              </div>
            </Reveal>

            <Reveal direction="up" delay={250}>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-first" />
                <h3 className="text-(length:--h3-font-size) text-text font-medium">
                  中南大学一站式综合平台
                </h3>
              </div>
            </Reveal>

            <Reveal direction="up" delay={350}>
              <div className="flex items-center gap-6 md:pt-4">
                <a
                  href="/home"
                  className="flex justify-center button button--flex shadow-lg w-36 group"
                >
                  开始探索
                  <i className="uil uil-message button__icon ml-1 transition-transform duration-300 group-hover:translate-x-3" />
                </a>
                <a
                  href="#about"
                  className="button--link button--flex text-first text-sm font-medium md:hidden"
                >
                  Learn more <i className="uil uil-arrow-right ml-1" />
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal
            direction="right"
            delay={200}
            className="order-first md:order-last hidden md:block justify-self-end"
          >
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
          </Reveal>
        </div>

        <Reveal direction="up" delay={400} className="overflow-hidden relative">
          <CollegeLoop />
        </Reveal>
      </div>
    </section>
  );
}
