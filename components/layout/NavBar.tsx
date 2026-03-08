"use client";

import BaseNav from "@/components/layout/BaseNav";
import { useDarkTheme } from "@/hooks/useDarkTheme";
import type { navItem } from "@/types/component";
import { usePathname } from "next/navigation";

const NAV_ITEMS: navItem[] = [
  { label: "首页", href: "/home", icon: "uil-estate" },
  { label: "资源", href: "/resource", icon: "uil-file-alt" },
  { label: "课程", href: "/course", icon: "uil-graduation-cap" },
  { label: "教师", href: "/teacher", icon: "uil-users-alt" },
  { label: "我的", href: "/me", icon: "uil-user-circle" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { darkTheme, toggleTheme } = useDarkTheme();
  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  const isRouteActive = (href: string) => {
    const normalizedHref = href.replace(/\/$/, "") || "/";
    return (
      normalizedPath === normalizedHref ||
      normalizedPath.startsWith(`${normalizedHref}/`)
    );
  };

  return (
    <BaseNav
      navItems={NAV_ITEMS}
      darkTheme={darkTheme}
      toggleTheme={toggleTheme}
      scrolled
      isActive={isRouteActive}
      useNextLink
      mobileVariant="route"
    />
  );
}
