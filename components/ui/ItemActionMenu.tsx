"use client";

import { useEffect, useRef, useState } from "react";

export interface ItemActionMenuItem {
  key: string;
  label: string;
  destructive?: boolean;
  onClick: () => void | Promise<void>;
}

export default function ItemActionMenu({
  items,
  align = "right",
}: {
  items: ItemActionMenuItem[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
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
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <i className="uil uil-ellipsis-h text-lg" />
      </button>
      {open ? (
        <div
          className={`absolute top-9 z-20 min-w-[132px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.14)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={async () => {
                setOpen(false);
                await item.onClick();
              }}
              className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                item.destructive
                  ? "text-rose-600 hover:bg-rose-50"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
