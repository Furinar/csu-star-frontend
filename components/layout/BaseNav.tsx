"use client";

import type {NavItem} from "@/types/component";
import Link from "next/link";
import {useAuthStore} from "@/store/useAuthStore";
import {useEffect, useRef, useState} from "react";

type BaseNavProps = {
  navItems: readonly NavItem[];
  isActive: (href: string) => boolean;
  scrolled: boolean;
  useNextLink?: boolean;
  onItemClick?: (href: string) => void;
};

type NavLinkWrapperProps = {
  item: NavItem;
  isActive: boolean;
  useNextLink: boolean;
  onItemClick?: (href: string) => void;
  className: string;
  children: React.ReactNode;
};

function NavLinkWrapper({
                          item,
                          useNextLink,
                          onItemClick,
                          className,
                          children,
                        }: NavLinkWrapperProps) {
  if (useNextLink) {
    return (
        <Link href={item.href} className={className}>
          {children}
        </Link>
    );
  }

  return (
      <a
          href={item.href}
          onClick={(e) => {
            if (!useNextLink) {
              e.preventDefault();
            }
            onItemClick?.(item.href);
          }}
          className={className}
      >
        {children}
      </a>
  );
}

function MobileDropdownLink(
    props: Omit<NavLinkWrapperProps, "className" | "children">,
) {
  const {item, isActive} = props;
  const className = `flex items-center gap-x-3 px-4 py-3 text-sm cursor-pointer transition-colors duration-300 ${
      isActive ? "text-first bg-first/10 font-semibold" : "text-[var(--text-color)] font-medium hover:text-first"
  }`;

  return (
      <NavLinkWrapper {...props} className={className}>
        <i className={`uil ${item.icon} text-lg`}/>
        <span>{item.label}</span>
      </NavLinkWrapper>
  );
}

function DesktopNavLink(
    props: Omit<NavLinkWrapperProps, "className" | "children">,
) {
  const {item, isActive, useNextLink} = props;
  const className = `relative flex items-center px-4 py-2 text-(length:--small-font-size) cursor-pointer transition-colors duration-300 rounded-md overflow-hidden ${
      isActive ? "text-first font-bold" : "text-[var(--text-color)] font-medium hover:text-first"
  }`;

  return (
      <NavLinkWrapper {...props} className={className}>
      <span
          className={`absolute inset-0 bg-gradient-to-t from-[var(--first-color)]/20 to-transparent transition-opacity duration-300 ${
              isActive ? "opacity-100" : "opacity-0"
          }`}
      />
        {useNextLink && <i className={`uil ${item.icon} pr-1 relative z-10`}/>}
        <span className="relative z-10 tracking-wide">{item.label}</span>
      </NavLinkWrapper>
  );
}

