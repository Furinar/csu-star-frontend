"use client";

import ResourceUploaderModal from "@/app/(features)/resource/components/ResourceUploaderModal";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import SearchLandingSection from "@/app/(features)/search/components/SearchLandingSection";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import SearchBar from "@/components/ui/SearchBar";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Resource() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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

        <div></div>

        <SearchLandingSection
          type="resource"
          title="资源列表"
          description="页面底部直接展示资源搜索结果，来自搜索接口的空关键词请求。"
          size={24}
        />
      </div>

      <DetailFloatingActionButton
        label="上传资源"
        tone="resource"
        onClick={() => setIsUploadModalOpen(true)}
      />

      <ResourceUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </>
  );
}
