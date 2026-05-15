"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ItemActionMenuItem {
  key: string;
  label: string;
  destructive?: boolean;
  onClick: () => void | Promise<void>;
}

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
  const [menuStyle, setMenuStyle] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      const triggerElement = triggerRef.current;
      if (!triggerElement) return;

      const rect = triggerElement.getBoundingClientRect();
      const nextTop = rect.bottom + 8;

      if (align === "right") {
        setMenuStyle({
          top: nextTop,
          right: window.innerWidth - rect.right,
        });
        return;
      }

      setMenuStyle({
        top: nextTop,
        left: rect.left,
      });
    };

    updateMenuPosition();

    const handleViewportChange = () => updateMenuPosition();

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [align, open]);

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
            ? "block rounded-full"
            : "flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600")
        }
      >
        {trigger ?? <i className="uil uil-ellipsis-h text-lg" />}
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[120] min-w-[132px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.14)]"
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
                  className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-sm transition md:py-2 ${
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