export default function BaseNav({
                                  navItems,
                                  isActive,
                                  scrolled,
                                  useNextLink = false,
                                  onItemClick,
                                }: BaseNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navListRef = useRef<HTMLUListElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({left: 0, width: 0, opacity: 0});
  const avatar = useAuthStore((state) => state.user?.avatar_url);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const handleNavClick = (href: string) => {
    onItemClick?.(href);
    handleMenuClose();
  };

  useEffect(() => {
    const updateIndicator = () => {
      setTimeout(() => {
        if (!navListRef.current) return;
        const activeIndex = navItems.findIndex(item => isActive(item.href));

        const targetIndex = activeIndex + 1;

        if (activeIndex !== -1 && navListRef.current.children[targetIndex]) {
          const activeLi = navListRef.current.children[targetIndex] as HTMLElement;
          setIndicatorStyle({
            left: activeLi.offsetLeft,
            width: activeLi.offsetWidth,
            opacity: 1,
          });
        } else {
          setIndicatorStyle(prev => ({...prev, opacity: 0}));
        }
      }, 50);
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [isActive, navItems]);

  return (
      <>
        <div
            className={`sticky top-0 w-full z-fixed bg-body md:hidden ${
                scrolled ? "shadow-[0_1px_2px_var(--nav-splitter)]" : ""
            } transition-shadow duration-1000`}
        >
          <div
              className="container relative flex justify-between items-center h-[calc(var(--header-height)+1.5rem)]">
            <Link
                href="/"
                className="uppercase hero-gradient-text font-medium hover:scale-115 transition-transform "
            >
              csu star
            </Link>

            <div className="flex gap-x-3 items-center">
              <div className="flex items-center">
                {!hasHydrated ? (
                    <div
                        className="h-7 w-20 rounded-full bg-[var(--ice-100)]/80 animate-pulse"
                        aria-hidden="true"
                    />
                ) : avatar ? (
                    <img
                        src={avatar}
                        alt="Avatar"
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full"
                    />
                ) : (
                    <div className="flex gap-2">
                      <Link
                          href="/login"
                          className="text-[var(--text-color)] hover:text-first text-sm font-medium transition-colors"
                      >
                        登录
                      </Link>
                      <Link
                          href="/login?type=true"
                          className="text-[var(--text-color)] hover:text-first text-sm font-medium transition-colors"
                      >
                        注册
                      </Link>
                    </div>
                )}
              </div>

              <div className="w-[1px] h-5 bg-[var(--nav-splitter)] opacity-60"/>

              <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1 text-[var(--text-color)] hover:text-first transition-colors"
                  aria-label="打开菜单"
              >
                <i
                    className={`uil ${menuOpen ? "uil-times" : "uil-bars"} text-xl`}
                />
              </button>
            </div>

            {menuOpen && (
                <div
                    className="absolute top-[calc(var(--header-height)+1rem)] right-4 w-48 bg-body shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-xl border border-[var(--nav-splitter)] z-fixed overflow-hidden origin-top-right">
                  <nav>
                    <ul className="flex flex-col py-2">
                      {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <li key={item.label}>
                              <MobileDropdownLink
                                  item={item}
                                  isActive={active}
                                  useNextLink={useNextLink}
                                  onItemClick={handleNavClick}
                              />
                            </li>
                        );
                      })}
                    </ul>
                  </nav>
                </div>
            )}
          </div>
        </div>

        <header
            className={`hidden md:block sticky top-0 w-full z-fixed px-4 lg:px-4 bg-body ${
                scrolled ? "shadow-[0_1px_2px_var(--nav-splitter)]" : ""
            } transition-shadow duration-1000`}
            id="header"
        >
          <nav
              className="container flex justify-between items-center h-[calc(var(--header-height)+1.5rem)] gap-x-4">
            <Link
                href="/"
                className="uppercase hero-gradient-text font-bold hover:scale-115 transition-transform "
            >
              csu star
            </Link>

            <div className="flex items-center ml-auto">
              <ul className="flex items-center gap-x-2 relative" ref={navListRef}>
                <li
                    className="absolute bottom-0 h-[3px] bg-first shadow-[0_-2px_10px_var(--first-color)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-t-md pointer-events-none"
                    style={{
                      left: `${indicatorStyle.left}px`,
                      width: `${indicatorStyle.width}px`,
                      opacity: indicatorStyle.opacity,
                    }}
                />
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                      <li key={item.label} className="relative py-1">
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

              <div className="w-[1px] h-6 bg-[var(--nav-splitter)] mx-6 opacity-60"/>

              <div className="flex items-center">
                {!hasHydrated ? (
                    <div
                        className="h-8 w-24 rounded-full bg-[var(--ice-100)]/80 animate-pulse"
                        aria-hidden="true"
                    />
                ) : avatar ? (
                    <img
                        src={avatar}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <div className="flex gap-2">
                      <Link
                          href="/login"
                          className="text-[var(--text-color)] hover:text-first flex gap-x-3 text-(length:--small-font-size) font-medium transition-colors"
                      >
                        <span>登录 </span>
                      </Link>

                      <Link
                          href="/login?type=true"
                          className="text-[var(--text-color)] hover:text-first flex gap-x-3 text-(length:--small-font-size) font-medium transition-colors"
                      >
                        <span>注册</span>
                      </Link>
                    </div>
                )}
              </div>
            </div>
          </nav>
        </header>
      </>
  );
}
