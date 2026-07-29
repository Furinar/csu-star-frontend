"use client";
import { useState } from "react";
import { buildSearchPageHref } from "@/app/(features)/search/searchNavigation";
import SearchLandingSection from "@/app/(features)/search/components/SearchLandingSection";
import SearchBar from "@/components/ui/SearchBar";
import { useRouter } from "next/navigation";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import SupplementRequestModal from "@/components/supplement/SupplementRequestModal";
import SupplementRequestPrompt from "@/components/supplement/SupplementRequestPrompt";
import { useAuthStore } from "@/store/useAuthStore";
import { requireAuthAction } from "@/lib/requireAuthAction";
import CourseGlobalEvaluationModal from "./components/CourseGlobalEvaluationModal";

export default function Course() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
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

  const handleOpenComposer = () => {
    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能发表课程评价。",
      })
    ) {
      return;
    }

    setIsComposerOpen(true);
  };

  return (
    <>
      <div className="container mt-6 mb-12 flex flex-col gap-6 md:mt-10 md:mb-20 md:gap-10">
        <div>
          <SearchBar
            placeholder="搜索课程..."
            onSearch={(value) => {
              const searchHref = buildSearchPageHref(value, "course");

              if (!searchHref) return;

              router.push(searchHref);
            }}
          />
        </div>

        <SearchLandingSection
          type="course"
          title="课程列表"
          description="在这里浏览更多课程，看看不同同学留下的真实反馈。"
          action={
            <SupplementRequestPrompt
              onClick={handleOpenSupplementModal}
              align="right"
              variant="course"
            />
          }
        />
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-[100] overflow-hidden">
        <div className="absolute bottom-8 right-8 pointer-events-auto">
          <DetailFloatingActionButton
            label="写评价"
            tone="course"
            onClick={handleOpenComposer}
          />
        </div>
      </div>

      <CourseGlobalEvaluationModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
      />

      <SupplementRequestModal
        isOpen={isSupplementModalOpen}
        onClose={() => setIsSupplementModalOpen(false)}
        initialRequestType="course"
      />
    </>
  );
}
