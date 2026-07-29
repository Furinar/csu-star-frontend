"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getHomeNotificationSummary } from "@/api/me";
import { notificationSocket } from "@/lib/notificationSocket";
import {
  showNotificationToast,
  showUnreadBootstrapToasts,
} from "@/lib/notificationUi";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import type { NotificationItem } from "@/types/me";

const sessionKeyFor = (userId: string | number | null | undefined) =>
  `csu:unread-notified:${userId ?? "anonymous"}`;

export default function NotificationBootstrap() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const userId = useAuthStore((state) => state.user?.id);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const incrementUnread = useNotificationStore(
    (state) => state.incrementUnread,
  );
  const markAllReadLocal = useNotificationStore(
    (state) => state.markAllReadLocal,
  );
  const markReadLocal = useNotificationStore((state) => state.markReadLocal);
  const setConnected = useNotificationStore((state) => state.setConnected);
  const pushRecent = useNotificationStore((state) => state.pushRecent);
  const bootstrappedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!accessToken) {
      notificationSocket.disconnect();
      setConnected(false);
      setUnreadCount(0);
      bootstrappedKeyRef.current = null;
      return;
    }

    notificationSocket.connect(accessToken);
    setConnected(true);

    const openNotifications = () => {
      router.push("/me?tab=notifications");
    };

    const unsubscribe = notificationSocket.subscribe((event) => {
      switch (event.type) {
        case "ready":
          setUnreadCount(Number(event.data?.unread_count ?? 0));
          setConnected(true);
          break;
        case "notification.new": {
          const item = event.data as NotificationItem;
          if (!item?.id) break;
          pushRecent(item);
          if (!item.is_read) {
            incrementUnread(1);
            showNotificationToast(item, openNotifications);
          }
          break;
        }
        case "notification.unread_count":
          setUnreadCount(Number(event.data?.count ?? 0));
          break;
        case "notification.read":
          if (event.data?.id) {
            markReadLocal(String(event.data.id));
          }
          break;
        case "notification.read_all":
          markAllReadLocal();
          break;
        default:
          break;
      }
    });

    const sessionKey = sessionKeyFor(userId);
    const alreadyShown =
      typeof window !== "undefined" &&
      sessionStorage.getItem(sessionKey) === "1";

    if (!alreadyShown && bootstrappedKeyRef.current !== sessionKey) {
      bootstrappedKeyRef.current = sessionKey;
      void (async () => {
        try {
          const summary = await getHomeNotificationSummary();
          const items = [
            ...summary.announcements,
            ...summary.interactions,
            ...summary.system_messages,
          ];
          showUnreadBootstrapToasts(items, openNotifications);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(sessionKey, "1");
          }
        } catch {
          // REST bootstrap is best-effort; WS ready still supplies unread count.
        }
      })();
    }

    return () => {
      unsubscribe();
    };
  }, [
    accessToken,
    hasHydrated,
    userId,
    router,
    setUnreadCount,
    incrementUnread,
    markAllReadLocal,
    markReadLocal,
    setConnected,
    pushRecent,
  ]);

  useEffect(() => {
    return () => {
      notificationSocket.disconnect();
    };
  }, []);

  return null;
}
