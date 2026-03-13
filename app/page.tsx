"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import ShootingStars from "@/components/effects/ShootingStars";
import HomeSection from "@/components/home/HomeSection";
import { HOME_SECTION_NAV_ITEMS } from "@/data/navigation";
import {
  ScrollContainerProvider,
  useScrollContainer,
} from "@/hooks/useScrollContainer";
import { useActiveSection } from "@/hooks/useActiveSection";

// 懒加载非首屏 Section
const AboutSection = dynamic(() => import("@/components/home/AboutSection"), {
  loading: () => <SectionSkeleton />,
});
const PortfolioGrid = dynamic(() => import("@/components/home/PortfolioGrid"), {
  loading: () => <SectionSkeleton />,
});
const SkillsAccordion = dynamic(
  () => import("@/components/home/SkillsAccordion"),
  { loading: () => <SectionSkeleton /> },
);
const ContactSection = dynamic(
  () => import("@/components/home/ContactSection"),
  { loading: () => <SectionSkeleton /> },
);

function SectionSkeleton() {
  return (
    <section className="snap-section flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-6 w-32 rounded bg-first/10" />
        <div className="h-4 w-48 rounded bg-first/5" />
        <div className="h-40 w-72 rounded-xl bg-first/5 mt-4" />
      </div>
    </section>
  );
}

function WelcomeInner() {
  const scrollRef = useScrollContainer();
  const activeSection = useActiveSection(scrollRef);

  const handleNavClick = useCallback((href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="overflow-x-clip relative h-dvh flex flex-col">
      {/* 流星背景 */}
      <ShootingStars />

      {/* 导航栏 */}
      <Header
        navItems={HOME_SECTION_NAV_ITEMS}
        activeSection={activeSection}
        onNavClick={handleNavClick}
        scrollRef={scrollRef}
      />

      <main
        ref={scrollRef as React.RefObject<HTMLElement>}
        className="snap-scroll-container flex-1 pb-14 md:pb-0"
      >
        <HomeSection />
        <AboutSection />
        <PortfolioGrid />
        <div className="h-48 md:hidden" />
        <SkillsAccordion />
        <ContactSection />
      </main>
    </div>
  );
}

export default function Welcome() {
  return (
    <ScrollContainerProvider>
      <WelcomeInner />
    </ScrollContainerProvider>
  );
}
