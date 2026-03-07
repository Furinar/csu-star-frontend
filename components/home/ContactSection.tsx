"use client";

import Reveal from "@/components/effects/Reveal";
import FooterSection from "@/components/home/FooterSection";

const contactItems = [
  {
    icon: "uil uil-envelope",
    title: "邮箱",
    value: "2184689894@qq.com",
    href: "mailto:2184689894@qq.com",
  },
  {
    icon: "uil uil-map-marker",
    title: "地址",
    value: "湖南省长沙市 · 中南大学",
  },
  {
    icon: "uil uil-github-alt",
    title: "GitHub",
    value: "CSU Star",
    href: "https://github.com",
  },
];

export default function ContactSection() {
  return (
    <section className="snap-section flex flex-col" id="contact">
      <div className="flex-1 flex flex-col justify-center container mx-auto px-5 md:px-8 py-6 md:py-0">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 md:gap-16 items-start">
          <div>
            <Reveal direction="left" delay={0}>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-title leading-[1.05] mb-3 md:mb-4">
                联系
                <br className="hidden md:block" />
                我们
              </h2>
              <span className="text-xs md:text-sm text-text-light block tracking-widest uppercase mb-6 md:mb-10">
                Get in Touch
              </span>
            </Reveal>

            <Reveal direction="up" delay={200}>
              <p className="text-sm md:text-base text-text-light leading-relaxed mb-6 max-w-sm">
                有任何建议或合作意向？欢迎随时联系我们
              </p>
              <a
                href="mailto:csustar@csu.edu.cn"
                className="button button--flex shadow-lg group inline-flex"
              >
                <i className="uil uil-envelope mr-2" />
                发送邮件
                <i className="uil uil-arrow-right ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </Reveal>
          </div>

          <div className="space-y-0 md:pt-4">
            {contactItems.map((item, i) => (
              <Reveal key={item.title} direction="right" delay={100 + i * 100}>
                <div className="group flex items-center gap-4 py-4 md:py-5 border-b border-border/30 last:border-b-0 transition-all duration-300 hover:translate-x-1">
                  <i
                    className={`${item.icon} text-first text-lg md:text-xl shrink-0 transition-transform duration-300 group-hover:scale-110`}
                  />
                  <div className="min-w-0">
                    <span className="text-[0.65rem] text-text-light tracking-widest uppercase block">
                      {item.title}
                    </span>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sm md:text-base text-title font-medium hover:text-first transition-colors break-all"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-sm md:text-base text-title font-medium break-all">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <FooterSection />
    </section>
  );
}
