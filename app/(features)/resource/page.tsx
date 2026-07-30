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
  const canUpload = Boolean(accessToken);
  const uploadDisabledTooltip = "登录后才能上传资源";
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
      <div className="container mt-6 mb-12 flex flex-col gap-6 md:mt-10 md:mb-20 md:gap-10">
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
          description={
            <>
              本站资源仅供学习交流，禁止二次倒卖等商业行为。
              <br />
              如有侵权内容，请及时举报，我们将尽快下架处理。
            </>
          }
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
        disabled={!canUpload}
        disabledTooltip={uploadDisabledTooltip}
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
