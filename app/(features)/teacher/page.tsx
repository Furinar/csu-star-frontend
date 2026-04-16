"use client";
import { useState } from "react";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import SearchLandingSection from "@/app/(features)/search/components/SearchLandingSection";
import SearchBar from "@/components/ui/SearchBar";
import TeacherSlider from "./components/TeacherSlider";
import { useRouter } from "next/navigation";
import SupplementRequestModal from "@/components/supplement/SupplementRequestModal";
import SupplementRequestPrompt from "@/components/supplement/SupplementRequestPrompt";
import { useAuthStore } from "@/store/useAuthStore";
import { requireAuthAction } from "@/lib/requireAuthAction";

export default function Teacher() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const [isSupplementModalOpen, setIsSupplementModalOpen] = useState(false);

  const handleOpenSupplementModal = () => {
    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能提交教师补录申请。",
      })
    ) {
      return;
    }

    setIsSupplementModalOpen(true);
  };

  return (
    <>
      <div className="container flex flex-col gap-10 mt-10 mb-20">
        <div>
          <SearchBar
            placeholder="搜索教师..."
            onSearch={(value) => {
              const searchHref = buildSearchPageHref(value, "teacher");

              if (!searchHref) return;

              router.push(searchHref);
            }}
          />
        </div>

        <TeacherSlider />

        <SearchLandingSection
          type="teacher"
          title="教师列表"
          description="继续浏览教师信息，结合评价和风格找到更适合你的课堂。"
          action={
            <SupplementRequestPrompt
              onClick={handleOpenSupplementModal}
              align="right"
              variant="teacher"
            />
          }
        />
      </div>

      <SupplementRequestModal
        isOpen={isSupplementModalOpen}
        onClose={() => setIsSupplementModalOpen(false)}
        initialRequestType="teacher"
      />
    </>
  );
}
