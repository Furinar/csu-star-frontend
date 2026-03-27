"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import EvaluationThread from "@/components/ui/EvaluationThread";
import SectionCard from "@/components/ui/SectionCard";
import {
  createTeacherEvaluationReply,
  getTeacherDetail,
  listTeacherEvaluations,
} from "@/api/detail";
import type { TeacherDetail, TeacherEvaluation } from "@/types/detail";
import { buildCoursePath } from "@/lib/paths";

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

export default function TeacherDetailPage() {
  const searchParams = useSearchParams();
  const teacherId = Number(searchParams.get("id"));
  const isInvalidTeacherId = !Number.isFinite(teacherId);
  const [detail, setDetail] = useState<TeacherDetail | null>(null);
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isInvalidTeacherId) return;

    let active = true;

    Promise.all([getTeacherDetail(teacherId), listTeacherEvaluations(teacherId, 1, 20)])
      .then(([teacher, evaluationData]) => {
        if (!active) return;
        setDetail(teacher);
        setEvaluations(evaluationData.items);
      })
      .catch((err) => {
        console.error(err);
        if (!active) return;
        setError("教师详情加载失败，请稍后重试。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isInvalidTeacherId, teacherId]);

  const stats = useMemo(
    () => [
      { label: "综合评分", value: formatScore(detail?.avg_score) },
      { label: "教学质量", value: formatScore(detail?.avg_quality) },
      { label: "评价数量", value: detail?.eval_count ?? 0 },
      { label: "关联资源", value: detail?.resource_count ?? 0 },
    ],
    [detail],
  );

  if (isInvalidTeacherId) {
    return (
      <div className="container mt-10 mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          教师 ID 无效。
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-10 mb-20 flex min-h-[60vh] items-center justify-center text-gray-500">
        教师详情加载中...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container mt-10 mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          {error || "教师不存在。"}
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
              <i className="uil uil-users-alt"></i>
              教师详情
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{detail.name}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                {detail.bio || "暂无教师简介，当前页面聚焦展示授课课程、评价概况与相关内容导航。"}
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

      <SectionCard title="授课课程" subtitle="点击卡片可进入课程详情页，继续查看课程评价与资料。">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(detail.courses ?? []).map((course) => (
            <Link
              key={course.id}
              href={buildCoursePath(course.id)}
              className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-sm text-gray-400">{course.code || "未录入课程代码"}</div>
              <div className="mt-2 text-xl font-semibold text-gray-900">{course.name}</div>
              <div className="mt-4 text-sm text-[var(--first-color)]">查看课程详情</div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <EvaluationThread
        title="教师评价区"
        description="一级评价支持展开/收起二级回复；回复其他二级回复时，仍在同一层级展示。"
        evaluations={evaluations}
        onReply={(evaluationId, payload) => createTeacherEvaluationReply(evaluationId, payload)}
      />
    </div>
  );
}
