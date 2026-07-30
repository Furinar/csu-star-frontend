import { feedback } from "@/store/useFeedbackStore";
import type { NotificationItem } from "@/types/me";

const MAX_BOOTSTRAP_TOASTS = 5;

/**
 * Only keep on-screen until user closes for pinned announcements.
 * Audit results / ordinary site pushes should auto-dismiss with leave animation.
 */
export function isPersistentNotification(item: NotificationItem): boolean {
  return item.category === "announcement" && Boolean(item.is_pinned);
}

export function resolveNotificationTone(
  item: NotificationItem,
): "success" | "error" | "info" | "warning" {
  const isApprovedModerationResult =
    item.type === "system" &&
    item.result === "approved" &&
    (item.category === "report" ||
      item.category === "correction" ||
      item.category === "feedback" ||
      item.category === "supplement");
  const isRejectedModerationResult =
    item.type === "system" &&
    item.result === "rejected" &&
    (item.category === "report" ||
      item.category === "correction" ||
      item.category === "feedback" ||
      item.category === "supplement");

  if (isRejectedModerationResult) return "error";
  if (isApprovedModerationResult) return "success";
  return "info";
}

export function showNotificationToast(
  item: NotificationItem,
  onOpen?: () => void,
) {
  // Already-read system noise (e.g. points deduction) should not interrupt UX.
  if (item.is_read) {
    return;
  }

  const tone = resolveNotificationTone(item);
  // Moderation / site toasts: a bit longer than default so users can read + click action.
  const duration = isPersistentNotification(item) ? 0 : 6000;

  feedback.notify({
    title: item.title,
    description: item.content || "你有一条新的站内消息。",
    type: tone,
    duration,
    ...(onOpen
      ? {
          actionLabel:
            item.category === "announcement" ? "查看公告" : "查看通知",
          onAction: onOpen,
        }
      : {}),
  });
}

export function showUnreadBootstrapToasts(
  items: NotificationItem[],
  onOpen?: () => void,
) {
  const unread = items.filter((item) => !item.is_read);
  if (unread.length === 0) {
    return;
  }

  if (unread.length > MAX_BOOTSTRAP_TOASTS) {
    feedback.notify({
      title: `你有 ${unread.length} 条未读通知`,
      description: "可在通知中心查看全部。",
      type: "info",
      duration: 6000,
      ...(onOpen
        ? { actionLabel: "查看通知", onAction: onOpen }
        : {}),
    });
    unread.slice(0, 2).forEach((item) => showNotificationToast(item, onOpen));
    return;
  }

  unread.forEach((item) => showNotificationToast(item, onOpen));
}
