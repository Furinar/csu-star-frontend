"use client";

import Reveal from "@/components/effects/Reveal";
import FooterSection from "@/components/home/FooterSection";

export default function ContactSection() {
  return (
    <section className="snap-section flex flex-col" id="contact">
      <div className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 md:px-6">
        <Reveal direction="up" delay={0}>
          <h2 className="section__title">联系我们</h2>
          <span className="section__subtitle">取得联系</span>
        </Reveal>

        <div className="grid gap-y-12 min-[568px]:grid-cols-2 w-full">
          <div>
            <Reveal direction="left" delay={100}>
              <div className="flex mb-8">
                <i className="uil uil-envelope text-2xl text-first mr-3" />
                <div>
                  <h3 className="text-(length:--h3-font-size) font-medium">
                    邮箱
                  </h3>
                  <span className="text-(length:--small-font-size) text-text-light">
                    csustar@csu.edu.cn
                  </span>
                </div>
              </div>
            </Reveal>
            <Reveal direction="left" delay={200}>
              <div className="flex mb-8">
                <i className="uil uil-map-marker text-2xl text-first mr-3" />
                <div>
                  <h3 className="text-(length:--h3-font-size) font-medium">
                    地址
                  </h3>
                  <span className="text-(length:--small-font-size) text-text-light">
                    湖南省长沙市 · 中南大学
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Footer 合入 Contact Section */}
      <FooterSection />
    </section>
  );
}
