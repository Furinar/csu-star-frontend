"use client";

import type { navItem } from "@/types/component";
import Link from "next/link";

type BaseNavProps = {
  navItems: navItem[];
  darkTheme: boolean;
  toggleTheme: () => void;
  isActive: (href: string) => boolean;
  scrolled: boolean;
  useNextLink?: boolean;
  onItemClick?: (href: string) => void;
  mobileVariant?: "section" | "route";
};

function MobileNavLink({
  item,
  isActive,
  useNextLink,
  onItemClick,
}: {
  item: navItem;
  isActive: boolean;
  useNextLink: boolean;
  onItemClick?: (href: string) => void;
}) {
  const className = `flex flex-col items-center text-(length:--smaller-font-size) font-medium cursor-pointer transition-colors duration-300 ${
    isActive ? "text-first" : "text-title hover:text-first"
  }`;

  if (useNextLink) {
    return (
      <Link href={item.href} className={className}>
        <i
          className={`uil ${item.icon} text-lg transition-transform duration-300 ${
            isActive ? "-translate-y-1" : ""
          }`}
        />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <a
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        onItemClick?.(item.href);
      }}
      className={className}
    >
      <i className={`uil ${item.icon} text-lg`} />
      <span>{item.label}</span>
    </a>
  );
}

function DesktopNavLink({
  item,
  isActive,
  useNextLink,
  onItemClick,
}: {
  item: navItem;
  isActive: boolean;
  useNextLink: boolean;
  onItemClick?: (href: string) => void;
}) {
  const className = `relative text-(length:--small-font-size) font-medium cursor-pointer transition-colors duration-300 ${
    isActive ? "text-first" : "text-title hover:text-first"
  }`;

  if (useNextLink) {
    return (
      <Link href={item.href} className={className}>
        <span>{item.label}</span>
        {isActive && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-first" />
        )}
      </Link>
    );
  }

  return (
    <a
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        onItemClick?.(item.href);
      }}
      className={className}
    >
      <span>{item.label}</span>
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-first" />
      )}
    </a>
  );
}

export default function BaseNav({
  navItems,
  darkTheme,
  toggleTheme,
  isActive,
  scrolled,
  useNextLink = false,
  onItemClick,
  mobileVariant = "section",
}: BaseNavProps) {
  const mobileNavClassName =
    mobileVariant === "route"
      ? "fixed bottom-0 left-0 w-full z-fixed bg-body shadow-[0_-3px_4px_var(--nav-splitter)] md:hidden"
      : "fixed bottom-0 left-0 w-full z-fixed bg-body shadow-[0_-3px_4px_var(--nav-splitter)] md:hidden transition-shadow duration-1000";

  return (
    <>
      <div
        className={`sticky top-0 w-full z-fixed bg-body md:hidden ${
          scrolled ? "shadow-[0_3px_4px_var(--nav-splitter)]" : ""
        } transition-shadow duration-1000`}
      >
        <div className="container flex justify-between items-center h-(--header-height)">
          <Link
            href="/"
            className="uppercase text-title font-medium hover:text-first"
          >
            csu star
          </Link>
          <i
            className={`uil ${darkTheme ? "uil-sun" : "uil-moon"} text-xl text-title cursor-pointer hover:text-first`}
            onClick={toggleTheme}
          />
        </div>
      </div>

      <nav className={mobileNavClassName}>
        <ul className="flex justify-around items-center h-(--header-height)">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.label}>
                <MobileNavLink
                  item={item}
                  isActive={active}
                  useNextLink={useNextLink}
                  onItemClick={onItemClick}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      <header
        className={`hidden md:block sticky top-0 w-full z-fixed px-4 lg:px-4 bg-body ${
          scrolled ? "shadow-[0_3px_4px_var(--nav-splitter)]" : ""
        } transition-shadow duration-1000`}
        id="header"
      >
        <nav className="container flex justify-between items-center h-[calc(var(--header-height)+1.5rem)] gap-x-4">
          <Link
            href="/"
            className="uppercase text-title font-medium hover:text-first"
          >
            csu star
          </Link>

          <ul className="flex gap-x-8 ml-auto mr-4">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.label} className="flex flex-wrap content-center">
                  <DesktopNavLink
                    item={item}
                    isActive={active}
                    useNextLink={useNextLink}
                    onItemClick={onItemClick}
                  />
                </li>
              );
            })}
          </ul>

          <i
            className={`uil ${darkTheme ? "uil-sun" : "uil-moon"} text-xl text-title cursor-pointer hover:text-first`}
            onClick={toggleTheme}
          />
        </nav>
      </header>
    </>
  );
}
