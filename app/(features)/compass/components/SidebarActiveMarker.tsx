"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

type MarkerBox = {
  top: number;
  left: number;
  height: number;
  visible: boolean;
};

const HIDDEN: MarkerBox = { top: 0, left: 0, height: 18, visible: false };

function boxesEqual(a: MarkerBox, b: MarkerBox): boolean {
  if (a.visible !== b.visible) return false;
  if (!a.visible) return true;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * 相对 container 定位当前 .is-active 项的指示条几何。
 * indicator 在 .item 上 left:-17px、上下各缩 6px（与 wiki.css 一致）。
 */
function measureActive(container: HTMLElement): MarkerBox {
  const item = container.querySelector(
    ".VPSidebarItem.is-active > .item",
  ) as HTMLElement | null;
  if (!item) return HIDDEN;

  const cRect = container.getBoundingClientRect();
  const iRect = item.getBoundingClientRect();
  const top = iRect.top - cRect.top + 6;
  const height = Math.max(12, iRect.height - 12);
  const left = iRect.left - cRect.left - 17;

  return { top, left, height, visible: true };
}

/**
 * 侧栏树外包一层：蓝竖条在一级/二级间贝塞尔滑动。
 * 注意：不得对 marker 自身的 style 做 MutationObserver，否则会反馈环重渲染。
 */
export default function SidebarActiveMarker({
  activeKey,
  layoutKey,
  children,
  className,
}: {
  activeKey: string;
  layoutKey?: string;
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<MarkerBox>(HIDDEN);
  const [box, setBox] = useState<MarkerBox>(HIDDEN);
  const [motionReady, setMotionReady] = useState(false);
  const hadVisible = useRef(false);
  const rafRef = useRef(0);

  const commit = useCallback((next: MarkerBox) => {
    if (boxesEqual(boxRef.current, next)) return;
    boxRef.current = next;
    setBox(next);
    if (next.visible && !hadVisible.current) {
      hadVisible.current = true;
      requestAnimationFrame(() => setMotionReady(true));
    }
  }, []);

  const update = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    commit(measureActive(root));
  }, [commit]);

  /** 合并到一帧，避免 MO/RO/scroll 连打导致整页 jank */
  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      update();
    });
  }, [update]);

  useLayoutEffect(() => {
    update();
  }, [update, activeKey, layoutKey]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ro = new ResizeObserver(() => scheduleUpdate());
    ro.observe(root);

    // 只盯 class / 子树结构（折叠、is-active），绝不盯 style——
    // 否则 marker 自己的 top/left 写入会再次触发 update。
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.target === markerRef.current) continue;
        if (
          r.type === "attributes" &&
          r.target instanceof Element &&
          r.target.closest?.(".sidebar-active-marker")
        ) {
          continue;
        }
        scheduleUpdate();
        return;
      }
    });
    mo.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    const sidebar = root.closest(".VPSidebar");
    const onScroll = () => scheduleUpdate();
    sidebar?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
      sidebar?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate]);

  const style: CSSProperties = {
    top: box.top,
    left: box.left,
    height: box.height,
  };

  return (
    <div
      ref={rootRef}
      className={`sidebar-tree${className ? ` ${className}` : ""}`}
    >
      <div
        ref={markerRef}
        className={`sidebar-active-marker${box.visible ? " is-visible" : ""}${
          motionReady ? " is-motion" : ""
        }`}
        style={style}
        aria-hidden
      />
      {children}
    </div>
  );
}

export function readSidebarActiveBox(
  container: RefObject<HTMLElement | null>,
): MarkerBox {
  const el = container.current;
  if (!el) return HIDDEN;
  return measureActive(el);
}
