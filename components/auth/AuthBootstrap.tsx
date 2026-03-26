"use client";

import { getMyProfile } from "@/api/me";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useRef } from "react";

export default function AuthBootstrap() {
  const accessToken = useAuthStore((state) => state.access_token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const userId = useAuthStore((state) => state.user?.id);
  const setUser = useAuthStore((state) => state.setUser);
  const requestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      requestKeyRef.current = null;
      return;
    }

    const requestKey = `${accessToken}:${userId ?? "anonymous"}`;
    if (requestKeyRef.current === requestKey) {
      return;
    }

    requestKeyRef.current = requestKey;

    let cancelled = false;

    const syncProfile = async () => {
      try {
        const profile = await getMyProfile();
        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        if (!cancelled) {
          requestKeyRef.current = null;
        }
      }
    };

    void syncProfile();

    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, setUser, userId]);

  return null;
}
