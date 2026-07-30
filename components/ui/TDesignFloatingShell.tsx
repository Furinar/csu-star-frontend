"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog, Drawer } from "tdesign-react";
import { resolveFloatingShellHeader } from "@/lib/tdesignFloatingShellHeader";
import { createPageThemeStyle, getPageTheme } from "@/lib/pageTheme";

const MOBILE_MQ = "(max-width: 767px)";

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export type TDesignFloatingShellProps = {
  open: boolean;
  onClose: () => void;
  /** Optional title shown in the shell header. */
  title?: ReactNode;
  /** Optional description under the title. */
  description?: ReactNode;
  /** Optional badge/chip above or beside the title. */
  badge?: ReactNode;
  /** Extra content on the right of the header (e.g. actions). */
  headerAction?: ReactNode;
  children: ReactNode;
  /** Dialog/Drawer z-index. */
  zIndex?: number;
  /** Prevent closing via overlay / ESC / close button. */
  preventClose?: boolean;
  /** Max width on desktop dialog. */
  maxWidth?: string | number;
  className?: string;
  bodyClassName?: string;
};

/**
 * Shared TDesign overlay shell for floating forms.
 * Desktop: centered Dialog. Mobile: bottom Drawer (sheet-like, scrollable).
 *
 * IMPORTANT: TDesign Dialog only mounts closeBtn inside the header row
 * (`!!header && renderHeader()`). We therefore always pass a truthy header
 * whenever close is allowed so the X control remains available.
 */
export default function TDesignFloatingShell({
  open,
  onClose,
  title,
  description,
  badge,
  headerAction,
  children,
  zIndex = 1150,
  preventClose = false,
  maxWidth = "56rem",
  className,
  bodyClassName,
}: TDesignFloatingShellProps) {
  const isMobile = useIsMobileViewport();
  const pathname = usePathname();
  // Dialog/Drawer attach to body, outside FeatureThemeShell — re-apply page theme
  // so TDesign Input focus/active brand matches the current route accent.
  const themeStyle = useMemo(
    () => createPageThemeStyle(getPageTheme(pathname)),
    [pathname],
  );

  const handleClose = () => {
    if (preventClose) return;
    onClose();
  };

  const headerDecision = resolveFloatingShellHeader({
    preventClose,
    title,
    description,
    badge,
    headerAction,
  });

  const headerNode = headerDecision.showHeader ? (
    <div className="td-floating-shell__header">
      <div className="td-floating-shell__header-main min-w-0">
        {badge ? (
          <div className="td-floating-shell__badge mb-1.5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {badge}
          </div>
        ) : null}
        {title ? (
          <div className="td-floating-shell__title text-lg font-semibold text-slate-900 sm:text-xl">
            {title}
          </div>
        ) : null}
        {description ? (
          <div className="td-floating-shell__description mt-1 text-sm leading-5 text-slate-600 sm:leading-6">
            {description}
          </div>
        ) : null}
        {/* Spacer so closeBtn still has a header row when content is empty */}
        {!title && !description && !badge && !headerAction ? (
          <span className="sr-only">对话框</span>
        ) : null}
      </div>
      {headerAction ? (
        <div className="td-floating-shell__header-action flex shrink-0 items-center gap-3">
          {headerAction}
        </div>
      ) : null}
    </div>
  ) : (
    false
  );

  const body = (
    <div
      className={[
        "td-floating-shell__body modal-scrollbar",
        bodyClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        visible={open}
        onClose={handleClose}
        placement="bottom"
        size="auto"
        zIndex={zIndex}
        header={headerNode}
        footer={null}
        closeBtn={!preventClose}
        closeOnOverlayClick={!preventClose}
        destroyOnClose
        showOverlay
        style={themeStyle}
        className={["td-floating-shell", "td-floating-shell--mobile", className]
          .filter(Boolean)
          .join(" ")}
      >
        {body}
      </Drawer>
    );
  }

  return (
    <Dialog
      visible={open}
      onClose={handleClose}
      placement="center"
      mode="modal"
      width={maxWidth}
      zIndex={zIndex}
      header={headerNode}
      footer={null}
      closeBtn={!preventClose}
      closeOnEscKeydown={!preventClose}
      closeOnOverlayClick={!preventClose}
      destroyOnClose
      attach="body"
      style={themeStyle}
      dialogClassName={[
        "td-floating-shell",
        "td-floating-shell--desktop",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {body}
    </Dialog>
  );
}
