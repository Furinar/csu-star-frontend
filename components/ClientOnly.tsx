"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const emptySubscribe = () => () => {};

export default function ClientOnly({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  if (!isClient) return null;
  return <>{children}</>;
}
