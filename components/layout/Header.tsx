"use client";

import BaseNav from "@/components/layout/BaseNav";
import { useDarkTheme } from "@/hooks/useDarkTheme";
import type { NavItem } from "@/types/component";
import { useEffect, useState, type RefObject } from "react";

export default function Header({
  navItems,
  activeSection = "",
  onNavClick,
  scrollRef,
}: {
  navItems: readonly NavItem[];
  activeSection?: string;
  onNavClick?: (href: string) => void;
  scrollRef?: RefObject<HTMLElement | null>;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { darkTheme, toggleTheme } = useDarkTheme();

  useEffect(() => {
    const container = scrollRef?.current;
    if (!container) return;
    const onScroll = () => {
      setScrolled(container.scrollTop >= 80);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [scrollRef]);

  return (
    <BaseNav
      navItems={navItems}
      darkTheme={darkTheme}
      toggleTheme={toggleTheme}
      scrolled={scrolled}
      isActive={(href) => `#${activeSection}` === href}
      onItemClick={onNavClick}
      mobileVariant="section"
    />
  );
}
