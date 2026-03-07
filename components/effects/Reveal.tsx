"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useScrollContainer } from "@/hooks/useScrollContainer";

interface RevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}

const OFFSET_MAP = {
  up: "translateY(60px)",
  down: "translateY(-60px)",
  left: "translateX(-60px)",
  right: "translateX(60px)",
};

export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 1200,
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useScrollContainer();

  useEffect(() => {
    const el = ref.current;
    const container = scrollRef.current;
    if (!el || !container) return;

    el.style.opacity = "0";
    el.style.transform = OFFSET_MAP[direction];
    el.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translate(0, 0)";
          observer.unobserve(el);
        }
      },
      { root: container, threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [direction, delay, duration, scrollRef]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
