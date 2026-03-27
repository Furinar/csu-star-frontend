"use client";

import UploadResource from "@/app/(features)/resource/components/UploadResource";
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
                const keyword = value.trim();
                if (!keyword) return;
                router.push(`/search?type=resource&q=${encodeURIComponent(keyword)}`);
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
