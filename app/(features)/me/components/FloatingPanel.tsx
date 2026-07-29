"use client";

import type { ReactNode } from "react";
import TDesignFloatingShell from "@/components/ui/TDesignFloatingShell";

export default function FloatingPanel({
  open,
  title,
  description,
  children,
  onClose,
  headerAction,
  /** Prefer a compact width so form inputs don't stretch unnaturally. */
  maxWidth = "28rem",
}: {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  headerAction?: ReactNode;
  maxWidth?: string | number;
}) {
  return (
    <TDesignFloatingShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      headerAction={headerAction}
      zIndex={1000}
      maxWidth={maxWidth}
      className="td-me-floating-panel"
      bodyClassName="px-0 py-1 sm:py-2"
    >
      {children}
    </TDesignFloatingShell>
  );
}
