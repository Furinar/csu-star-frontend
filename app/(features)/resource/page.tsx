"use client";

import ResourceUploader from "@/app/(features)/resource/components/ResourceUploader";
import SearchLandingSection from "@/app/(features)/search/components/SearchLandingSection";
import {buildSearchPageHref} from "@/app/(features)/search/searchNavigation";
import SearchBar from "@/components/ui/SearchBar";
import {useRouter} from "next/navigation";

export default function Resource() {
  const router = useRouter();

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

          <div>
            <ResourceUploader/>
          </div>

          <SearchLandingSection
              type="resource"
              title="资源列表"
              description="页面底部直接展示资源搜索结果，来自搜索接口的空关键词请求。"
          />
        </div>
      </>
  );
}
