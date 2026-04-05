"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ResourceUploader, { ResourceUploaderProps } from "./ResourceUploader";
import { requireAuthAction } from "@/lib/requireAuthAction";
import { useAuthStore } from "@/store/useAuthStore";

export interface ResourceUploaderModalProps extends ResourceUploaderProps {
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

  useEffect(() => {
    if (!isOpen) return;

    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能上传资源。",
      })
    ) {
      onClose();
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      // Prevent closing if we are typing in an input
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [accessToken, isOpen, onClose, router]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-scrollbar max-h-[90vh] overflow-y-auto p-6 md:p-8">
          <ResourceUploader
            isModal
            onClose={onClose}
            initialCourse={initialCourse}
            onUploadSuccess={onUploadSuccess}
          />
        </div>
      </div>
    </div>
  );
}
