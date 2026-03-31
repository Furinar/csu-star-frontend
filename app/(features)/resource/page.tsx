"use client";

import UploadResource from "@/app/(features)/resource/components/UploadResource";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import SearchBar from "@/components/ui/SearchBar";
import { useRouter } from "next/navigation";

export default function Resource() {
  const router = useRouter();

  return (
      <>
        <div className="container flex flex-col gap-10 mt-10">
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
            <UploadResource/>
          </div>
        </div>
      </>
  );
}
