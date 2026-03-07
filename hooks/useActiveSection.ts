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

    // 观察已有的 section
    const observedIds = new Set<string>();
    const observeSections = () => {
      for (const id of SECTION_IDS) {
        if (observedIds.has(id)) continue;
        const el = document.getElementById(id);
        if (el) {
          observer.observe(el);
          observedIds.add(id);
        }
      }
    };
    observeSections();

    // 监听 DOM 变化以捕获懒加载的 section
    const mutationObserver = new MutationObserver(() => {
      if (observedIds.size < SECTION_IDS.length) {
        observeSections();
      }
    });
    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [scrollRef]);

  return activeSection;
}
