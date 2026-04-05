"use client";

import { getMyProfile, listMyNotifications } from "@/api/me";
import { feedback } from "@/store/useFeedbackStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useRef } from "react";

export default function AuthBootstrap() {
  const accessToken = useAuthStore((state) => state.access_token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const userId = useAuthStore((state) => state.user?.id);
  const setUser = useAuthStore((state) => state.setUser);
  const requestKeyRef = useRef<string | null>(null);
  const seenSystemNotificationIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      requestKeyRef.current = null;
      seenSystemNotificationIdsRef.current = new Set();
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

  useEffect(() => {
    if (!hasHydrated || !accessToken) {
      seenSystemNotificationIdsRef.current = new Set();
      return;
    }

    let cancelled = false;

    const syncNotifications = async (shouldNotify: boolean) => {
      try {
        const data = await listMyNotifications({ page: 1, size: 20 });
        if (cancelled) {
          return;
        }

        const systemItems = data.items.filter((item) => item.type === "system");
        const seen = seenSystemNotificationIdsRef.current;

        if (shouldNotify) {
          for (const item of systemItems) {
            if (item.is_read || seen.has(item.id)) {
              continue;
            }
            feedback.info({
              title: item.title,
              description: item.content || "你有一条新的系统公告。",
            });
          }
        }

        seenSystemNotificationIdsRef.current = new Set(
          systemItems.map((item) => item.id),
        );
      } catch {
        return;
      }
    };

    void syncNotifications(false);

    const intervalId = window.setInterval(() => {
      void syncNotifications(true);
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [accessToken, hasHydrated]);

  return null;
}
