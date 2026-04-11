"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import SectionCard from "@/components/ui/SectionCard";
import {useHasMounted} from "@/hooks/useHasMounted";
import {getCourseResourceCollection} from "@/api/detail";
import type {CourseResourceCollection} from "@/types/detail";
import {getResourceTypeLabel} from "@/app/(features)/me/components/shared/helpers";
import {buildCoursePath, buildResourcePath,} from "@/lib/paths";
import DetailFloatingActionButton from "@/components/detail/DetailFloatingActionButton";
import ResourceUploaderModal from "../components/ResourceUploaderModal";
import {getFileIcon} from "../detail/fileIcons";
import {useAuthStore} from "@/store/useAuthStore";
import {requireVerifiedCampusAction} from "@/lib/requireVerifiedCampusAction";

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "未知大小";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CourseResourceCollectionPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const user = useAuthStore((state) => state.user);
  const canUpload = Boolean(accessToken) && Boolean(user?.email_verified);
  const uploadDisabledTooltip = !accessToken
      ? "登录后才能上传资源"
      : "完成校园邮箱验证后才能上传资源";
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
  const statCards = [
    {
      label: "资源总数",
      mobileLabel: "资源",
      value: detail?.resource_count ?? 0,
      icon: "uil-file-alt",
      iconClassName: "text-emerald-500",
      panelClassName: "from-emerald-50 to-white",
    },
    {
      label: "累计下载",
      mobileLabel: "下载",
      value: detail?.download_total ?? 0,
      icon: "uil-cloud-download",
      iconClassName: "text-sky-500",
      panelClassName: "from-sky-50 to-white",
    },
    {
      label: "累计点赞",
      mobileLabel: "点赞",
      value: detail?.like_total ?? 0,
      icon: "uil-thumbs-up",
      iconClassName: "text-rose-500",
      panelClassName: "from-rose-50 to-white",
    },
    {
      label: "累计收藏",
      mobileLabel: "收藏",
      value: detail?.favorite_count ?? 0,
      icon: "uil-bookmark",
      iconClassName: "text-amber-500",
      panelClassName: "from-amber-50 to-white",
    },
  ];

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
        <div
            className="container mt-4 mb-10 md:mt-10 md:mb-20 flex min-h-[60vh] items-center justify-center text-gray-500">
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
        <div
            className="container mt-4 mb-10 md:mt-10 md:mb-20 flex min-h-[60vh] items-center justify-center text-gray-500">
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
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-emerald-700 transition hover:opacity-80 cursor-pointer"
        >
          <i className="uil uil-arrow-left text-base"/>
          返回上一页
        </button>

        <section
            className="relative overflow-hidden rounded-[24px] border border-emerald-100/80 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.08)] md:rounded-[36px] md:p-8 md:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div
              className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-200/55 blur-3xl md:-right-10 md:-top-10 md:h-40 md:w-40"></div>
          <div
              className="absolute -bottom-8 left-8 h-28 w-28 rounded-full bg-cyan-200/40 blur-3xl md:-bottom-10 md:left-10 md:h-40 md:w-40"></div>
          <div className="relative flex items-stretch gap-3 md:gap-6 lg:items-end lg:justify-between">
            <div
                className="flex min-w-0 flex-1 flex-col justify-between rounded-[22px] bg-white/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm md:justify-start md:space-y-4 md:self-start md:rounded-[30px] md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
              <div className="space-y-3 md:space-y-4">
                <div>
                  <div className="text-[11px] font-medium tracking-[0.18em] text-gray-400 md:text-sm">
                    资源合集信息
                  </div>
                  <h1 className="mt-1.5 line-clamp-2 pr-1 text-xl font-bold leading-tight text-gray-900 md:mt-2 md:text-4xl">
                    {detail.course.name}
                  </h1>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:gap-3">
                <Link
                    href={buildCoursePath(detail.course.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/95 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 md:px-4 md:py-2 md:text-sm"
                >
                  <i className="uil uil-arrow-up-right text-sm"/>
                  课程详情
                </Link>
              </div>
            </div>
            <div
                className="grid min-w-0 flex-1 grid-cols-2 gap-2 rounded-[22px] border border-white/80 bg-white/78 p-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm md:w-auto md:min-w-[320px] md:flex-none md:gap-3 md:rounded-[28px] md:p-4 lg:min-w-[420px]">
              {statCards.map((stat) => (
                  <div
                      key={stat.label}
                      className={`rounded-[14px] border border-white/80 bg-gradient-to-br ${stat.panelClassName} px-2.5 py-2 shadow-sm md:rounded-2xl md:px-4 md:py-3`}
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-1 md:items-start md:gap-2">
                      <div className="text-[11px] font-medium text-gray-500 md:hidden">
                        {stat.mobileLabel}
                      </div>
                      <div className="hidden text-xs font-medium text-gray-500 md:block">
                        {stat.label}
                      </div>
                      <div className="flex items-center justify-center gap-1 md:justify-start md:gap-2">
                        <i className={`uil ${stat.icon} text-base ${stat.iconClassName} md:text-base`}></i>
                        <div className="text-sm font-semibold leading-none text-gray-900 md:text-lg">
                          {stat.value}
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
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
                    <span
                        className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs text-gray-600">
                      {getResourceTypeLabel(resource.resource_type)}
                    </span>
                          <div className="mt-1.5 md:mt-3 text-sm md:text-lg font-semibold text-gray-900 line-clamp-2">
                            {resource.title}
                          </div>
                          {resource.description?.trim() ? (
                              <p
                                  className="mt-1 md:mt-2 line-clamp-2 overflow-hidden text-[11px] md:text-sm leading-snug md:leading-5 text-gray-500"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitBoxOrient: "vertical",
                                    WebkitLineClamp: 2,
                                  }}
                              >
                                {resource.description.trim()}
                              </p>
                          ) : null}
                        </div>
                        <div
                            className="shrink-0 rounded-xl md:rounded-2xl border border-emerald-100 bg-emerald-50/80 px-2 py-1 md:px-3 md:py-2 text-center min-w-16 md:min-w-20 flex flex-col items-center justify-center">
                          <div className="text-[11px] text-emerald-600">文件数</div>
                          <div className="mt-1 text-base font-semibold text-emerald-900 leading-none">
                            {resource.file_count ?? 0}
                          </div>
                        </div>
                      </div>

                      <div
                          className="mt-2 md:mt-4 rounded-xl md:rounded-2xl border border-gray-100 bg-white/90 p-2 md:p-4">
                        {resource.first_file ? (
                            <div className="flex items-center gap-3">
                              <div
                                  className="h-8 w-8 md:h-12 md:w-12 shrink-0 rounded-lg md:rounded-2xl bg-gray-50 bg-contain bg-center bg-no-repeat"
                                  style={{backgroundImage: `url(${getFileIcon(resource.first_file.filename)})`}}
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

                      <div
                          className="mt-2 md:mt-4 flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-sm font-medium text-slate-600">
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

                      <div
                          className="mt-4 text-sm font-medium text-[var(--first-color)] group-hover:translate-x-0.5 transition">
                        查看资源详情
                      </div>
                    </Link>
                ))}
              </div>
          ) : (
              <div
                  className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center text-sm text-gray-500">
                当前课程暂无可查看详情的资源。
              </div>
          )}
        </SectionCard>

        <DetailFloatingActionButton
            label="上传资源"
            tone="resource"
            onClick={handleOpenUploadModal}
            disabled={!canUpload}
            disabledTooltip={uploadDisabledTooltip}
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
                  ? {id: detail.course.id, name: detail.course.name}
                  : undefined
            }
            onUploadSuccess={() => setShouldRefreshAfterUpload(true)}
        />
      </div>
  );
}
