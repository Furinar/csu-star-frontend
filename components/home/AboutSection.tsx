"use client";

import Image from "next/image";
import Reveal from "@/components/effects/Reveal";

const stats = [
  { value: "32", label: "覆盖学院", icon: "fa-solid fa-building-columns" },
  { value: "2500+", label: "收录教师", icon: "fa-solid fa-chalkboard-user" },
  { value: "7500+", label: "收录课程", icon: "fa-solid fa-book-open" },
];

const tags = ["免费使用", "全校覆盖", "持续更新", "安全可靠"];

export default function AboutSection() {
  return (
    <section className="snap-section flex flex-col justify-center" id="about">
      <div className="container mx-auto px-5 md:px-8 py-6 md:py-0">

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-16 max-w-5xl mx-auto items-end md:items-start">

          <div className="space-y-5 md:space-y-8">

            <Reveal direction="left" delay={0}>
              <div className="flex items-start gap-4 md:gap-6">
                <Image
                  src="/csustar.svg"
                  alt="CSU Star"
                  width={56}
                  height={56}
                  className="w-10 h-10 md:w-14 md:h-14 shrink-0 mt-1 drop-shadow-md"
                />
                <div>
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-title leading-[1.1]">
                    关于南极星
                  </h2>
                  <span className="text-xs md:text-sm text-text-light mt-1 block tracking-widest uppercase">
                    About CSU Star
                  </span>
                </div>
              </div>
            </Reveal>

            <Reveal direction="up" delay={150}>
              <div className="md:pl-20 max-w-lg">
                <h3 className="text-lg md:text-xl font-bold text-title mb-2">
                  学习资源 · 课程评价
                </h3>
                <p className="text-sm md:text-base text-text-light leading-relaxed">
                  南极星汇集中南大学全校学习资源，提供课程与教师评分功能，帮助同学们做出更明智的选课决策。未来将持续拓展为一站式综合校园平台。
                </p>
              </div>
            </Reveal>

            <Reveal direction="up" delay={350}>
              <div className="md:pl-20 flex flex-wrap items-center gap-x-4 gap-y-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 text-first text-xs md:text-sm font-medium"
                  >
                    <i className="fa-solid fa-check text-[0.55rem]" />
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="flex md:flex-col gap-6 md:gap-8 md:pt-4 justify-between md:justify-start">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} direction="right" delay={200 + i * 120}>
                <div className="group text-center md:text-right">
                  <i
                    className={`${stat.icon} text-first text-base md:text-lg mb-1 block transition-transform duration-300 group-hover:scale-110`}
                  />
                  <div className="text-3xl md:text-5xl lg:text-6xl font-black text-title leading-none tracking-tighter">
                    {stat.value}
                  </div>
                  <div className="text-[0.65rem] md:text-xs text-text-light mt-1 tracking-wider uppercase">
                    {stat.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
