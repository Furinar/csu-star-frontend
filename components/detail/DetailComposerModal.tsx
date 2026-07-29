"use client";

import type { ReactNode } from "react";
import TDesignFloatingShell from "@/components/ui/TDesignFloatingShell";

const toneMap = {
  course: {},
  teacher: {},
  resource: {},
} as const;

export default function DetailComposerModal({
  isOpen,
  onClose,
  // accent retained for API compatibility with existing callers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  accent,
  badge,
  title,
  description,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  accent: keyof typeof toneMap;
  badge: ReactNode;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <TDesignFloatingShell
      open={isOpen}
      onClose={onClose}
      badge={badge}
      title={title}
      description={description}
      zIndex={1150}
      maxWidth="56rem"
      className="td-detail-composer-modal"
      bodyClassName="px-1 py-1 sm:px-2 sm:py-2"
    >
      {children}
    </TDesignFloatingShell>
  );
}
