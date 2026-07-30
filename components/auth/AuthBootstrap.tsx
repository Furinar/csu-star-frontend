"use client";

import { getMyProfile } from "@/api/me";
import { applyPersistedAuthSync, useAuthStore } from "@/store/useAuthStore";
import { useEffect, useLayoutEffect, useRef } from "react";

export default function AuthBootstrap() {
  const accessToken = useAuthStore((state) => state.access_token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const userId = useAuthStore((state) => state.user?.id);
  const setUser = useAuthStore((state) => state.setUser);
  const requestKeyRef = useRef<string | null>(null);

  // 1) Sync apply localStorage in layout effect (no await) so auth UI paints
  //    before the browser flush — without diverging SSR/CSR first render.
  // 2) Then let zustand persist rehydrate for middleware bookkeeping.
  useLayoutEffect(() => {
    applyPersistedAuthSync();
    void useAuthStore.persist.rehydrate();
  }, []);

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
        if (cancelled) return;
        // Skip setState when profile is unchanged to avoid avatar img remount flash.
        const current = useAuthStore.getState().user;
        if (
          current &&
          current.id === profile.id &&
          current.avatar_url === profile.avatar_url &&
          current.nickname === profile.nickname &&
          current.points === profile.points &&
          current.email_verified === profile.email_verified
        ) {
          return;
        }
        setUser(profile);
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
