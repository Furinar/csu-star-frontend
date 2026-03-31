"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DetailEvaluationSection from "@/components/detail/DetailEvaluationSection";
import RatingBar from "@/components/ui/RatingBar";
import {
  createTeacherEvaluation,
  createTeacherEvaluationReply,
  getTeacherDetail,
  listTeacherEvaluations,
} from "@/api/detail";
import type {
  TeacherDetail,
  TeacherEvaluation,
  TeacherEvaluationInput,
} from "@/types/detail";
import { buildCoursePath } from "@/lib/paths";

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

function getSafeScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value;
}

export default function TeacherDetailPage() {
  const searchParams = useSearchParams();
  const teacherId = Number(searchParams.get("id"));
  const isInvalidTeacherId = !Number.isFinite(teacherId);
  const [detail, setDetail] = useState<TeacherDetail | null>(null);
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
  const [evaluationTotal, setEvaluationTotal] = useState(0);
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
        setEvaluationTotal(evaluationData.total);
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
      <section className="relative overflow-hidden rounded-[40px] border border-white/60 bg-[linear-gradient(140deg,rgba(255,255,255,0.94)_0%,rgba(239,246,255,0.92)_48%,rgba(244,240,255,0.9)_100%)] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-9">
        <div className="absolute -left-8 top-6 h-48 w-48 rounded-full bg-sky-300/30 blur-3xl animate-blob"></div>
        <div className="absolute -right-8 bottom-0 h-56 w-56 rounded-full bg-indigo-300/28 blur-3xl animate-blob animation-delay-2000"></div>

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-4 py-2 text-sm font-medium text-[var(--first-color)] shadow-sm">
              <i className="uil uil-user-square"></i>
              教师详情
            </div>

            <div className="mt-5 flex items-center gap-4">
              {detail.avatar_url ? (
                <img
                  src={detail.avatar_url}
                  alt={detail.name}
                  className="h-20 w-20 rounded-full border border-white/70 object-cover shadow-md"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/70 bg-white/80 text-3xl text-[var(--first-color)] shadow-md">
                  <i className="uil uil-user"></i>
                </div>
              )}
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
                  {detail.name}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detail.title ? (
                    <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                      {detail.title}
                    </span>
                  ) : null}
                  {detail.department_name ? (
                    <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                      {detail.department_name}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-600 md:text-base">
              {detail.bio || "当前页面聚焦展示教师的教学画像、授课课程与完整教师评价。"}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm text-gray-500 shadow-sm">
                评价数量 <span className="ml-2 font-semibold text-gray-900">{detail.eval_count ?? 0}</span>
              </div>
              <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm text-gray-500 shadow-sm">
                关联资源 <span className="ml-2 font-semibold text-gray-900">{detail.resource_count ?? 0}</span>
              </div>
              <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm text-gray-500 shadow-sm">
                好评率 <span className="ml-2 font-semibold text-gray-900">{formatScore(detail.good_rate)}</span>
              </div>
            </div>

            <div className="mt-7 rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-sm">
              <div className="mb-4 text-sm font-medium text-gray-500">教学维度</div>
              <div className="space-y-3">
                <RatingBar label="教学质量" score={getSafeScore(detail.avg_quality)} color={1} />
                <RatingBar label="给分宽松" score={getSafeScore(detail.avg_grading)} color={3} />
                <RatingBar label="考勤要求" score={getSafeScore(detail.avg_attendance)} color={0} />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/82 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.07)] backdrop-blur-md">
            <div className="text-sm text-gray-400">综合评分</div>
            <div className="mt-3 text-6xl font-black tracking-tight text-gray-900">
              {formatScore(detail.avg_score)}
            </div>
            <div className="mt-2 text-sm text-gray-500">/ 5.0</div>

            <div className="mt-6 space-y-3">
              <div className="rounded-[22px] bg-slate-50 px-4 py-3">
                <div className="text-xs text-gray-400">授课课程</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {(detail.courses ?? []).length}
                </div>
              </div>
              <div className="rounded-[22px] bg-slate-50 px-4 py-3">
                <div className="text-xs text-gray-400">热度</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {formatScore(detail.hot_score)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8">
        <div>
          <div className="inline-flex rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-[var(--first-color)] shadow-sm">
            授课课程
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900">教师当前关联课程</h2>
          <p className="mt-1 text-sm text-gray-500">
            点击课程名称可进入课程详情页，继续查看课程评分、资源合集与全部课程评价。
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {(detail.courses ?? []).map((course) => (
            <Link
              key={course.id}
              href={buildCoursePath(course.id)}
              className="inline-flex items-center rounded-full border border-white/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--first-color)]/20 hover:text-[var(--first-color)]"
            >
              {course.name}
            </Link>
          ))}
        </div>
      </section>

      <DetailEvaluationSection
        title="教师评价"
        description="最新评价会优先展示，继续下滑会自动加载更多教学反馈。"
        evaluationType="teacher"
        initialItems={evaluations}
        initialTotal={evaluationTotal}
        relatedItems={(detail.courses ?? []).map((course) => ({
          id: course.id,
          name: course.name,
        }))}
        listEvaluations={(page, size) => listTeacherEvaluations(detail.id, page, size)}
        onReply={(evaluationId, payload) =>
          createTeacherEvaluationReply(evaluationId, payload)
        }
        onCreateEvaluation={(payload) =>
          createTeacherEvaluation(detail.id, payload as TeacherEvaluationInput)
        }
      />
    </div>
  );
}
