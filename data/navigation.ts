import type { NavItem } from "@/types/component";

export const HOME_SECTION_NAV_ITEMS: readonly NavItem[] = [
  { label: "首页", href: "#home", icon: "uil-estate" },
  { label: "关于", href: "#about", icon: "uil-user" },
  { label: "展示", href: "#portfolio", icon: "uil-scenery" },
  { label: "技术栈", href: "#skills", icon: "uil-file-alt" },
  { label: "联系", href: "#contact", icon: "uil-message" },
];

export const FEATURE_ROUTE_NAV_ITEMS: readonly NavItem[] = [
  { label: "首页", href: "/home", icon: "uil-estate" },
  { label: "资源", href: "/resource", icon: "uil-file-alt" },
  { label: "课程", href: "/course", icon: "uil-graduation-cap" },
  { label: "教师", href: "/teacher", icon: "uil-users-alt" },
  { label: "我的", href: "/me", icon: "uil-user-circle" },
];
