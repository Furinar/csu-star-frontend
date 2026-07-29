export type FeedbackTone = "success" | "error" | "info" | "warning";

/**
 * Which TDesign surface to use.
 * - message: light action feedback (top center) — short, auto-dismiss
 * - notification: richer site/system notice (top right) — title + body, optional action
 * - auto: pick notification when action / persistent / long body, else message
 */
export type FeedbackChannel = "auto" | "message" | "notification";

export interface FeedbackOptions {
  title: string;
  description?: string;
  type?: FeedbackTone;
  /** ms; 0 = stay until closed */
  duration?: number;
  /**
   * Force channel. Default `auto` for tone helpers; `notify()` always uses notification.
   */
  channel?: FeedbackChannel;
  /** Shown as Notification footer button (requires notification channel). */
  actionLabel?: string;
  onAction?: () => void;
  /** Close notification after action click. Default true. */
  dismissOnAction?: boolean;
}

export interface FeedbackToast extends FeedbackOptions {
  id: string;
  type: FeedbackTone;
  duration: number;
  createdAt: number;
}
