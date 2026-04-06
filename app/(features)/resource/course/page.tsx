"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SectionCard from "@/components/ui/SectionCard";
import { useHasMounted } from "@/hooks/useHasMounted";
import { getCourseResourceCollection } from "@/api/detail";
import type { CourseResourceCollection } from "@/types/detail";
import { getResourceTypeLabel } from "@/app/(features)/me/components/shared/helpers";
import {
  buildCoursePath,
  buildResourcePath,
} from "@/lib/paths";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import ResourceUploaderModal from "../components/ResourceUploaderModal";
import { getFileIcon } from "../detail/fileIcons";
import { useAuthStore } from "@/store/useAuthStore";
import { requireAuthAction } from "@/lib/requireAuthAction";

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "未知大小";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CourseResourceCollectionPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const courseId = hasMounted
    ? (searchParams.get("courseId") ?? searchParams.get("course_id"))
    : null;
  const isInvalidCourseId = hasMounted && !courseId;
  const [detail, setDetail] = useState<CourseResourceCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [shouldRefreshAfterUpload, setShouldRefreshAfterUpload] = useState(false);
  const resourcesWithDetail =
    detail?.items.items.filter((resource) => Boolean(resource.detail_path?.trim())) ?? [];

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

  const loadCollectionDetail = async (targetCourseId: string) => {
    const data = await getCourseResourceCollection(targetCourseId, 1, 24);
    setDetail(data);
    setError("");
  };

  useEffect(() => {
    if (!hasMounted) return;
    if (isInvalidCourseId) {
      return;
    }
    if (!courseId) {
      return;
    }

    let active = true;

    getCourseResourceCollection(courseId, 1, 24)
      .then((data) => {
        if (!active) return;
        setDetail(data);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        if (!active) return;
        setError("课程资源合集加载失败，请稍后重试。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId, hasMounted, isInvalidCourseId]);

  if (!hasMounted) {
    return (
      <div className="container mt-4 mb-10 md:mt-10 md:mb-20 flex min-h-[60vh] items-center justify-center text-gray-500">
        课程资源合集加载中...
      </div>
    );
  }

  if (isInvalidCourseId) {
    return (
      <div className="container mt-4 mb-10 md:mt-10 md:mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          课程 ID 无效。
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-4 mb-10 md:mt-10 md:mb-20 flex min-h-[60vh] items-center justify-center text-gray-500">
        课程资源合集加载中...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container mt-4 mb-10 md:mt-10 md:mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          {error || "课程资源合集不存在。"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-10 space-y-4 md:mt-10 md:mb-20 md:space-y-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-emerald-700 transition hover:opacity-80"
      >
        <i className="uil uil-arrow-left text-base" />
        返回上一页
      </button>

      <section className="relative overflow-hidden rounded-[36px] border border-emerald-100/80 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/55 blur-3xl"></div>
        <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl"></div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/85 px-4 py-2 text-sm text-emerald-700 shadow-sm">
              <i className="uil uil-folder-open"></i>
              课程资源合集
            </div>
            <div>
              <div className="text-sm text-gray-400">{"课程信息"}</div>
              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                {detail.course.name}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={buildCoursePath(detail.course.id)}
                className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
              >
                进入课程详情
              </Link>
            </div>
          </div>
          <div className="grid min-w-full grid-cols-2 gap-3 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-sm lg:min-w-[420px]">
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <i className="uil uil-file-alt text-base text-emerald-500"></i>
                <span>资源总数</span>
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {detail.resource_count}
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <i className="uil uil-cloud-download text-base text-blue-500"></i>
                <span>累计下载</span>
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {detail.download_total ?? 0}
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <i className="uil uil-thumbs-up text-base text-rose-500"></i>
                <span>累计点赞</span>
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {detail.like_total ?? 0}
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <i className="uil uil-bookmark text-base text-emerald-500"></i>
                <span>累计收藏</span>
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {detail.favorite_count ?? 0}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="课程资料" subtitle="展示资源文件预览和基础信息。">
        {resourcesWithDetail.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {resourcesWithDetail.map((resource) => (
              <Link
                key={resource.id}
                href={resource.detail_path ?? buildResourcePath(resource.id)}
                className="group rounded-2xl md:rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-white to-gray-50 p-3 md:p-5 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-1.5 md:gap-3 flex-row">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs text-gray-600">
                      {getResourceTypeLabel(resource.resource_type)}
                    </span>
                    <div className="mt-1.5 md:mt-3 text-sm md:text-lg font-semibold text-gray-900 line-clamp-2">
                      {resource.title}
                    </div>
                    <p
                      className="mt-1 md:mt-2 line-clamp-2 overflow-hidden text-[11px] md:text-sm leading-snug md:leading-5 text-gray-500"
                      style={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {resource.description?.trim() || "暂无资源说明。"}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl md:rounded-2xl border border-emerald-100 bg-emerald-50/80 px-2 py-1 md:px-3 md:py-2 text-center min-w-16 md:min-w-20 flex flex-col items-center justify-center">
                    <div className="text-[11px] text-emerald-600">文件数</div>
                    <div className="mt-1 text-base font-semibold text-emerald-900 leading-none">
                      {resource.file_count ?? 0}
                    </div>
                  </div>
                </div>

                <div className="mt-2 md:mt-4 rounded-xl md:rounded-2xl border border-gray-100 bg-white/90 p-2 md:p-4">
                  {resource.first_file ? (
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 md:h-12 md:w-12 shrink-0 rounded-lg md:rounded-2xl bg-gray-50 bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${getFileIcon(resource.first_file.filename)})` }}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-medium text-gray-800"
                          title={resource.first_file.filename}
                        >
                          {resource.first_file.filename}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {formatFileSize(resource.first_file.size_bytes)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-12 items-center text-sm text-gray-400">
                      暂无文件预览
                    </div>
                  )}
                </div>

                <div className="mt-2 md:mt-4 flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-sm font-medium text-slate-600">
                  <div className="flex items-center gap-1.5 transition-colors">
                    <i className="uil uil-cloud-download text-base md:text-lg text-blue-500"></i>
                    <span>下载 {resource.downloads ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-colors">
                    <i className="uil uil-eye text-base md:text-lg text-amber-500"></i>
                    <span>浏览 {resource.views ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-colors">
                    <i className="uil uil-thumbs-up text-base md:text-lg text-rose-500"></i>
                    <span>点赞 {resource.likes ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-colors">
                    <i className="uil uil-bookmark text-lg text-emerald-500"></i>
                    <span>收藏 {resource.favorite_count ?? 0}</span>
                  </div>
                </div>

                <div className="mt-4 text-sm font-medium text-[var(--first-color)] group-hover:translate-x-0.5 transition">
                  查看资源详情
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center text-sm text-gray-500">
            当前课程暂无可查看详情的资源。
          </div>
        )}
      </SectionCard>

      <DetailFloatingActionButton
        label="上传资源"
        tone="resource"
        onClick={handleOpenUploadModal}
      />

      <ResourceUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          if (!shouldRefreshAfterUpload || !courseId) return;
          setLoading(true);
          loadCollectionDetail(courseId)
            .catch((err) => {
              console.error(err);
              setError("课程资源合集加载失败，请稍后重试。");
            })
            .finally(() => {
              setLoading(false);
              setShouldRefreshAfterUpload(false);
            });
        }}
        initialCourse={
          detail?.course
            ? { id: detail.course.id, name: detail.course.name }
            : undefined
        }
        onUploadSuccess={() => setShouldRefreshAfterUpload(true)}
      />
    </div>
  );
}
