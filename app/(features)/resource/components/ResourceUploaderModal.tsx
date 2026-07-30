"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TDesignFloatingShell from "@/components/ui/TDesignFloatingShell";
import ResourceUploader, { ResourceUploaderProps } from "./ResourceUploader";
import { useAuthStore } from "@/store/useAuthStore";

import { requireAuthAction } from "@/lib/requireAuthAction";
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
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能上传资源。",
      })
    ) {
      onClose();
      return;
    }
  }, [accessToken, isOpen, onClose, router, user]);

  return (
    <TDesignFloatingShell
      open={isOpen}
      onClose={() => {
        if (!isUploading) onClose();
      }}
      title="上传资源"
      description="绑定课程、填写标题并添加文件即可发布。"
      preventClose={isUploading}
      zIndex={1100}
      maxWidth="48rem"
      className="td-resource-uploader-modal"
      bodyClassName="px-0 py-0"
    >
      <ResourceUploader
        isModal
        onClose={() => {
          if (!isUploading) onClose();
        }}
        initialCourse={initialCourse}
        onUploadSuccess={onUploadSuccess}
        onUploadingChange={setIsUploading}
      />
    </TDesignFloatingShell>
  );
}
