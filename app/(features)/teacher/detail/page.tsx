"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import DetailEvaluationSection from "@/components/detail/DetailEvaluationSection";
import RatingBar from "@/components/ui/RatingBar";
import GlassCard from "@/components/ui/GlassCard";
import {
  createTeacherEvaluation,
  createTeacherEvaluationReply,
  getTeacherDetail,
  listTeacherEvaluations,
} from "@/api/detail";
import type { TeacherDetail, TeacherEvaluation } from "@/types/detail";

export default function TeacherDetailPage() {
  const searchParams = useSearchParams();
  const idStr = searchParams.get("id");
  const teacherId = idStr ? parseInt(idStr, 10) : null;

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
  const [evaluationTotal, setEvaluationTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    if (!teacherId) return;

    let isMounted = true;

    Promise.all([
      getTeacherDetail(teacherId),
      listTeacherEvaluations(teacherId, 1, 10),
    ])
      .then(([detail, evalData]) => {
        if (!isMounted) return;
        setTeacher(detail);
        setEvaluations(evalData.items);
        setEvaluationTotal(evalData.total);
      })
      .catch((err) => {
        console.error("Failed to load teacher details:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  const statsMap = useMemo(
    () => [
      { key: "quality", label: "教学质量", value: teacher?.avg_quality || 0 },
      { key: "grading", label: "给分好坏", value: teacher?.avg_grading || 0 },
      {
        key: "attendance",
        label: "点名情况",
        value: teacher?.avg_attendance || 0,
      },
    ],
    [teacher],
  );

  const relatedCourses = useMemo(
    () =>
      (teacher?.courses || []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
    [teacher],
  );

  if (!teacherId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-500">
        请提供有效的教师 ID
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-purple-500" />
          <span className="text-sm text-slate-500">正在加载教师信息...</span>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-500">
        教师不存在或已被删除
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 pb-24">
      {/* Hero Section (Teacher Layout: Right aligned large number with avatar space, Purple orbs) */}
      <section className="relative overflow-hidden rounded-[32px] p-8 md:p-12">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-50 to-purple-50/50" />
        
        {/* Orb 1: Center Left */}
        <div className="absolute -left-20 top-0 h-96 w-96 animate-blob rounded-full bg-purple-200/50 mix-blend-multiply blur-3xl filter" />
        {/* Orb 2: Top Right */}
        <div className="absolute -top-32 -right-32 h-80 w-80 animate-blob rounded-full bg-fuchsia-200/50 mix-blend-multiply blur-3xl filter animation-delay-2000" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Main Info */}
          <div className="flex-1 flex gap-6 items-center flex-wrap">
             <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full ring-4 ring-white/50 shadow-xl bg-white flex items-center justify-center">
                 {teacher.avatar_url ? (
                   <img src={teacher.avatar_url} alt={teacher.name} className="h-full w-full object-cover" />
                 ) : (
                   <span className="text-4xl font-bold text-slate-300">{teacher.name.charAt(0)}</span>
                 )}
             </div>
             
             <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-purple-200/50 bg-purple-50/80 px-3 py-1 text-xs font-medium text-purple-700 backdrop-blur-sm">
                    热度: {teacher.hot_score || 0}
                  </span>
                  {teacher.title && (
                    <span className="text-sm font-medium text-slate-500">{teacher.title}</span>
                  )}
                </div>
                
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  {teacher.name}
                </h1>
                
                {teacher.department_name && (
                   <p className="text-slate-600 font-medium">{teacher.department_name}</p>
                )}
             </div>
          </div>

          {/* Master Rating Block */}
          <div className="w-full md:w-80 shrink-0">
            <GlassCard className="flex flex-col items-center justify-center p-6 text-center border border-white/40 shadow-lg bg-white/40">
              <div className="text-sm font-medium text-slate-500">师资评分</div>
              <div className="mt-2 text-6xl font-black tracking-tighter text-purple-600 drop-shadow-sm">
                {(teacher.avg_score || 0).toFixed(1)}
              </div>
              
              <div className="mt-6 w-full space-y-4">
                {statsMap.map((stat) => (
                  <div key={stat.key} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">{stat.label}</span>
                      <span className="text-slate-800">{stat.value.toFixed(1)}</span>
                    </div>
                    <RatingBar value={stat.value} max={5} colorClass="bg-purple-500" />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Intro & Taught Courses Area */}
      <section className="space-y-8">
         {teacher.bio && (
            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-2">教师简介</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{teacher.bio}</p>
            </div>
         )}
         
         {teacher.courses && teacher.courses.length > 0 && (
            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-4">教授课程</h3>
              <div className="flex flex-wrap gap-2">
                {teacher.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/course/detail?id=${course.id}`}
                    className="group flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm transition-all hover:border-purple-300 hover:bg-purple-50"
                  >
                    <span className="font-medium text-slate-700 group-hover:text-purple-700">
                      {course.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
         )}
      </section>

      {/* Evaluations Content Area */}
      <section>
        <DetailEvaluationSection
          title="教师评价"
          description="学生对该老师的真实评价。直接向下滚动即可无缝浏览全部评价。"
          evaluationType="teacher"
          initialItems={evaluations}
          initialTotal={evaluationTotal}
          initialPage={1}
          relatedItems={relatedCourses}
          listEvaluations={(page, size) => listTeacherEvaluations(teacherId, page, size)}
          onCreateEvaluation={(payload) => createTeacherEvaluation(teacherId, payload)}
          onReply={createTeacherEvaluationReply}
        />
      </section>
    </div>
  );
}
