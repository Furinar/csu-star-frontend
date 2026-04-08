export type FeedbackTone = "success" | "error" | "info" | "warning";

export interface FeedbackOptions {
  title: string;
  description?: string;
  type?: FeedbackTone;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface FeedbackToast extends FeedbackOptions {
  id: string;
  type: FeedbackTone;
  duration: number;
  createdAt: number;
}
