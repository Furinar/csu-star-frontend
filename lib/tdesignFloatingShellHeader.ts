/**
 * Pure header policy for TDesignFloatingShell.
 *
 * TDesign Dialog only renders `closeBtn` inside the header row:
 *   `!!header && renderHeader()`  (see tdesign-react DialogCard)
 * So whenever close is allowed we MUST pass a truthy header, even if the
 * caller did not supply a title — otherwise desktop users lose the X button.
 */

export type FloatingShellHeaderInput = {
  preventClose?: boolean;
  title?: unknown;
  description?: unknown;
  badge?: unknown;
  headerAction?: unknown;
};

export type FloatingShellHeaderDecision = {
  /** Whether Dialog/Drawer should receive a truthy `header` prop. */
  showHeader: boolean;
  /** Whether the shell should request the native close button. */
  showCloseBtn: boolean;
  /** Whether any human-readable header content was provided. */
  hasContent: boolean;
};

function hasRenderable(value: unknown): boolean {
  if (value == null || value === false) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function resolveFloatingShellHeader(
  input: FloatingShellHeaderInput,
): FloatingShellHeaderDecision {
  const showCloseBtn = !input.preventClose;
  const hasContent =
    hasRenderable(input.title) ||
    hasRenderable(input.description) ||
    hasRenderable(input.badge) ||
    hasRenderable(input.headerAction);

  // Always show header when close is allowed so TDesign mounts closeBtn.
  const showHeader = showCloseBtn || hasContent;

  return { showHeader, showCloseBtn, hasContent };
}
