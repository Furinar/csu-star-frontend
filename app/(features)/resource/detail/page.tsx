"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SectionCard from "@/components/ui/SectionCard";
import { getResourceDetail, listResourceComments } from "@/api/detail";
import type { ResourceComment, ResourceDetail } from "@/types/detail";
import {
  buildCourseEvaluationAnchor,
  buildCoursePath,
  buildResourceCollectionPath,
} from "@/lib/paths";

function formatBytes(value?: number | null) {
  if (typeof value !== "number" || value <= 0) return "--";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

function CommentItem({ comment }: { comment: ResourceComment }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {comment.user?.nickname ?? "匿名用户"}
          </span>
          {comment.reply_to_user ? (
            <span className="text-xs text-gray-400">回复 @{comment.reply_to_user.nickname}</span>
          ) : null}
        </div>
        <span className="text-xs text-gray-400">{formatDateTime(comment.created_at)}</span>
      </div>
      <p className="mt-3 text-sm leading-7 text-gray-600">{comment.content}</p>
      {comment.children?.length ? (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ResourceDetailPage() {
  const searchParams = useSearchParams();
  const resourceId = Number(searchParams.get("id"));
  const isInvalidResourceId = !Number.isFinite(resourceId);
  const [detail, setDetail] = useState<ResourceDetail | null>(null);
  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isInvalidResourceId) return;

    let active = true;

    Promise.all([getResourceDetail(resourceId), listResourceComments(resourceId, 1, 20)])
      .then(([resource, commentData]) => {
        if (!active) return;
        setDetail(resource);
        setComments(commentData.items);
      })
      .catch((err) => {
        console.error(err);
        if (!active) return;
        setError("资源详情加载失败，请稍后重试。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isInvalidResourceId, resourceId]);

  if (isInvalidResourceId) {
    return (
      <div className="container mt-10 mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          资源 ID 无效。
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-10 mb-20 flex min-h-[60vh] items-center justify-center text-gray-500">
        资源详情加载中...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container mt-10 mb-20">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center text-red-600">
          {error || "资源不存在。"}
        </div>
      </div>
    );
  }

  const courseId = detail.course?.id ?? detail.course_id;

  return (
    <div className="container mt-10 mb-20 space-y-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-gradient-to-br from-white via-[var(--star-50)] to-[var(--ice-50)] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--first-color)]/10 blur-3xl"></div>
        <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl"></div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-[var(--first-color)] shadow-sm">
              <i className="uil uil-file-alt"></i>
              资源详情
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{detail.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                {detail.description || "暂无资源说明，当前页面聚焦附件信息、课程关联和评论区。"}
              </p>
            </div>
          </div>
          <div className="grid min-w-full grid-cols-2 gap-3 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-sm lg:min-w-[420px]">
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">下载次数</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{detail.downloads ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">浏览次数</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{detail.views ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">文件大小</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{formatBytes(detail.size_bytes)}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">点赞数</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{detail.likes ?? 0}</div>
            </div>
          </div>
        </div>
      </section>

      <SectionCard
        title="课程关联"
        subtitle="资源不会单独承担搜索入口，所有资料都归属于课程资源合集与课程评价体系。"
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href={buildCoursePath(courseId)}
              className="rounded-full border border-[var(--first-color)]/20 bg-white px-4 py-2 text-sm font-medium text-[var(--first-color)] transition hover:bg-[var(--first-color)]/5"
            >
              进入课程详情
            </Link>
            <Link
              href={buildResourceCollectionPath(courseId)}
              className="rounded-full bg-[var(--first-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              查看资源合集
            </Link>
            <Link
              href={buildCourseEvaluationAnchor(courseId)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-[var(--first-color)]/20 hover:text-[var(--first-color)]"
            >
              跳转课程评价区
            </Link>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5">
            <div className="text-sm text-gray-400">{"课程信息"}</div>
            <div className="mt-2 text-xl font-semibold text-gray-900">
              {detail.course?.name || `课程 ${courseId}`}
            </div>
            <div className="mt-3 text-sm text-gray-500">
              资源类型：{detail.resource_type || "未分类"} · 上传时间：{formatDateTime(detail.created_at)}
            </div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5">
            <div className="text-sm text-gray-400">附件列表</div>
            <div className="mt-3 space-y-2">
              {(detail.files ?? []).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm"
                >
                  <span className="truncate text-gray-700">{file.filename}</span>
                  <span className="text-gray-400">{formatBytes(file.size_bytes)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="资源评论" subtitle="资源详情继续保留原有资源评论区。">
        <div className="space-y-4">
          {comments.length ? (
            comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              暂无评论内容。
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
