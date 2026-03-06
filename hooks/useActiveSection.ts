"use client";

import { useEffect, useState, type RefObject } from "react";

const SECTION_IDS = ["home", "about", "portfolio", "skills", "contact"];

export function useActiveSection(scrollRef: RefObject<HTMLElement | null>) {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [scrollRef]);

  return activeSection;
}
