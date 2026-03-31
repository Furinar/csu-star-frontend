"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import DetailEvaluationSection from "@/components/detail/DetailEvaluationSection";
import RatingBar from "@/components/ui/RatingBar";
import GlassCard from "@/components/ui/GlassCard";
import {
  createCourseEvaluation,
  createCourseEvaluationReply,
  getCourseDetail,
  listCourseEvaluations,
} from "@/api/detail";
import type { CourseDetail, CourseEvaluation } from "@/types/detail";

export default function CourseDetailPage() {
  const searchParams = useSearchParams();
  const idStr = searchParams.get("id");
  const courseId = idStr ? parseInt(idStr, 10) : null;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [evaluations, setEvaluations] = useState<CourseEvaluation[]>([]);
  const [evaluationTotal, setEvaluationTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    if (!courseId) return;

    let isMounted = true;

    Promise.all([
      getCourseDetail(courseId),
      listCourseEvaluations(courseId, 1, 10),
    ])
      .then(([detail, evalData]) => {
        if (!isMounted) return;
        setCourse(detail);
        setEvaluations(evalData.items);
        setEvaluationTotal(evalData.total);
      })
      .catch((err) => {
        console.error("Failed to load course details:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const statsMap = useMemo(
    () => [
      { key: "homework", label: "作业量", value: course?.avg_homework || 0 },
      { key: "gain", label: "收获感", value: course?.avg_gain || 0 },
      { key: "exam", label: "考试难度", value: course?.avg_exam_diff || 0 },
    ],
    [course],
  );

  const relatedTeachers = useMemo(
    () =>
      (course?.teachers || []).map((t) => ({
        id: t.id,
        name: t.name,
      })),
    [course],
  );

  if (!courseId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-500">
        请提供有效的课程 ID
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
          <span className="text-sm text-slate-500">正在加载课程信息...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-slate-500">
        课程不存在或已被删除
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 pb-24">
      {/* Hero Section (Course Layout: Left aligned large number, 2 orbs) */}
      <section className="relative overflow-hidden rounded-[32px] p-8 md:p-12">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50/50" />
        
        {/* Orb 1: Top Right */}
        <div className="absolute -top-24 -right-24 h-96 w-96 animate-blob rounded-full bg-blue-200/50 mix-blend-multiply blur-3xl filter" />
        {/* Orb 2: Bottom Mid */}
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 animate-blob rounded-full bg-indigo-200/50 mix-blend-multiply blur-3xl filter animation-delay-2000" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Main Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              {course.course_type && (
                <span className="inline-flex items-center rounded-full border border-blue-200/50 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700 backdrop-blur-sm">
                  {course.course_type}
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-orange-200/50 bg-orange-50/80 px-3 py-1 text-xs font-medium text-orange-700 backdrop-blur-sm">
                热度: {course.hot_score || 0}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {course.name}
            </h1>

            {/* Teaching Teachers Pills */}
            {course.teachers && course.teachers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-500 mb-3">授课教师</h3>
                <div className="flex flex-wrap gap-2">
                  {course.teachers.map((teacher) => (
                    <Link
                      key={teacher.id}
                      href={`/teacher/detail?id=${teacher.id}`}
                      className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                    >
                      <span className="font-medium text-slate-700 group-hover:text-blue-700">
                        {teacher.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Master Rating Block */}
          <div className="w-full md:w-80 shrink-0">
            <GlassCard className="flex flex-col items-center justify-center p-6 text-center border border-white/40 shadow-lg">
              <div className="text-sm font-medium text-slate-500">综合评分</div>
              <div className="mt-2 text-6xl font-black tracking-tighter text-[var(--first-color)] drop-shadow-sm">
                {(course.avg_score || 0).toFixed(1)}
              </div>
              
              <div className="mt-6 w-full space-y-4">
                {statsMap.map((stat) => (
                  <div key={stat.key} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">{stat.label}</span>
                      <span className="text-slate-800">{stat.value.toFixed(1)}</span>
                    </div>
                    <RatingBar value={stat.value} max={5} />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Resource Gateway Entry */}
      <section>
        <Link 
          href={`/resource/course?course_id=${course.id}`}
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
           <div className="flex items-center gap-4">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100/50 text-[var(--first-color)]">
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
               </svg>
             </div>
             <div>
               <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                 课程资料合集
               </h3>
               <p className="text-sm text-slate-500">
                 查看此课程的所有PPT、考卷、笔记等（共 {course.resource_count || 0} 份）
               </p>
             </div>
           </div>
           
           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
             <svg className="h-5 w-5 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
             </svg>
           </div>
        </Link>
      </section>

      {/* Evaluations Content Area */}
      <section>
        <DetailEvaluationSection
          title="课程评价"
          description="大家对这门课怎么看？直接滚动浏览全部评价。"
          evaluationType="course"
          initialItems={evaluations}
          initialTotal={evaluationTotal}
          initialPage={1}
          relatedItems={relatedTeachers}
          listEvaluations={(page, size) => listCourseEvaluations(courseId, page, size)}
          onCreateEvaluation={(payload) => createCourseEvaluation(courseId, payload)}
          onReply={createCourseEvaluationReply}
        />
      </section>
    </div>
  );
}
