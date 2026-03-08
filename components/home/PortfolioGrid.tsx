"use client";

import Reveal from "@/components/effects/Reveal";

const portfolioItems = [
  {
    title: "课程评价",
    desc: "覆盖全校 32 个学院、7500+ 门课程的评分与评价系统，帮你了解课程真实体验",
    icon: "fa-solid fa-graduation-cap",
    features: ["课程评分", "学生评价", "选课参考"],
  },
  {
    title: "教师评分",
    desc: "2500+ 名教师的多维度评分与口碑，助你找到最适合自己的老师",
    icon: "fa-solid fa-chalkboard-user",
    features: ["教师评分", "教学风格", "口碑推荐"],
  },
  {
    title: "学习资源",
    desc: "汇集课件、笔记、历年试题等学习资料，全校师生共建共享的资源库",
    icon: "fa-solid fa-book-open",
    features: ["课件资料", "历年试题", "学习笔记"],
  },
  {
    title: "更多功能",
    desc: "校园资讯、课表管理、个性化推荐……更多功能正在路上",
    icon: "fa-solid fa-rocket",
    features: ["校园资讯", "课表管理", "敬请期待"],
    comingSoon: true,
  },
];

export default function PortfolioGrid() {
  return (
    <section
      className="snap-section flex flex-col justify-start md:justify-center"
      id="portfolio"
    >
      <div className="container mx-auto px-5 md:px-8 py-10 md:py-0">
        {/* 标题区：左对齐 */}
        <Reveal direction="left" delay={0}>
          <div className="max-w-5xl mx-auto mb-6 md:mb-10">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-title leading-[1.1]">
              功能展示
            </h2>
            <span className="text-xs md:text-sm text-text-light mt-1 block tracking-widest uppercase">
              Core Modules
            </span>
          </div>
        </Reveal>

        {/* Bento 2x2 网格 */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0">
          {portfolioItems.map((item, i) => (
            <Reveal
              key={item.title}
              direction={i % 2 === 0 ? "left" : "right"}
              delay={100 + i * 100}
            >
              <div
                className={`group relative py-6 md:py-8 px-1 md:px-8 border-b border-border/40 ${i % 2 === 0 ? "md:border-r" : ""} ${i >= 2 ? "md:border-b-0" : ""}`}
              >
                {/* 水印图标 */}
                <i
                  className={`${item.icon} absolute right-3 md:right-6 top-4 md:top-6 text-[3rem] md:text-[4.5rem] text-title/8 pointer-events-none`}
                />

                <div className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-first/10 flex items-center justify-center shrink-0 group-hover:bg-first/15 transition-colors duration-300">
                    <i
                      className={`${item.icon} text-first text-lg group-hover:scale-110 transition-transform duration-300`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base md:text-lg font-bold text-title">
                        {item.title}
                      </h3>
                      {item.comingSoon && (
                        <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-first/10 text-first font-medium">
                          开发中
                        </span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-text-light leading-relaxed mb-2">
                      {item.desc}
                    </p>
                    <p className="text-[0.65rem] md:text-xs text-text-light/60 mb-2">
                      {item.features.join(" / ")}
                    </p>
                    {!item.comingSoon && (
                      <a
                        href="#"
                        className="inline-flex items-center text-first text-xs font-medium group-hover:gap-1.5 transition-all duration-300"
                      >
                        <span>了解更多</span>
                        <i className="uil uil-arrow-right ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
