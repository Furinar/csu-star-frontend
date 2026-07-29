export type TabKey =
  | "overview"
  | "resources"
  | "favorites"
  | "evaluations"
  | "notifications";

export type PanelKey =
  | "guest"
  | "profile"
  | "password"
  | "email"
  | "oauth"
  | "points"
  | "invite"
  | "downloads"
  | "feedback"
  | "correction"
  | "contribution";

export const ME_TAB_KEYS: readonly TabKey[] = [
  "overview",
  "resources",
  "favorites",
  "evaluations",
  "notifications",
] as const;

/** Panels that guests may open without forcing the login sheet. */
export const NO_AUTH_REQUIRED_PANELS: readonly PanelKey[] = ["contribution"];
