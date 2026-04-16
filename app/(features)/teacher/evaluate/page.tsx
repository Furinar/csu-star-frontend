"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildTeacherPath } from "@/lib/paths";
import { useHasMounted } from "@/hooks/useHasMounted";

export default function TeacherEvaluationComposerPage() {
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const teacherId = hasMounted ? searchParams.get("id") : null;
  if (!hasMounted) {
    return <div className="p-8 text-center text-slate-500">正在加载...</div>;
  }

  const backHref = teacherId ? buildTeacherPath(teacherId) : "/teacher";

  return (
    <div className="container mx-auto my-16 max-w-2xl px-6">
      <div className="rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-[0_20px_50px_rgba(244,114,182,0.12)]">
        <h1 className="text-2xl font-bold text-slate-900">教师评价功能已关闭</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          当前不支持发表教师评价，请返回教师详情页查看基础信息。
        </p>
        <Link
          href={backHref}
          className="mt-6 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
        >
          返回教师页面
        </Link>
      </div>
    </div>
  );
}
