import { create } from "zustand";
import type { NotificationItem } from "@/types/me";

interface NotificationState {
  unreadCount: number;
  connected: boolean;
  lastEventAt: number | null;
  setUnreadCount: (count: number) => void;
  incrementUnread: (delta?: number) => void;
  markAllReadLocal: () => void;
  markReadLocal: (id: string) => void;
  setConnected: (connected: boolean) => void;
  pushRecent: (item: NotificationItem) => void;
  recent: NotificationItem[];
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  connected: false,
  lastEventAt: null,
  recent: [],
  setUnreadCount: (count) =>
    set({
      unreadCount: Math.max(0, count),
      lastEventAt: Date.now(),
    }),
  incrementUnread: (delta = 1) =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount + delta),
      lastEventAt: Date.now(),
    })),
  markAllReadLocal: () =>
    set({
      unreadCount: 0,
      lastEventAt: Date.now(),
    }),
  markReadLocal: (_id) =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
      lastEventAt: Date.now(),
    })),
  setConnected: (connected) => set({ connected }),
  pushRecent: (item) =>
    set((state) => ({
      recent: [item, ...state.recent].slice(0, 30),
      lastEventAt: Date.now(),
    })),
}));
