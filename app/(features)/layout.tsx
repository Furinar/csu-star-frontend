"use client";

import FeatureThemeShell from "@/components/layout/FeatureThemeShell";
import NavBar from "@/components/layout/NavBar";

/**
 * 功能区统一主站顶栏（首页/搜索/指北/…/我的）。
 * wiki 文档与协作页不再隐藏 NavBar：与 VitePress 三栏「结合」为混合顶栏。
 */
export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureThemeShell>
      <NavBar />
      {children}
    </FeatureThemeShell>
  );
}
