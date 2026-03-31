"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DetailEvaluationSection from "@/components/detail/DetailEvaluationSection";
import RatingBar from "@/components/ui/RatingBar";
import {
  createCourseEvaluation,
  createCourseEvaluationReply,
  getCourseDetail,
  listCourseEvaluations,
} from "@/api/detail";
import type {
  CourseDetail,
  CourseEvaluation,
  CourseEvaluationInput,
} from "@/types/detail";
import {
  buildResourceCollectionPath,
  buildTeacherPath,
} from "@/lib/paths";

function formatScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toFixed(1);
}

function getSafeScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value;
}

export default function CourseDetailPage() {
  const searchParams = useSearchParams();
  const courseId = Number(searchParams.get("id"));
  const isInvalidCourseId = !Number.isFinite(courseId);
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>([]);
  const [evaluationTotal, setEvaluationTotal] = useState(0);
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
        setEvaluationTotal(evaluationData.total);
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
      <section className="relative overflow-hidden rounded-[40px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(241,248,255,0.92)_45%,rgba(234,250,244,0.9)_100%)] p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-9">
        <div className="absolute -right-10 top-0 h-52 w-52 rounded-full bg-sky-300/35 blur-3xl animate-blob"></div>
        <div className="absolute -bottom-10 left-8 h-48 w-48 rounded-full bg-emerald-200/35 blur-3xl animate-blob animation-delay-2000"></div>

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_340px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-[var(--first-color)] shadow-sm">
              <i className="uil uil-graduation-cap"></i>
              课程详情
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
                {detail.name}
              </h1>
              {detail.course_type ? (
                <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                  {detail.course_type}
                </span>
              ) : null}
              {detail.course_type === "公选课" ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  公选课程
                </span>
              ) : null}
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600 md:text-base">
              这里聚合课程核心评分、授课教师与完整评价列表。评价内容会持续向下加载，帮助你更快判断课程体验。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm text-gray-500 shadow-sm">
                评价数量 <span className="ml-2 font-semibold text-gray-900">{detail.eval_count ?? 0}</span>
              </div>
              <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm text-gray-500 shadow-sm">
                资源总数 <span className="ml-2 font-semibold text-gray-900">{detail.resource_count ?? 0}</span>
              </div>
              <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm text-gray-500 shadow-sm">
                热度 <span className="ml-2 font-semibold text-gray-900">{formatScore(detail.hot_score)}</span>
              </div>
            </div>

            <div className="mt-7 rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-sm">
              <div className="mb-4 text-sm font-medium text-gray-500">课程维度</div>
              <div className="space-y-3">
                <RatingBar label="作业量" score={getSafeScore(detail.avg_homework)} color={2} />
                <RatingBar label="收获感" score={getSafeScore(detail.avg_gain)} color={0} />
                <RatingBar label="考试难度" score={getSafeScore(detail.avg_exam_diff)} color={1} />
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
                <div className="text-xs text-gray-400">授课教师</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {(detail.teachers ?? []).length}
                </div>
              </div>
              <div className="rounded-[22px] bg-slate-50 px-4 py-3">
                <div className="text-xs text-gray-400">资源合集</div>
                <Link
                  href={buildResourceCollectionPath(detail.id)}
                  className="mt-2 inline-flex rounded-full bg-[var(--first-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  查看该课程下的资源
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-[var(--first-color)] shadow-sm">
              授课教师
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">本课程授课教师</h2>
            <p className="mt-1 text-sm text-gray-500">
              点击教师名称可继续查看教师画像、维度评分与全部教师评价。
            </p>
          </div>

          <Link
            href={buildResourceCollectionPath(detail.id)}
            className="inline-flex rounded-full border border-[var(--first-color)]/20 bg-white px-4 py-2 text-sm font-medium text-[var(--first-color)] transition hover:bg-[var(--first-color)]/5"
          >
            进入资源合集
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {(detail.teachers ?? []).map((teacher) => (
            <Link
              key={teacher.id}
              href={buildTeacherPath(teacher.id)}
              className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2.5 text-sm text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--first-color)]/20 hover:text-[var(--first-color)]"
            >
              <span className="font-medium">{teacher.name}</span>
              {teacher.title ? (
                <span className="text-xs text-gray-400">{teacher.title}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <DetailEvaluationSection
        title="课程评价"
        description="从最新评价开始向下浏览，滚动到底会自动加载更多内容。"
        evaluationType="course"
        initialItems={evaluations}
        initialTotal={evaluationTotal}
        relatedItems={(detail.teachers ?? []).map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
        }))}
        listEvaluations={(page, size) => listCourseEvaluations(detail.id, page, size)}
        onReply={(evaluationId, payload) =>
          createCourseEvaluationReply(evaluationId, payload)
        }
        onCreateEvaluation={(payload) =>
          createCourseEvaluation(detail.id, payload as CourseEvaluationInput)
        }
      />
    </div>
  );
}
