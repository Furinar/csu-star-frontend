import type { NavItem } from "@/types/component";

export const HOME_SECTION_NAV_ITEMS: readonly NavItem[] = [
  { label: "首页", href: "#home", icon: "uil-estate" },
  { label: "关于", href: "#about", icon: "uil-user" },
  { label: "展示", href: "#portfolio", icon: "uil-scenery" },
  { label: "技术", href: "#skills", icon: "uil-file-alt" },
  { label: "联系", href: "#contact", icon: "uil-message" },
];

export const FEATURE_ROUTE_NAV_ITEMS: readonly NavItem[] = [
  { label: "首页", href: "/home", icon: "uil-estate" },
  // {label: "指北", href: "/compass", icon: "uil-compass"},
  { label: "搜索", href: "/search", icon: "uil-search" },
  { label: "排行", href: "/rank", icon: "uil-trophy" },
  { label: "资源", href: "/resource", icon: "uil-file-alt" },
  { label: "课程", href: "/course", icon: "uil-graduation-cap" },
  { label: "我的", href: "/me", icon: "uil-user-circle" },
  { label: "关于", href: "/about", icon: "uil-info-circle" },
];
