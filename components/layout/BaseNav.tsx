"use client";

import type {NavItem} from "@/types/component";
import Link from "next/link";
import {useAuthStore} from "@/store/useAuthStore";
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import {DEFAULT_AVATAR_SRC, resolveAvatarSrc} from "@/lib/avatar";

type BaseNavProps = {
  navItems: readonly NavItem[];
  isActive: (href: string) => boolean;
  scrolled: boolean;
  useNextLink?: boolean;
  onItemClick?: (href: string) => void;
  /** Brand link target (default `/`). */
  brandHref?: string;
  /** Brand text; default site wordmark. */
  brandLabel?: string;
  /** Optional logo image (e.g. wiki CSU Wiki mark). */
  brandLogoSrc?: string;
  /** When true, brand uses sentence case (wiki) instead of uppercase wordmark. */
  brandWikiStyle?: boolean;
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
      isActive
          ? "text-first bg-first/10 font-semibold"
          : "text-[var(--text-color)] font-medium hover:text-first"
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
      isActive
          ? "text-first font-bold"
          : "text-[var(--text-color)] font-medium hover:text-first"
  }`;

  return (
      <NavLinkWrapper {...props} className={className}>
      <span
          className={`absolute inset-0 bg-gradient-to-t from-[var(--first-color)]/20 to-transparent transition-opacity duration-300 ${
              isActive ? "opacity-100" : "opacity-0"
          }`}
      />
        {/* Fixed icon slot so CDN icon-font load does not reflow nav widths. */}
        {useNextLink && (
          <i
            className={`uil ${item.icon} relative z-10 mr-1 inline-block w-[1em] shrink-0 text-center leading-none`}
            aria-hidden
          />
        )}
        <span className="relative z-10 tracking-wide">{item.label}</span>
      </NavLinkWrapper>
  );
}

function BrandLink({
  href,
  label,
  logoSrc,
  wikiStyle,
  bold,
}: {
  href: string;
  label: string;
  logoSrc?: string;
  wikiStyle?: boolean;
  bold?: boolean;
}) {
  const className = wikiStyle
    ? `flex items-center gap-2 font-semibold tracking-tight text-[var(--title-color)] hover:opacity-80 transition-opacity ${
        bold ? "" : ""
      }`
    : `uppercase hero-gradient-text ${
        bold ? "font-bold" : "font-medium"
      } hover:scale-115 transition-transform`;

  return (
    <Link href={href} className={className}>
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- static brand asset
        <img
          src={logoSrc}
          alt=""
          width={24}
          height={24}
          className="w-6 h-6 object-contain shrink-0"
        />
      ) : null}
      <span>{label}</span>
    </Link>
  );
}

/** Guest login/register links (shared mobile + desktop copy). */
function NavGuestLinks({ compact }: { compact?: boolean }) {
  const linkClass = compact
    ? "text-[var(--text-color)] hover:text-first text-sm font-medium transition-colors"
    : "text-[var(--text-color)] hover:text-first flex gap-x-3 text-(length:--small-font-size) font-medium transition-colors";

  return (
    <div className="flex gap-2">
      <Link href="/login" className={linkClass}>
        {compact ? "登录" : <span>登录 </span>}
      </Link>
      <Link href="/login?type=true" className={linkClass}>
        {compact ? "注册" : <span>注册</span>}
      </Link>
    </div>
  );
}

/**
 * Auth chrome for the sticky nav.
 * - Before hydrate: emit both guest + avatar; head prepaint CSS picks the branch
 *   so the first painted frame already matches localStorage (no skeleton flash).
 * - After hydrate: React-owned single branch with interactive menu.
 * Avatar box is always exactly size×size — no padding that expands the slot.
 */
function NavAuthSlot({
  size,
  compactGuest,
  hasHydrated,
  isLoggedIn,
  avatarSrc,
  avatarMenuOpen,
  onToggleAvatarMenu,
  onCloseMenus,
  onLogout,
  avatarRef,
}: {
  size: 28 | 32;
  compactGuest?: boolean;
  hasHydrated: boolean;
  isLoggedIn: boolean;
  avatarSrc: string;
  avatarMenuOpen?: boolean;
  onToggleAvatarMenu?: () => void;
  onCloseMenus: () => void;
  onLogout: () => void;
  avatarRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const box = size === 28 ? "h-7 w-7" : "h-8 w-8";
  const isMobile = size === 28;

  const menuClass = isMobile
    ? `absolute right-0 top-full mt-2 w-32 bg-body shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-xl border border-[var(--nav-splitter)] transition-all duration-300 z-fixed overflow-hidden flex flex-col ${
        avatarMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`
    : "absolute right-0 top-full mt-0 w-32 bg-body shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-xl border border-[var(--nav-splitter)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-fixed overflow-hidden flex flex-col";

  const avatarInteractive = (
    <div
      ref={avatarRef}
      className={`relative ${box} shrink-0 cursor-pointer ${isMobile ? "" : "group"}`}
      onClick={isMobile ? onToggleAvatarMenu : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- user avatar URL may be external/identicon */}
      <img
        src={avatarSrc}
        alt="Avatar"
        width={size}
        height={size}
        decoding="async"
        fetchPriority="high"
        // Prepaint CSS var underlays the same face while the network img decodes.
        className={`${box} rounded-full object-cover bg-[var(--ice-100)] nav-avatar-face`}
      />
      <div className={menuClass}>
        <Link
          href="/me"
          onClick={onCloseMenus}
          className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--title-color)] hover:text-first hover:bg-first/5 transition-colors"
        >
          <i className="uil uil-user"></i> 个人中心
        </Link>
        <div className="w-full h-[1px] bg-[var(--nav-splitter)] opacity-60"></div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLogout();
            onCloseMenus();
          }}
          className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-[var(--title-color)] hover:text-[hsl(0,100%,67%)] hover:bg-[hsl(0,100%,67%)]/10 transition-colors"
        >
          <i className="uil uil-sign-out-alt"></i> 退出登录
        </button>
      </div>
    </div>
  );

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-end">
        {/* Prepaint: CSS toggles via html[data-auth]; face uses --nav-avatar-url. */}
        <div
          data-nav-auth="avatar"
          className={`${box} shrink-0`}
          aria-hidden="true"
        >
          <div className="nav-avatar-face" />
        </div>
        <div data-nav-auth="guest">
          <NavGuestLinks compact={compactGuest} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end">
      {isLoggedIn ? avatarInteractive : <NavGuestLinks compact={compactGuest} />}
    </div>
  );
}

export default function BaseNav({
                                  navItems,
                                  isActive,
                                  scrolled,
                                  useNextLink = false,
                                  onItemClick,
                                  brandHref = "/",
                                  brandLabel = "csu star",
                                  brandLogoSrc,
                                  brandWikiStyle = false,
                                }: BaseNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const navListRef = useRef<HTMLUListElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileAvatarRef = useRef<HTMLDivElement>(null);
  /** First placement skips CSS transition so refresh does not slide from 0. */
  const indicatorReadyRef = useRef(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });
  const [indicatorAnimated, setIndicatorAnimated] = useState(false);
  const accessToken = useAuthStore((state) => state.access_token);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const logout = useAuthStore((state) => state.logout);
  // Logged-in = token/user present — do NOT gate on avatar_url (empty url used to flash 登录).
  const isLoggedIn = Boolean(accessToken || user);
  const avatarSrc = resolveAvatarSrc(user?.avatar_url, DEFAULT_AVATAR_SRC);

  const handleMenuClose = () => {
    setMenuOpen(false);
    setAvatarMenuOpen(false);
  };

  const handleNavClick = (href: string) => {
    onItemClick?.(href);
    handleMenuClose();
  };

  const updateIndicator = useCallback(() => {
    const list = navListRef.current;
    if (!list) return;

    const activeIndex = navItems.findIndex((item) => isActive(item.href));
    // children[0] is the sliding indicator; nav items start at index 1.
    const targetIndex = activeIndex + 1;

    if (activeIndex !== -1 && list.children[targetIndex]) {
      const activeLi = list.children[targetIndex] as HTMLElement;
      const next = {
        left: activeLi.offsetLeft,
        width: activeLi.offsetWidth,
        opacity: 1,
      };
      setIndicatorStyle((prev) =>
        prev.left === next.left &&
        prev.width === next.width &&
        prev.opacity === next.opacity
          ? prev
          : next,
      );
      return true;
    }

    setIndicatorStyle((prev) =>
      prev.opacity === 0 ? prev : { ...prev, opacity: 0 },
    );
    return false;
  }, [isActive, navItems]);

  // Measure before paint so the underline does not animate in from (0,0) on refresh.
  useLayoutEffect(() => {
    const placed = updateIndicator();
    if (placed && !indicatorReadyRef.current) {
      indicatorReadyRef.current = true;
      // Enable transitions only after the first correct geometry is painted.
      requestAnimationFrame(() => setIndicatorAnimated(true));
    }
  }, [updateIndicator]);

  useLayoutEffect(() => {
    const list = navListRef.current;
    if (!list) return;

    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);

    // Catch icon-font / layout reflows that do not fire window.resize.
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(onResize)
        : null;
    resizeObserver?.observe(list);
    for (const child of Array.from(list.children)) {
      if (child instanceof HTMLElement) {
        resizeObserver?.observe(child);
      }
    }

    return () => {
      window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
    };
  }, [updateIndicator]);

  useEffect(() => {
    if (!menuOpen && !avatarMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const clickedMenu =
          mobileMenuRef.current?.contains(target) ||
          mobileMenuButtonRef.current?.contains(target);
      const clickedAvatar = mobileAvatarRef.current?.contains(target);

      if (!clickedMenu && menuOpen) {
        setMenuOpen(false);
      }

      if (!clickedAvatar && avatarMenuOpen) {
        setAvatarMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [avatarMenuOpen, menuOpen]);

  return (
      <>
        <div
            className={`sticky top-0 w-full z-fixed bg-body md:hidden ${
                scrolled ? "shadow-[0_1px_2px_var(--nav-splitter)]" : ""
            } transition-shadow duration-1000`}
            style={{ zIndex: "var(--z-fixed, 100)" }}
        >
          <div className="container relative flex justify-between items-center h-[calc(var(--header-height)+1.5rem)]">
            <BrandLink
              href={brandHref}
              label={brandLabel}
              logoSrc={brandLogoSrc}
              wikiStyle={brandWikiStyle}
            />

            <div className="flex gap-x-3 items-center">
              <NavAuthSlot
                size={28}
                compactGuest
                hasHydrated={hasHydrated}
                isLoggedIn={isLoggedIn}
                avatarSrc={avatarSrc}
                avatarMenuOpen={avatarMenuOpen}
                onToggleAvatarMenu={() => setAvatarMenuOpen(!avatarMenuOpen)}
                onCloseMenus={handleMenuClose}
                onLogout={logout}
                avatarRef={mobileAvatarRef}
              />

              <div className="w-[1px] h-5 bg-[var(--nav-splitter)] opacity-60"/>

              <button
                  ref={mobileMenuButtonRef}
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
                    ref={mobileMenuRef}
                    className="absolute top-[calc(var(--header-height)+1rem)] right-4 w-40 bg-body shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-xl border border-[var(--nav-splitter)] z-fixed overflow-hidden origin-top-right"
                >
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
            style={{ zIndex: "var(--z-fixed, 100)" }}
        >
          <nav className="container flex justify-between items-center h-[calc(var(--header-height)+1.5rem)] gap-x-4">
            <BrandLink
              href={brandHref}
              label={brandLabel}
              logoSrc={brandLogoSrc}
              wikiStyle={brandWikiStyle}
              bold
            />

            <div className="flex items-center ml-auto">
              <ul className="flex items-center gap-x-2 relative" ref={navListRef}>
                <li
                    className={`absolute bottom-0 h-[3px] bg-first shadow-[0_-2px_10px_var(--first-color)] rounded-t-md pointer-events-none ${
                      indicatorAnimated
                        ? "transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                        : ""
                    }`}
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

              <NavAuthSlot
                size={32}
                hasHydrated={hasHydrated}
                isLoggedIn={isLoggedIn}
                avatarSrc={avatarSrc}
                onCloseMenus={handleMenuClose}
                onLogout={logout}
              />
            </div>
          </nav>
        </header>
      </>
  );
}
