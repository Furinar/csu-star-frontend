"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createPageThemeStyle, getPageTheme } from "@/lib/pageTheme";

export default function FeatureThemeShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const theme = getPageTheme(pathname);

  return (
    <div style={createPageThemeStyle(theme)}>
      {children}
    </div>
  );
}
