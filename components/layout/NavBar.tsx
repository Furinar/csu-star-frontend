"use client";

import BaseNav from "@/components/layout/BaseNav";
import { FEATURE_ROUTE_NAV_ITEMS } from "@/data/navigation";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

/** 文档/协作页：主站导航项 + wiki brand（对齐原 CSU Wiki logo 气质） */
function isWikiChromePath(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return (
    p === "/compass/doc" ||
    p === "/compass/p" ||
    p === "/compass/space" ||
    p === "/compass/collection" ||
    p.startsWith("/compass/doc/")
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const wikiChrome = isWikiChromePath(normalizedPath);

  // Stable callback so BaseNav's indicator effect does not re-run every parent render.
  const isRouteActive = useCallback(
    (href: string) => {
      const normalizedHref = href.replace(/\/$/, "") || "/";
      return (
        normalizedPath === normalizedHref ||
        normalizedPath.startsWith(`${normalizedHref}/`)
      );
    },
    [normalizedPath],
  );

  const brand = useMemo(
    () =>
      wikiChrome
        ? {
            brandHref: "/compass",
            brandLabel: "CSU Wiki",
            brandLogoSrc: "/csustar.svg",
            brandWikiStyle: true,
          }
        : {
            brandHref: "/",
            brandLabel: "csu star",
            brandLogoSrc: undefined,
            brandWikiStyle: false,
          },
    [wikiChrome],
  );

  return (
    <BaseNav
      navItems={FEATURE_ROUTE_NAV_ITEMS}
      scrolled
      isActive={isRouteActive}
      useNextLink
      brandHref={brand.brandHref}
      brandLabel={brand.brandLabel}
      brandLogoSrc={brand.brandLogoSrc}
      brandWikiStyle={brand.brandWikiStyle}
    />
  );
}
