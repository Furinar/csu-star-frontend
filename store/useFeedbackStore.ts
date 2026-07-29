import { createElement } from "react";
import type {
  FeedbackChannel,
  FeedbackOptions,
  FeedbackTone,
} from "@/types/feedback";

type FeedbackInput = string | FeedbackOptions;

const DEFAULT_MESSAGE_DURATION = 3000;
const DEFAULT_NOTIFICATION_DURATION = 4500;
/** Longer than this → prefer Notification so multi-line body is readable. */
const LONG_BODY_THRESHOLD = 48;
/** Match CSS leave animation in utilities.css */
const NOTIFY_LEAVE_MS = 280;

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

const toneToTheme = (
  type: FeedbackTone,
): "success" | "error" | "warning" | "info" => {
  switch (type) {
    case "success":
      return "success";
    case "error":
      return "error";
    case "warning":
      return "warning";
    default:
      return "info";
  }
};

/**
 * Site nav height is `calc(var(--header-height) + 1.5rem)` (see BaseNav).
 * Keep both surfaces below the nav with a small gap.
 */
const MESSAGE_OFFSET: [string | number, string | number] = [
  0,
  "calc(var(--header-height, 3rem) + 1.5rem - 20px)",
];
const NOTIFICATION_OFFSET: [string | number, string | number] = [
  "-16px",
  "calc(var(--header-height, 3rem) + 1.5rem + 12px)",
];

type TDesignPlugins = typeof import("tdesign-react");
type NotificationInstance = { close: () => void };

let pluginsPromise: Promise<TDesignPlugins> | null = null;
let pluginsConfigured = false;

const loadPlugins = () => {
  if (!pluginsPromise) {
    pluginsPromise = import("tdesign-react").then((plugins) => {
      if (!pluginsConfigured) {
        pluginsConfigured = true;
        plugins.MessagePlugin.config({
          offset: MESSAGE_OFFSET,
        });
        plugins.NotificationPlugin.config({
          placement: "top-right",
          offset: NOTIFICATION_OFFSET,
        });
      }
      return plugins;
    });
  }
  return pluginsPromise;
};

/**
 * Pick TDesign surface:
 * - Message: short operation result
 * - Notification: system/site notice, actions, persistent, or long body
 */
const resolveChannel = (
  options: FeedbackOptions,
  preferred: FeedbackChannel,
): "message" | "notification" => {
  // Actions only render on Notification footer — never drop them for Message.
  if (options.actionLabel || options.onAction) {
    return "notification";
  }

  if (preferred === "message" || preferred === "notification") {
    return preferred;
  }

  // Persistent feedback is easier to read as a card with close button.
  if (options.duration === 0) {
    return "notification";
  }

  const body = options.description?.trim() ?? "";
  if (body.length >= LONG_BODY_THRESHOLD) {
    return "notification";
  }

  return "message";
};

const formatMessageContent = (options: FeedbackOptions): string => {
  const title = options.title.trim();
  const description = options.description?.trim();
  if (!description) return title;
  if (description.startsWith(title) || title.startsWith(description)) {
    return description.length >= title.length ? description : title;
  }
  return `${title}：${description}`;
};

const showMessage = (
  options: FeedbackOptions,
  plugins: TDesignPlugins,
): string => {
  const theme = toneToTheme(options.type ?? "info");
  const duration =
    options.duration === 0
      ? 0
      : (options.duration ?? DEFAULT_MESSAGE_DURATION);

  plugins.MessagePlugin[theme]({
    content: formatMessageContent(options),
    duration,
    closeBtn: duration === 0,
    offset: MESSAGE_OFFSET,
  });

  return `msg-${Date.now()}`;
};

const notifyTokenClass = (token: string) => `csu-feedback-notify--${token}`;

const findNotifyElement = (token: string): HTMLElement | null => {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(
    `.t-notification.${notifyTokenClass(token)}`,
  );
};

/**
 * TDesign Notification only has enter animation and removes nodes immediately.
 * Play a leave animation first, then close the plugin instance.
 */
const dismissNotificationAnimated = (
  NotificationPlugin: TDesignPlugins["NotificationPlugin"],
  instancePromise: Promise<NotificationInstance>,
  token: string,
) => {
  const el = findNotifyElement(token);
  if (!el || el.dataset.csuLeaving === "1") {
    void NotificationPlugin.close(instancePromise);
    return;
  }

  el.dataset.csuLeaving = "1";
  el.classList.add("csu-feedback-notify--leaving");
  window.setTimeout(() => {
    void NotificationPlugin.close(instancePromise);
  }, NOTIFY_LEAVE_MS);
};

