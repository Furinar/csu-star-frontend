"use client";

import BaseNav from "@/components/layout/BaseNav";
import { FEATURE_ROUTE_NAV_ITEMS } from "@/data/navigation";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
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
      navItems={FEATURE_ROUTE_NAV_ITEMS}
      scrolled
      isActive={isRouteActive}
      useNextLink
      mobileVariant="route"
    />
  );
}
