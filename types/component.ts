interface NavItem {
  label: string;
  href: string;
  icon: string;
}

// 兼容旧代码命名，后续可逐步移除。
type navItem = NavItem;

export type {
  NavItem,
  navItem,
}