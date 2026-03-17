"use client";

import type { NavItem } from "@/types/component";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";

type BaseNavProps = {
  navItems: readonly NavItem[];
  isActive: (href: string) => boolean;
  scrolled: boolean;
  useNextLink?: boolean;
  onItemClick?: (href: string) => void;
  mobileVariant?: "section" | "route";
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
        e.preventDefault();
        onItemClick?.(item.href);
      }}
      className={className}
    >
      {children}
    </a>
  );
}

function MobileNavLink(
  props: Omit<NavLinkWrapperProps, "className" | "children">,
) {
  const { item, isActive } = props;
  const className = `flex flex-col items-center text-(length:--smaller-font-size) font-medium cursor-pointer transition-colors duration-300 ${
    isActive ? "text-first" : "text-title hover:text-first"
  }`;

  return (
    <NavLinkWrapper {...props} className={className}>
      <i
        className={`uil ${item.icon} text-lg transition-transform duration-300 ${
          isActive && props.useNextLink ? "-translate-y-1" : ""
        }`}
      />
      <span>{item.label}</span>
    </NavLinkWrapper>
  );
}

function DesktopNavLink(
  props: Omit<NavLinkWrapperProps, "className" | "children">,
) {
  const { item, isActive, useNextLink } = props;
  const className = `relative text-(length:--small-font-size) font-medium cursor-pointer transition-colors duration-300 ${
    isActive ? "text-first" : "text-title hover:text-first"
  }`;

  return (
    <NavLinkWrapper {...props} className={className}>
      {useNextLink && <i className={`uil ${item.icon}  pr-1`} />}
      <span>{item.label}</span>
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-first" />
      )}
    </NavLinkWrapper>
  );
}

export default function BaseNav({
  navItems,
  isActive,
  scrolled,
  useNextLink = false,
  onItemClick,
  mobileVariant = "section",
}: BaseNavProps) {
  const mobileNavClassName = `fixed bottom-0 left-0 w-full z-fixed bg-body shadow-[0_-1px_2px_var(--nav-splitter)] md:hidden ${
    mobileVariant === "section" ? "transition-shadow duration-1000" : ""
  }`;

  const avatar = useAuthStore((state) => state.user?.avatar_url);

  return (
    <>
      <div
        className={`sticky top-0 w-full z-fixed bg-body md:hidden ${
          scrolled ? "shadow-[0_1px_2px_var(--nav-splitter)]" : ""
        } transition-shadow duration-1000`}
      >
        <div className="container flex justify-between items-center h-(--header-height)">
          <Link
            href="/"
            className="uppercase text-title font-medium hover:text-first"
          >
            csu star
          </Link>
          <div className="flex gap-x-2">
            <ThemeToggle />

            <div className="border-l pl-2 border-gray-300">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <Link
                  href="/login"
                  className="text-title hover:text-first flex gap-x-2 mt-1 text-sm"
                >
                  <span>登录</span>
                  <span>注册</span>
                </Link>
              )}
            </div>
          </div>
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
          scrolled ? "shadow-[0_1px_2px_var(--nav-splitter)]" : ""
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
          <div className="border-l pl-5 border-gray-300">
            <ThemeToggle />
          </div>

          <div className="border-l pl-5 border-gray-300">
            {avatar ? (
              <Image
                src={avatar}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <Link
                href="/login"
                className="text-title hover:text-first flex gap-x-3 text-(length:--small-font-size) font-medium"
              >
                <span>登录</span>
                <span>注册</span>
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}
