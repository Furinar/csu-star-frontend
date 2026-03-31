"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SectionCard from "@/components/ui/SectionCard";
import { getCourseResourceCollection } from "@/api/detail";
import type { CourseResourceCollection } from "@/types/detail";
import { buildCourseEvaluationAnchor, buildCoursePath, buildResourcePath } from "@/lib/paths";

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

export default function CourseResourceCollectionPage() {
  const searchParams = useSearchParams();
  const courseId = Number(searchParams.get("courseId") || searchParams.get("course_id"));
  const isInvalidCourseId = !Number.isFinite(courseId);
  const [detail, setDetail] = useState<CourseResourceCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isInvalidCourseId) return;

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
  }, [courseId, isInvalidCourseId]);

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
      <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-gradient-to-br from-white via-[var(--star-50)] to-[var(--ice-50)] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--first-color)]/10 blur-3xl"></div>
        <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl"></div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-[var(--first-color)] shadow-sm">
              <i className="uil uil-folder-open"></i>
              课程资源合集
            </div>
            <div>
              <div className="text-sm text-gray-400">{"课程信息"}</div>
              <h1 className="mt-2 text-4xl font-bold text-gray-900">{detail.course.name}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                这门课收录的资料都集中在这里，课程详情和评价入口保留在顶部，不再单独重复展开。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={buildCoursePath(detail.course.id)}
                className="rounded-full border border-[var(--first-color)]/20 bg-white px-4 py-2 text-sm font-medium text-[var(--first-color)] transition hover:bg-[var(--first-color)]/5"
              >
                进入课程详情
              </Link>
              <Link
                href={buildCourseEvaluationAnchor(detail.course.id)}
                className="rounded-full bg-[var(--first-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                跳转课程评价区
              </Link>
            </div>
          </div>
          <div className="grid min-w-full grid-cols-2 gap-3 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-sm lg:min-w-[420px]">
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">资源总数</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{detail.resource_count}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">累计下载</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{detail.download_total ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">累计点赞</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{detail.like_total ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">热度</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{formatScore(detail.hot_score)}</div>
            </div>
          </div>
        </div>
      </section>

      <SectionCard
        title="课程资料"
        subtitle="按资源卡片继续进入单个资料详情。"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {detail.items.items.map((resource) => (
            <Link
              key={resource.id}
              href={buildResourcePath(resource.id)}
              className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {resource.resource_type || "资料"}
                </span>
                <span className="text-xs text-gray-400">下载 {resource.downloads ?? 0}</span>
              </div>
              <div className="mt-3 text-lg font-semibold text-gray-900">{resource.title}</div>
              <div className="mt-4 text-sm text-[var(--first-color)]">查看资源详情</div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
