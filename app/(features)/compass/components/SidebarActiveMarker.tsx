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

/**
 * 相对 container 定位当前 .is-active 项的指示条几何。
 * indicator 在 .item 上 left:-17px、上下各缩 6px（与 wiki.css 一致）。
 */
function measureActive(
  container: HTMLElement,
): MarkerBox {
  const item = container.querySelector(
    ".VPSidebarItem.is-active > .item",
  ) as HTMLElement | null;
  if (!item) return HIDDEN;

  const cRect = container.getBoundingClientRect();
  const iRect = item.getBoundingClientRect();
  const top = iRect.top - cRect.top + 6;
  const height = Math.max(12, iRect.height - 12);
  // 与 .indicator { left: -17px; width: 2px } 对齐灰线
  const left = iRect.left - cRect.left - 17;

  return { top, left, height, visible: true };
}

/**
 * 侧栏树外包一层：在一级↔一级、二级↔二级切换时，
 * 蓝竖条沿贝塞尔曲线滑动（非整页滑动的 outline-marker 语义，
 * 但用同一套 top/left transition）。
 */
export default function SidebarActiveMarker({
  activeKey,
  layoutKey,
  children,
  className,
}: {
  /** 当前激活文档 id/slug，变化时重测 */
  activeKey: string;
  /** 折叠展开等布局变化时重测（如 openGroups 序列化） */
  layoutKey?: string;
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<MarkerBox>(HIDDEN);
  /** 首次定位不播动画，避免从 (0,0) 飞入 */
  const [motionReady, setMotionReady] = useState(false);
  const hadVisible = useRef(false);

  const update = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const next = measureActive(root);
    setBox(next);
    if (next.visible) {
      if (!hadVisible.current) {
        // 下一帧再开 transition
        requestAnimationFrame(() => setMotionReady(true));
      }
      hadVisible.current = true;
    }
  }, []);

  useLayoutEffect(() => {
    update();
  }, [update, activeKey, layoutKey]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ro = new ResizeObserver(() => update());
    ro.observe(root);

    // 子项高度/折叠变化
    const mo = new MutationObserver(() => update());
    mo.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    const sidebar = root.closest(".VPSidebar");
    const onScroll = () => update();
    sidebar?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
      sidebar?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [update]);

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

/** 供外部在 ref 容器上自管 marker 时复用测量（可选） */
export function readSidebarActiveBox(
  container: RefObject<HTMLElement | null>,
): MarkerBox {
  const el = container.current;
  if (!el) return HIDDEN;
  return measureActive(el);
}
