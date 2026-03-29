"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import EvaluationThread from "@/components/ui/EvaluationThread";
import SectionCard from "@/components/ui/SectionCard";
import {
  createCourseEvaluationReply,
  getCourseDetail,
  listCourseEvaluations,
} from "@/api/detail";
import type { CourseDetail, CourseEvaluation } from "@/types/detail";
import {
  buildResourceCollectionPath,
  buildResourcePath,
  buildTeacherPath,
} from "@/lib/paths";

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

export default function CourseDetailPage() {
  const searchParams = useSearchParams();
  const courseId = Number(searchParams.get("id"));
  const isInvalidCourseId = !Number.isFinite(courseId);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isInvalidCourseId) return;

    let active = true;

    Promise.all([getCourseDetail(courseId), listCourseEvaluations(courseId, 1, 20)])
      .then(([course, evaluationData]) => {
        if (!active) return;
        setDetail(course);
        setEvaluations(evaluationData.items);
      })
      .catch((err) => {
        console.error(err);
        if (!active) return;
        setError("课程详情加载失败，请稍后重试。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId, isInvalidCourseId]);

  const stats = useMemo(
    () => [
      { label: "综合评分", value: formatScore(detail?.avg_score) },
      { label: "收获感", value: formatScore(detail?.avg_gain) },
      { label: "评价数量", value: detail?.eval_count ?? 0 },
      { label: "资源总数", value: detail?.resource_count ?? 0 },
    ],
    [detail],
  );

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
        课程详情加载中...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container mt-10 mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          {error || "课程不存在。"}
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
              <i className="uil uil-graduation-cap"></i>
              课程详情
            </div>
            <div>
              <h1 className="mt-2 text-4xl font-bold text-gray-900">{detail.name}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                这里集中展示课程评分、授课教师、资料入口与课程评价区，作为资源与教师之间的主跳转页面。
              </p>
            </div>
          </div>
          <div className="grid min-w-full grid-cols-2 gap-3 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-sm lg:min-w-[420px]">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-gray-50 px-4 py-3">
                <div className="text-xs text-gray-400">{stat.label}</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionCard
        title="课程导航"
        subtitle="从这里可以跳到授课教师详情与课程资源合集页。"
        action={
          <Link
            href={buildResourceCollectionPath(detail.id)}
            className="rounded-full bg-[var(--first-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            查看课程资源合集
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(detail.teachers ?? []).map((teacher) => (
            <Link
              key={teacher.id}
              href={buildTeacherPath(teacher.id)}
              className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-sm text-gray-400">{teacher.title || "教师详情"}</div>
              <div className="mt-2 text-xl font-semibold text-gray-900">{teacher.name}</div>
              <div className="mt-4 text-sm text-[var(--first-color)]">查看教师详情</div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="关联资料" subtitle="点击资料可进入单个资源详情页，继续查看附件、评论和课程评价入口。">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(detail.resources_preview ?? []).map((resource) => (
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

      <div id="evaluations">
        <EvaluationThread
          title="课程评价区"
          description="一级评价下支持平级二级回复；回复某条回复时，通过 @ 关系表达引用。"
          evaluations={evaluations}
          onReply={(evaluationId, payload) => createCourseEvaluationReply(evaluationId, payload)}
        />
      </div>
    </div>
  );
}
