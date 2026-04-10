import { create } from "zustand";
import type { FeedbackOptions, FeedbackToast, FeedbackTone } from "@/types/feedback";

const DEFAULT_FEEDBACK_DURATION = 5000;

interface FeedbackState {
  toasts: FeedbackToast[];
  push: (options: FeedbackOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

type FeedbackInput = string | FeedbackOptions;

const createFeedbackId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeInput = (
  input: FeedbackInput,
  fallbackType: FeedbackTone = "info",
): FeedbackOptions => {
  if (typeof input === "string") {
    return {
      title: input,
      type: fallbackType,
    };
  }

  return {
    ...input,
    type: input.type ?? fallbackType,
  };
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  toasts: [],
  push: (options) => {
    const toast: FeedbackToast = {
      id: createFeedbackId(),
      title: options.title,
      description: options.description,
      actionLabel: options.actionLabel,
      onAction: options.onAction,
      dismissOnAction: options.dismissOnAction,
      type: options.type ?? "info",
      duration: options.duration ?? DEFAULT_FEEDBACK_DURATION,
      createdAt: Date.now(),
    };

    set((state) => ({
      toasts: [toast, ...state.toasts],
    }));

    return toast.id;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}));

export const feedback = {
  show: (input: FeedbackInput) =>
    useFeedbackStore.getState().push(normalizeInput(input)),
  showToast: (input: FeedbackInput) =>
    useFeedbackStore.getState().push(normalizeInput(input)),
  success: (input: FeedbackInput) =>
    useFeedbackStore.getState().push(normalizeInput(input, "success")),
  error: (input: FeedbackInput) =>
    useFeedbackStore.getState().push(normalizeInput(input, "error")),
  warning: (input: FeedbackInput) =>
    useFeedbackStore.getState().push(normalizeInput(input, "warning")),
  info: (input: FeedbackInput) =>
    useFeedbackStore.getState().push(normalizeInput(input, "info")),
  dismiss: (id: string) => useFeedbackStore.getState().dismiss(id),
  clear: () => useFeedbackStore.getState().clear(),
};
