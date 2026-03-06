"use client";

import Image from "next/image";
import Reveal from "@/components/effects/Reveal";

export default function AboutSection() {
  return (
    <section
      className="snap-section flex flex-col items-center justify-center"
      id="about"
    >
      <div className="container mx-auto px-4 md:px-6">
        <Reveal direction="up" delay={0}>
          <h2 className="section__title">关于南极星</h2>
          <span className="section__subtitle">平台简介</span>
        </Reveal>

        <div className="grid min-[568px]:grid-cols-2 md:gap-x-20 items-center">
          <Reveal direction="left" delay={100}>
            <Image
              src="/csustar.svg"
              alt="CSU Star"
              width={350}
              height={350}
              className="w-50 rounded-lg justify-self-center self-center md:w-87.5"
            />
          </Reveal>

          {/* 数据条 - 移动端 */}
          <Reveal direction="right" delay={200} className="md:hidden">
            <div className="flex items-center gap-4 mt-6 pt-5 border-t border-border">
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
            </div>
          </Reveal>

          <div>
            <Reveal direction="right" delay={200}>
              <p className="text-center mb-10 md:text-left">
                南极星是面向中南大学全体师生的一站式综合服务平台，致力于打造高效、便捷的数字化校园生态。
              </p>
            </Reveal>
            <Reveal direction="up" delay={300}>
              <div className="flex justify-evenly mb-10 md:justify-between">
                <div>
                  <span className="block text-center text-(length:--h2-font-size) font-semibold text-title">
                    32+
                  </span>
                  <span className="block text-center text-(length:--smaller-font-size)">
                    覆盖
                    <br />
                    学院
                  </span>
                </div>
                <div>
                  <span className="block text-center text-(length:--h2-font-size) font-semibold text-title">
                    10+
                  </span>
                  <span className="block text-center text-(length:--smaller-font-size)">
                    功能
                    <br />
                    模块
                  </span>
                </div>
                <div>
                  <span className="block text-center text-(length:--h2-font-size) font-semibold text-title">
                    1000+
                  </span>
                  <span className="block text-center text-(length:--smaller-font-size)">
                    服务
                    <br />
                    师生
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
