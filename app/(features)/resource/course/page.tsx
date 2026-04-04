"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SectionCard from "@/components/ui/SectionCard";
import PageBreadcrumbs from "@/components/ui/PageBreadcrumbs";
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

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(2);
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "未知大小";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CourseResourceCollectionPage() {
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const courseId = Number(
    hasMounted
      ? (searchParams.get("courseId") ?? searchParams.get("course_id"))
      : null,
  );
  const isInvalidCourseId = hasMounted && !Number.isFinite(courseId);
  const [detail, setDetail] = useState<CourseResourceCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (!hasMounted) return;
    if (isInvalidCourseId) {
      return;
    }

    let active = true;

    getCourseResourceCollection(courseId, 1, 24)
      .then((data) => {
        if (!active) return;
        setDetail(data);
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
      <div className="container mt-10 mb-20 flex min-h-[60vh] items-center justify-center text-gray-500">
        课程资源合集加载中...
      </div>
    );
  }

  if (isInvalidCourseId) {
    return (
      <div className="container mt-10 mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          课程 ID 无效。
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-10 mb-20 flex min-h-[60vh] items-center justify-center text-gray-500">
        课程资源合集加载中...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container mt-10 mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          {error || "课程资源合集不存在。"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-10 mb-20 space-y-8">
      <PageBreadcrumbs
        backHref="/resource"
        backLabel="返回资源页"
        items={[
          { label: "资源", href: "/resource" },
          { label: "课程资源合集", href: "/resource" },
          { label: detail.course.name },
        ]}
      />

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
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                这门课收录的资料都集中在这里，课程详情和评价入口保留在顶部，不再单独重复展开。
              </p>
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
              <div className="text-xs text-gray-400">资源总数</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {detail.resource_count}
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">累计下载</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {detail.download_total ?? 0}
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">累计点赞</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {detail.like_total ?? 0}
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">累计收藏</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {detail.favorite_count ?? 0}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="课程资料" subtitle="展示资源文件预览和基础信息。">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {detail.items.items.map((resource) => (
            <Link
              key={resource.id}
              href={buildResourcePath(resource.id)}
              className="group rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-white to-gray-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    {getResourceTypeLabel(resource.resource_type)}
                  </span>
                  <div className="mt-3 text-lg font-semibold text-gray-900 line-clamp-2">
                    {resource.title}
                  </div>
                </div>
                <div className="shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-center min-w-20 flex flex-col items-center justify-center">
                  <div className="text-[11px] text-emerald-600">文件数</div>
                  <div className="mt-1 text-base font-semibold text-emerald-900 leading-none">
                    {resource.file_count ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-100 bg-white/90 p-4">
                {resource.first_file ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 shrink-0 rounded-2xl bg-gray-50 bg-contain bg-center bg-no-repeat"
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

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-1.5 transition-colors">
                  <i className="uil uil-cloud-download text-lg text-blue-500"></i>
                  <span>下载 {resource.downloads ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 transition-colors">
                  <i className="uil uil-eye text-lg text-amber-500"></i>
                  <span>浏览 {resource.views ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 transition-colors">
                  <i className="uil uil-thumbs-up text-lg text-rose-500"></i>
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
      </SectionCard>

      <DetailFloatingActionButton
        label="上传资源"
        tone="resource"
        onClick={() => setIsUploadModalOpen(true)}
      />

      <ResourceUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialCourse={
          detail?.course
            ? { id: detail.course.id, name: detail.course.name }
            : undefined
        }
      />
    </div>
  );
}
