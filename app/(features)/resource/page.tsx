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
import { requireVerifiedCampusAction } from "@/lib/requireVerifiedCampusAction";

export default function Resource() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const user = useAuthStore((state) => state.user);
  const canUpload = Boolean(accessToken) && Boolean(user?.email_verified);
  const uploadDisabledTooltip = !accessToken
    ? "登录后才能上传资源"
    : "完成校园邮箱验证后才能上传资源";
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
      !requireVerifiedCampusAction({
        isSignedIn: Boolean(accessToken),
        user,
        router,
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
          <p className="mt-3 text-sm text-slate-500">
            本站资源仅供学习交流，禁止二次倒卖等商业行为。如有侵权内容，请及时举报，我们将尽快下架处理。
          </p>
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
