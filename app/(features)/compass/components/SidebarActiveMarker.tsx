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

/** 是否被折叠父级的 .items 裁掉（grid 0fr 动画中途高度也会趋近 0） */
function isInsideCollapsedItems(el: HTMLElement): boolean {
  let p: HTMLElement | null = el.parentElement;
  while (p) {
    if (p.classList.contains("items")) {
      const section = p.parentElement;
      if (
        section?.classList.contains("collapsible") &&
        section.classList.contains("collapsed")
      ) {
        return true;
      }
    }
    p = p.parentElement;
  }
  return false;
}

function boxFromItem(container: HTMLElement, item: HTMLElement): MarkerBox {
  const cRect = container.getBoundingClientRect();
  const iRect = item.getBoundingClientRect();
  if (iRect.height < 4 || iRect.width < 4) return HIDDEN;
  const top = iRect.top - cRect.top + 6;
  const height = Math.max(12, iRect.height - 12);
  const left = iRect.left - cRect.left - 17;
  return { top, left, height, visible: true };
}

/**
 * 相对 container 定位当前 .is-active 项的指示条几何。
 * indicator 在 .item 上 left:-17px、上下各缩 6px（与 wiki.css 一致）。
 * 收起二级时 is-active 子项仍在 DOM 但被 0fr 裁切：回退到折叠头 has-active。
 */
function measureActive(container: HTMLElement): MarkerBox {
  const actives = container.querySelectorAll(
    ".VPSidebarItem.is-active > .item",
  );
  for (const node of actives) {
    const item = node as HTMLElement;
    if (isInsideCollapsedItems(item)) continue;
    const box = boxFromItem(container, item);
    if (box.visible) return box;
  }

  // 当前页在已折叠分支内：蓝条钉在可见的折叠头上
  const collapsedHead = container.querySelector(
    ".VPSidebarItem.collapsible.collapsed.has-active > .item",
  ) as HTMLElement | null;
  if (collapsedHead && !isInsideCollapsedItems(collapsedHead)) {
    const box = boxFromItem(container, collapsedHead);
    if (box.visible) return box;
  }

  return HIDDEN;
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

  // 折叠 grid 动画约 0.28s：只量一次会把蓝条钉在旧坐标，需在动画窗口内持续对齐
  useLayoutEffect(() => {
    update();
    let frames = 0;
    let id = 0;
    const tick = () => {
      update();
      frames += 1;
      // ~18 帧 ≈ 300ms@60fps，覆盖 wiki.css 中 grid-template-rows 过渡
      if (frames < 18) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
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

    // 折叠/展开 .items 的 transitionend 再钉一次最终位置
    const onTransitionEnd = (e: TransitionEvent) => {
      if (!(e.target instanceof Element)) return;
      if (!e.target.classList.contains("items")) return;
      if (e.propertyName !== "grid-template-rows" && e.propertyName !== "opacity") {
        return;
      }
      scheduleUpdate();
    };
    root.addEventListener("transitionend", onTransitionEnd);

    const sidebar = root.closest(".VPSidebar");
    const onScroll = () => scheduleUpdate();
    sidebar?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
      root.removeEventListener("transitionend", onTransitionEnd);
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
