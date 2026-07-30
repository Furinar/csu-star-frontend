"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Badge } from "tdesign-react";
import type { TabKey } from "./shared/types";

export interface MeTabBarProps {
  activeTab: TabKey;
  unreadCount: number;
  resourcesTotal: number;
  favoritesTotal: number;
  evaluationsTotal: number;
  onTabChange: (tab: TabKey) => void;
}

type TabItem = {
  key: TabKey;
  label: string;
  /** When set, may render TDesign Badge (absolute) so count changes don't reflow the tab. */
  count?: number;
  /** Always show badge (notifications). Other tabs only show badge while active. */
  badgeAlways?: boolean;
  /** Emphasize unread-style counts (notifications). */
  tone?: "default" | "danger";
};

type IndicatorStyle = {
  left: number;
  width: number;
  opacity: number;
};

export default function MeTabBar({
  activeTab,
  unreadCount,
  resourcesTotal,
  favoritesTotal,
  evaluationsTotal,
  onTabChange,
}: MeTabBarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<TabKey, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const tabs: TabItem[] = [
    { key: "overview", label: "概览" },
    {
      key: "notifications",
      label: "通知与公告",
      count: unreadCount,
      badgeAlways: true,
      tone: "danger",
    },
    {
      key: "resources",
      label: "我的资源",
      count: resourcesTotal,
    },
    {
      key: "favorites",
      label: "收藏夹",
      count: favoritesTotal,
    },
    {
      key: "evaluations",
      label: "我的评价",
      count: evaluationsTotal,
    },
  ];

  const setTabRef = useCallback((key: TabKey, node: HTMLButtonElement | null) => {
    if (node) {
      tabRefs.current.set(key, node);
    } else {
      tabRefs.current.delete(key);
    }
  }, []);

  const updateIndicator = useCallback(() => {
    const list = listRef.current;
    const activeEl = tabRefs.current.get(activeTab);
    if (!list || !activeEl) {
      setIndicator((prev) => (prev.opacity === 0 ? prev : { ...prev, opacity: 0 }));
      return;
    }

    // Position relative to the scrollable tab strip (not the viewport).
    const next = {
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      opacity: 1,
    };
    setIndicator((prev) =>
      prev.left === next.left &&
      prev.width === next.width &&
      prev.opacity === next.opacity
        ? prev
        : next,
    );
  }, [activeTab]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(onResize)
        : null;
    resizeObserver?.observe(list);
    for (const el of tabRefs.current.values()) {
      resizeObserver?.observe(el);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      resizeObserver?.disconnect();
    };
  }, [updateIndicator, tabs.length]);

  return (
    <div
      ref={listRef}
      className="relative mb-4 flex min-h-[2.5rem] gap-1 overflow-x-auto border-b border-slate-200 hide-scrollbar md:mb-6 md:min-h-[2.75rem] md:gap-1.5"
    >
      {/* Sliding underline — left/width transition so active border moves smoothly */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 z-10 h-0.5 bg-first transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.opacity,
        }}
      />

      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const label = (
          <span className="relative z-10 tracking-wide">{tab.label}</span>
        );

        // Keep Badge shell + reserved pr for every counted tab so active/hidden
        // count never reflows tab width (avoids underline / strip jitter).
        const hasBadgeSlot = typeof tab.count === "number";
        const showCount =
          hasBadgeSlot && (tab.badgeAlways || isActive) ? tab.count! : 0;

        const content = hasBadgeSlot ? (
          <Badge
            count={showCount}
            size="small"
            maxCount={99}
            showZero={false}
            shape="round"
            color={tab.tone === "danger" ? undefined : "#94a3b8"}
            offset={[2, -2]}
            className="me-tab-badge"
          >
            <span className="inline-block pr-2.5">{label}</span>
          </Badge>
        ) : (
          label
        );

        return (
          <button
            key={tab.key}
            ref={(node) => setTabRef(tab.key, node)}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`relative flex shrink-0 items-center whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors duration-200 md:px-4 md:py-2 ${
              isActive
                ? "text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