const showNotification = (
  options: FeedbackOptions,
  plugins: TDesignPlugins,
): string => {
  const { NotificationPlugin, Button } = plugins;
  const theme = toneToTheme(options.type ?? "info");
  // 0 = stay until user closes; otherwise auto-hide (we own the timer so we can animate leave).
  const autoDismissMs =
    options.duration === 0
      ? 0
      : (options.duration ?? DEFAULT_NOTIFICATION_DURATION);

  const dismissOnAction = options.dismissOnAction !== false;
  const actionLabel = options.actionLabel?.trim();
  const hasFooterAction = Boolean(actionLabel && options.onAction);
  const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const tokenClass = notifyTokenClass(token);

  const requestDismiss = () => {
    dismissNotificationAnimated(NotificationPlugin, instancePromise, token);
  };

  // duration: 0 → we own dismiss so leave animation can run first.
  // closeBtn: true → official top-right slot (do not put × inside title).
  const instancePromise = NotificationPlugin[theme]({
    title: options.title,
    content: options.description,
    duration: 0,
    closeBtn: true,
    placement: "top-right",
    offset: NOTIFICATION_OFFSET,
    // Runtime supports className even if plugin option types omit it.
    ...({
      className: `csu-feedback-notify ${tokenClass}`,
    } as object),
    footer: hasFooterAction
      ? createElement(
          "div",
          { className: "csu-feedback-notify__footer" },
          createElement(
            Button,
            {
              size: "small",
              theme: "primary",
              variant: "text",
              onClick: (event: { stopPropagation?: () => void }) => {
                event.stopPropagation?.();
                options.onAction?.();
                if (dismissOnAction) {
                  requestDismiss();
                }
              },
            },
            actionLabel,
          ),
        )
      : undefined,
  });

  // Tag DOM + intercept stock close (capture) so leave animation is not skipped.
  void instancePromise.then(() => {
    let el = findNotifyElement(token);
    if (!el) {
      const all = document.querySelectorAll<HTMLElement>(".t-notification");
      el = all[all.length - 1] ?? null;
    }
    if (!el) return;

    el.classList.add("csu-feedback-notify", tokenClass);

    const closeEl = el.querySelector<HTMLElement>(
      ".t-icon-close, .t-notification__close, .t-notification-close",
    );
    if (!closeEl || closeEl.dataset.csuCloseBound === "1") return;
    closeEl.dataset.csuCloseBound = "1";
    closeEl.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        requestDismiss();
      },
      true,
    );
  });

  if (autoDismissMs > 0) {
    window.setTimeout(() => {
      dismissNotificationAnimated(NotificationPlugin, instancePromise, token);
    }, autoDismissMs);
  }

  return `notify-${token}`;
};

const present = (
  options: FeedbackOptions,
  /**
   * Caller-forced channel. `notify()` passes `"notification"`.
   * Tone helpers leave this as `"auto"` and honor `options.channel` when set.
   */
  forced: FeedbackChannel = "auto",
): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const preferred: FeedbackChannel =
    forced !== "auto" ? forced : (options.channel ?? "auto");
  const channel = resolveChannel(options, preferred);

  void loadPlugins().then((plugins) => {
    if (channel === "notification") {
      showNotification(options, plugins);
    } else {
      showMessage(options, plugins);
    }
  });

  return channel === "notification"
    ? `notify-${Date.now()}`
    : `msg-${Date.now()}`;
};

/**
 * Global feedback facade (TDesign):
 * - tone helpers → Message by default; auto-upgrade to Notification when needed
 * - notify → always Notification (site / system messages)
 */
export const feedback = {
  show: (input: FeedbackInput) => present(normalizeInput(input)),
  showToast: (input: FeedbackInput) => present(normalizeInput(input)),
  success: (input: FeedbackInput) =>
    present(normalizeInput(input, "success")),
  error: (input: FeedbackInput) => present(normalizeInput(input, "error")),
  warning: (input: FeedbackInput) =>
    present(normalizeInput(input, "warning")),
  info: (input: FeedbackInput) => present(normalizeInput(input, "info")),
  /** Always Notification — for inbox/system pushes, announcements, etc. */
  notify: (input: FeedbackInput) =>
    present(normalizeInput(input, "info"), "notification"),
  dismiss: (_id?: string) => {
    void loadPlugins().then(({ MessagePlugin, NotificationPlugin }) => {
      MessagePlugin.closeAll();
      // Animate each card out before hard-clear for a smoother bulk dismiss.
      const nodes = document.querySelectorAll<HTMLElement>(
        ".t-notification.csu-feedback-notify:not(.csu-feedback-notify--leaving)",
      );
      if (nodes.length === 0) {
        NotificationPlugin.closeAll();
        return;
      }
      nodes.forEach((el) => {
        el.dataset.csuLeaving = "1";
        el.classList.add("csu-feedback-notify--leaving");
      });
      window.setTimeout(() => {
        NotificationPlugin.closeAll();
      }, NOTIFY_LEAVE_MS);
    });
  },
  clear: () => {
    feedback.dismiss();
  },
};

/** @deprecated Prefer `feedback.*`. Kept for any residual imports. */
export const useFeedbackStore = {
  getState: () => ({
    toasts: [] as never[],
    push: (options: FeedbackOptions) => present(options),
    dismiss: feedback.dismiss,
    clear: feedback.clear,
  }),
};
