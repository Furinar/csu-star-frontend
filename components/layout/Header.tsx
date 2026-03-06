"use client";

import { navItem } from "@/types/component";
import Link from "next/link";
import { useEffect, useState, type RefObject } from "react";

export default function Header({
  navItems,
  activeSection = "",
  onNavClick,
  scrollRef,
}: {
  navItems: navItem[];
  activeSection?: string;
  onNavClick?: (href: string) => void;
  scrollRef?: RefObject<HTMLElement | null>;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [darkTheme, setDarkTheme] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("dark-theme") === "true",
  );

  useEffect(() => {
    const container = scrollRef?.current;
    if (!container) return;
    const onScroll = () => {
      setScrolled(container.scrollTop >= 80);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [scrollRef]);

  const toggleTheme = () => {
    const next = !darkTheme;
    setDarkTheme(next);
    document.body.classList.toggle("dark-theme", next);
    localStorage.setItem("dark-theme", String(next));
  };

  return (
    <>
      {/* 移动端顶部栏 */}
      <div
        className={`sticky top-0 w-full z-fixed bg-body md:hidden ${scrolled ? "shadow-[0_3px_4px_var(--nav-splitter)]" : ""} transition-shadow duration-1000`}
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

      {/* 移动端底部导航栏 */}
      <nav
        className={`fixed bottom-0 left-0 w-full z-fixed bg-body shadow-[0_-3px_4px_var(--nav-splitter)] md:hidden transition-shadow duration-1000`}
      >
        <ul className="flex justify-around items-center h-(--header-height)">
          {navItems.map((item) => {
            const isActive = `#${activeSection}` === item.href;
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavClick?.(item.href);
                  }}
                  className={`flex flex-col items-center text-(length:--smaller-font-size) font-medium cursor-pointer transition-colors duration-300 ${
                    isActive ? "text-first" : "text-title hover:text-first"
                  }`}
                >
                  <i className={`uil ${item.icon} text-lg`} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* PC端顶部导航栏 */}
      <header
        className={`hidden md:block sticky top-0 w-full z-fixed px-4 lg:px-4 bg-body ${scrolled ? "shadow-[0_3px_4px_var(--nav-splitter)]" : ""} transition-shadow duration-1000`}
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
              const isActive = `#${activeSection}` === item.href;
              return (
                <li key={item.label} className="flex flex-wrap content-center">
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavClick?.(item.href);
                    }}
                    className={`relative text-(length:--small-font-size) font-medium cursor-pointer transition-colors duration-300 ${
                      isActive ? "text-first" : "text-title hover:text-first"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-first" />
                    )}
                  </a>
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
