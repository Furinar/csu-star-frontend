"use client";

import Image from "next/image";
import Reveal from "@/components/effects/Reveal";

const portfolioItems = [
  {
    title: "课程管理模块",
    desc: "覆盖全校 32 个学院的课程查询与选课功能",
    img: "/portfolio1.jpg",
  },
  {
    title: "校园资讯平台",
    desc: "实时聚合校内通知、讲座与活动信息",
    img: "/portfolio2.jpg",
  },
  {
    title: "个人中心",
    desc: "成绩查询、课表管理、个性化设置一站搞定",
    img: "/portfolio3.jpg",
  },
];

export default function PortfolioGrid() {
  return (
    <section
      className="snap-section flex flex-col items-center justify-center"
      id="portfolio"
    >
      <div className="container mx-auto px-4 md:px-6">
        <Reveal direction="up" delay={0}>
          <h2 className="section__title">功能展示</h2>
          <span className="section__subtitle">平台核心模块</span>
        </Reveal>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
          {portfolioItems.map((item, i) => (
            <Reveal key={item.title} direction="up" delay={100 + i * 100}>
              <div className="p-4 px-6 rounded-xl bg-container/50 backdrop-blur-sm">
                <Image
                  src={item.img}
                  alt={item.title}
                  width={320}
                  height={200}
                  className="w-full h-auto rounded-lg justify-self-center"
                />
                <h3 className="text-(length:--h3-font-size) mb-2 mt-3">
                  {item.title}
                </h3>
                <p className="mb-3">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
