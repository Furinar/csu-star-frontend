"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ItemActionMenuItem {
  key: string;
  label: string;
  destructive?: boolean;
  onClick: () => void | Promise<void>;
}

const MENU_GAP = 6;
const VIEWPORT_PAD = 8;
const ESTIMATED_ITEM_HEIGHT = 36;
const MENU_CHROME = 10;
const ESTIMATED_MENU_WIDTH = 128;

export default function ItemActionMenu({
  items,
  align = "right",
  trigger,
  triggerClassName,
}: {
  items: ItemActionMenuItem[];
  align?: "left" | "right";
  trigger?: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({
    top: 0,
    left: 0,
    visibility: "hidden",
  });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      const triggerElement = triggerRef.current;
      const menuEl = menuRef.current;
      if (!triggerElement) return;

      const rect = triggerElement.getBoundingClientRect();
      const menuHeight =
        menuEl?.offsetHeight ||
        items.length * ESTIMATED_ITEM_HEIGHT + MENU_CHROME;
      const menuWidth = menuEl?.offsetWidth || ESTIMATED_MENU_WIDTH;

      const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PAD;
      const spaceAbove = rect.top - VIEWPORT_PAD;
      const openUp =
        spaceBelow < menuHeight + MENU_GAP && spaceAbove > spaceBelow;

      let top = openUp
        ? rect.top - menuHeight - MENU_GAP
        : rect.bottom + MENU_GAP;
      top = Math.max(
        VIEWPORT_PAD,
        Math.min(top, window.innerHeight - menuHeight - VIEWPORT_PAD),
      );

      // Horizontal: pin to trigger. Right-align = menu's right edge == trigger's right edge
      // (so the panel sits under the "…" instead of drifting left).
      let left =
        align === "right" ? rect.right - menuWidth : rect.left;

      const maxLeft = window.innerWidth - menuWidth - VIEWPORT_PAD;
      left = Math.max(VIEWPORT_PAD, Math.min(left, maxLeft));

      setMenuStyle({
        top,
        left,
        right: "auto",
        visibility: "visible",
      });
    };

    // First pass (may use estimates), then remeasure real size after layout.
    updateMenuPosition();
    const raf1 = window.requestAnimationFrame(() => {
      updateMenuPosition();
      window.requestAnimationFrame(updateMenuPosition);
    });

    const handleViewportChange = () => updateMenuPosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [align, items.length, open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          triggerClassName ??
          (trigger
            ? "block rounded-md"
            : "flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600")
        }
      >
        {trigger ?? <i className="uil uil-ellipsis-h text-lg" />}
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[120] min-w-[128px] rounded-lg border border-slate-200 bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
              style={menuStyle}
            >
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={async () => {
                    setOpen(false);
                    await item.onClick();
                  }}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition ${
                    item.destructive
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
