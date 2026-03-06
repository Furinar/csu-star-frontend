"use client";

import { useCallback } from "react";
import Header from "@/components/layout/Header";
import ShootingStars from "@/components/effects/ShootingStars";
import "./globals.css";
import HomeSection from "@/components/home/HomeSection";
import AboutSection from "@/components/home/AboutSection";
import PortfolioGrid from "@/components/home/PortfolioGrid";
import SkillsAccordion from "@/components/home/SkillsAccordion";
import ContactSection from "@/components/home/ContactSection";
import {
  ScrollContainerProvider,
  useScrollContainer,
} from "@/hooks/useScrollContainer";
import { useActiveSection } from "@/hooks/useActiveSection";

const NAV_ITEMS = [
  { label: "首页", href: "#home", icon: "uil-estate" },
  { label: "关于", href: "#about", icon: "uil-user" },
  { label: "展示", href: "#portfolio", icon: "uil-scenery" },
  { label: "技术栈", href: "#skills", icon: "uil-file-alt" },
  { label: "联系", href: "#contact", icon: "uil-message" },
] as const;

function WelcomeInner() {
  const scrollRef = useScrollContainer();
  const activeSection = useActiveSection(scrollRef);

  const handleNavClick = useCallback((href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="overflow-x-clip h-dvh flex flex-col">
      {/* 流星背景 */}
      <ShootingStars />

      {/* 导航栏 */}
      <Header
        navItems={[...NAV_ITEMS]}
        activeSection={activeSection}
        onNavClick={handleNavClick}
        scrollRef={scrollRef}
      />

      {/* 主要内容 - scroll-snap 容器 */}
      <main
        ref={scrollRef as React.RefObject<HTMLElement>}
        className="snap-scroll-container flex-1 pb-14 md:pb-0"
      >
        <HomeSection />
        <AboutSection />
        <PortfolioGrid />
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
