"use client";

import { COLLEGES, ENG_COLLEGES } from "@/data/colleges";
import LogoLoop from "../ui/LogoLoop";

const logos = COLLEGES.map((c) => ({
  node: (
    <div className="flex items-center gap-2 px-3 py-1.5 whitespace-nowrap">
      <i className={`fa-solid ${c.icon} text-first-second text-lg`} />
      <span className="text-sm text-foreground">{c.name}</span>
    </div>
  ),
  title: c.name,
}));

const engLogos = ENG_COLLEGES.map((c) => ({
  node: (
    <div className="flex items-center gap-2 px-3 py-1.5 whitespace-nowrap">
      <span className="text-sm text-foreground">{c.name}</span>
      <i className={`fa-solid ${c.icon} text-first-second text-lg`} />
    </div>
  ),
  title: c.name,
}));

export default function CollegeLoop() {
  return (
    <>
      <LogoLoop
        logos={logos}
        speed={50}
        direction="left"
        logoHeight={36}
        gap={16}
        hoverSpeed={0}
        fadeOut
        fadeOutColor="var(--body-color)"
        ariaLabel="学院列表"
      />
      <LogoLoop
        logos={engLogos}
        speed={50}
        direction="right"
        logoHeight={36}
        gap={16}
        hoverSpeed={0}
        fadeOut
        fadeOutColor="var(--body-color)"
        ariaLabel="College List"
      />
    </>
  );
}
