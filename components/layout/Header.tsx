"use client";

import BaseNav from "@/components/layout/BaseNav";
import { useScrollState } from "@/hooks/useScrollState";
import type { NavItem } from "@/types/component";
import type { RefObject } from "react";

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
  const scrolled = useScrollState(scrollRef, 80);

  return (
    <BaseNav
      navItems={navItems}
      scrolled={scrolled}
      isActive={(href) => `#${activeSection}` === href}
      onItemClick={onNavClick}
      mobileVariant="section"
    />
  );
}
