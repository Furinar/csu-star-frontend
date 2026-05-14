"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FloatingCloseButton from "@/components/ui/FloatingCloseButton";
import ResourceUploader, { ResourceUploaderProps } from "./ResourceUploader";
import { useAuthStore } from "@/store/useAuthStore";
import { requireVerifiedCampusAction } from "@/lib/requireVerifiedCampusAction";

export interface ResourceUploaderModalProps extends Omit<
  ResourceUploaderProps,
  "isUploading"
> {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResourceUploaderModal({
  isOpen,
  onClose,
  initialCourse,
  onUploadSuccess,
}: ResourceUploaderModalProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const user = useAuthStore((state) => state.user);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (
      !requireVerifiedCampusAction({
        isSignedIn: Boolean(accessToken),
        user,
        router,
      })
    ) {
      onClose();
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      // Prevent closing if we are typing in an input
      if (e.key === "Escape" && !isUploading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [accessToken, isOpen, onClose, router, user, isUploading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] bg-slate-950/25 backdrop-blur-sm"
      onClick={() => {
        if (!isUploading) onClose();
      }}
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => {
          if (!isUploading) onClose();
        }}
        aria-label="关闭上传资源弹层"
      />
      <div
        className="relative mx-auto flex min-h-full items-end justify-center p-2 pb-safe sm:p-3 md:items-center md:p-6 overflow-y-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-[calc(100dvh-1rem)] w-full max-w-4xl overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.18)] sm:max-h-[calc(100dvh-1.5rem)] md:max-h-[calc(100dvh-3rem)] md:rounded-[32px]">
          <FloatingCloseButton
            onClick={() => {
              if (!isUploading) onClose();
            }}
            ariaLabel="关闭上传资源弹层"
            disabled={isUploading}
          />
          <div className="modal-scrollbar max-h-[calc(100dvh-1rem)] overflow-x-hidden overflow-y-hidden px-4 pb-4 pt-14 sm:max-h-[calc(100dvh-1.5rem)] sm:px-5 sm:pb-5 sm:pt-16 md:max-h-[calc(100dvh-3rem)] md:overflow-y-hidden md:px-8 md:pb-8">
            <ResourceUploader
              isModal
              onClose={() => {
                if (!isUploading) onClose();
              }}
              initialCourse={initialCourse}
              onUploadSuccess={onUploadSuccess}
              onUploadingChange={setIsUploading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
