"use client";

import ResourceUploaderModal from "@/app/(features)/resource/components/ResourceUploaderModal";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import SearchLandingSection from "@/app/(features)/search/components/SearchLandingSection";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import SearchBar from "@/components/ui/SearchBar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SupplementRequestModal from "@/components/supplement/SupplementRequestModal";
import SupplementRequestPrompt from "@/components/supplement/SupplementRequestPrompt";
import { useAuthStore } from "@/store/useAuthStore";
import { requireAuthAction } from "@/lib/requireAuthAction";

export default function Resource() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSupplementModalOpen, setIsSupplementModalOpen] = useState(false);

  const handleOpenSupplementModal = () => {
    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能提交课程补录申请。",
      })
    ) {
      return;
    }

    setIsSupplementModalOpen(true);
  };

  const handleOpenUploadModal = () => {
    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能上传资源。",
      })
    ) {
      return;
    }

    setIsUploadModalOpen(true);
  };

  return (
    <>
      <div className="container max-w-5xl mx-auto py-12 space-y-12 mt-10">
        <div>
          <SearchBar
            placeholder="搜索资源所属的课程..."
            onSearch={(value) => {
              const searchHref = buildSearchPageHref(value, "resource");

              if (!searchHref) return;

              router.push(searchHref);
            }}
          />
        </div>

        <SearchLandingSection
          type="resource"
          title="资源列表"
          description="按课程查找大家上传的学习资料和文件。"
          size={24}
          action={
            <SupplementRequestPrompt
              onClick={handleOpenSupplementModal}
              align="right"
              variant="course"
            />
          }
        />
      </div>

      <DetailFloatingActionButton
        label="上传资源"
        tone="resource"
        onClick={handleOpenUploadModal}
      />

      <ResourceUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      <SupplementRequestModal
        isOpen={isSupplementModalOpen}
        onClose={() => setIsSupplementModalOpen(false)}
        initialRequestType="course"
      />
    </>
  );
}
