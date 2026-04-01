"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getResourceDetail } from "@/api/detail";
import { downloadResourceFile } from "@/api/resource";
import type { ResourceDetail, ResourceFile } from "@/types/detail";
import GlassCard from "@/components/ui/GlassCard";
import Link from "next/link";
import { feedback } from "@/store/useFeedbackStore";

export default function ResourceDetailPage() {
  const params = useParams();
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
  const resourceId = idStr ? parseInt(idStr, 10) : null;

  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!resourceId) return;

    let mounted = true;

    getResourceDetail(resourceId)
      .then((detail) => {
        if (!mounted) return;
        setResource(detail);
      })
      .catch((error) => {
        console.error("Failed to load resource details:", error);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [resourceId]);

  const handleDownload = async (fileId: string, filename: string) => {
    if (!resourceId) return;
    try {
      feedback.info({ title: "正在获取下载链接..." });
      const { url } = await downloadResourceFile(resourceId, fileId);

      // 创建隐藏的a标签触发下载
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      feedback.success({ title: "开始下载" });
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "无法获取下载链接";
      feedback.error({ title: "下载失败", description: msg });
    }
  };

  if (!resourceId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-second">
        无效的资源 ID
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <i className="uil uil-spinner-alt animate-spin text-3xl text-star-500" />
          <span className="text-sm text-second">正在加载资源信息...</span>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center p-8 space-y-4">
        <i className="uil uil-file-block-alt text-6xl text-ice-300" />
        <p className="text-second">资源不存在或已被删除</p>
        <Link href="/resource">
          <button className="px-6 py-2 bg-ice-100 text-first rounded-full hover:bg-ice-200 transition-colors">
            返回资源主页
          </button>
        </Link>
      </div>
    );
  }

  const formatSize = (bytes: number | null | undefined) => {
    if (!bytes) return "未知大小";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <div className="container max-w-4xl mx-auto py-10 space-y-8 mb-20">
      <Link
        href="/resource"
        className="inline-flex items-center text-second hover:text-first transition-colors"
      >
        <i className="uil uil-arrow-left text-xl mr-1" /> 返回
      </Link>

      <GlassCard className="p-8">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-first mb-2">
                {resource.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-second">
                {resource.course?.name && (
                  <span className="inline-flex items-center gap-1 bg-star-50 text-star-600 px-3 py-1 rounded-full font-medium">
                    <i className="uil uil-book-open" /> {resource.course.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <i className="uil uil-eye" /> {resource.views ?? 0} 次浏览
                </span>
                <span className="flex items-center gap-1">
                  <i className="uil uil-download-alt" />{" "}
                  {resource.downloads ?? 0} 次下载
                </span>
                <span>
                  发布于{" "}
                  {resource.created_at
                    ? new Date(resource.created_at).toLocaleDateString()
                    : "未知时间"}
                </span>
              </div>
            </div>
          </div>

          {resource.description && (
            <div className="bg-white/50 rounded-xl p-4 text-first">
              <p className="whitespace-pre-wrap">{resource.description}</p>
            </div>
          )}

          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-ice-100 text-ice-600 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      <h3 className="text-xl font-bold text-first px-2">
        附件列表 ({resource.files?.length || 0})
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {resource.files && resource.files.length > 0 ? (
          resource.files.map((file: ResourceFile) => (
            <GlassCard
              key={file.id}
              className="p-4 flex items-center justify-between hover:border-star-300 transition-colors"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-star-50 text-star-500 flex items-center justify-center text-2xl shrink-0">
                  <i className="uil uil-file-alt" />
                </div>
                <div className="overflow-hidden">
                  <h4
                    className="font-medium text-first truncate"
                    title={file.filename}
                  >
                    {file.filename}
                  </h4>
                  <p className="text-sm text-second mt-0.5">
                    {formatSize(file.size_bytes)}
                  </p>
                </div>
              </div>

              <div className="pl-4 shrink-0">
                <button
                  onClick={() => handleDownload(file.id, file.filename)}
                  className="px-4 py-2 bg-first text-white rounded-full hover:bg-star-600 transition-colors shadow flex items-center gap-2"
                >
                  <i className="uil uil-download-alt" />
                  <span className="hidden sm:inline">下载</span>
                </button>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="p-8 text-center text-second bg-white/30 rounded-2xl border border-white/50">
            暂无附件
          </div>
        )}
      </div>
    </div>
  );
}
