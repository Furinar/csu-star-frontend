"use client";

import ResourceUploaderModal from "@/app/(features)/resource/components/ResourceUploaderModal";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import SearchLandingSection from "@/app/(features)/search/components/SearchLandingSection";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import SearchBar from "@/components/ui/SearchBar";
import { getPageTheme } from "@/lib/pageTheme";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Resource() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const resourceTheme = getPageTheme("/resource");

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

        <section className="relative overflow-hidden rounded-[36px] border border-[var(--page-accent-border)] bg-white px-8 py-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="absolute -left-10 top-4 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: resourceTheme.blobColors[0] }}></div>
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full blur-3xl" style={{ backgroundColor: resourceTheme.blobColors[2] }}></div>
          <div className="relative flex flex-col gap-3">
            <div className="inline-flex w-fit rounded-full border border-[var(--page-accent-border)] bg-[var(--page-accent-soft)] px-4 py-2 text-sm font-medium text-[var(--page-accent-text)]">
              课程资源合集
            </div>
            <h2 className="hero-gradient-text text-3xl font-extrabold">
              绿色主题下快速整理和查找课程资料
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              搜索课程即可进入资源合集，上传入口、列表浏览和后续评论发布都统一采用资源页主题色，不再复用全站紫色。
            </p>
          </div>
        </section>

        <SearchLandingSection
          type="resource"
          title="资源列表"
          description="按课程查找大家上传的学习资料和文件。"
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
