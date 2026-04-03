"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import type {PaginatedData, ResourceItem} from "@/types/me";
import {buildCoursePath, buildResourcePath} from "@/lib/paths";
import {deleteResource} from "@/api/resource";
import {formatDateTime, formatNumber, getResourceTypeLabel,} from "./shared/helpers";
import {useState} from "react";

interface MeResourcesProps {
  resources: PaginatedData<ResourceItem>;
}

export default function MeResources({resources}: MeResourcesProps) {
  const router = useRouter();
  const [items, setItems] = useState(resources.items ?? []);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (item: ResourceItem) => {
    const confirmed = window.confirm(`确认删除资源《${item.title}》吗？\n文件会从 COS 中物理删除，记录会在数据库中标记为已删除。`);
    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      await deleteResource(item.id);
      setItems((prev) =>
          prev.map((resource) =>
              resource.id === item.id
                  ? {...resource, status: "deleted"}
                  : resource,
          ),
      );
    } catch (error) {
      console.error(error);
      window.alert("删除失败，请稍后重试。");
    } finally {
      setDeletingId(null);
    }
  };

  return (
      <div className="space-y-4">
        {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => {
                const courseName = item.course?.name || `课程 #${item.course_id}`;
                const isDeleted = item.status === "deleted";
                const cardContent = (
                    <GlassCard
                        className="p-5 transition-all hover:bg-white/55 hover:shadow-[0_12px_36px_0_rgba(31,38,135,0.18)]">
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            {isDeleted ? (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                            已删除
                          </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            上传于 {formatDateTime(item.created_at)}
                          </p>
                          <div className="mt-2 text-sm text-gray-600">
                            关联课程：
                            <span className="ml-1 font-medium text-gray-800">{courseName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <StatPill
                            label="类型"
                            value={getResourceTypeLabel(item.resource_type)}
                        />
                        <StatPill
                            label="课程"
                            value={courseName}
                        />
                        <StatPill
                            label="下载"
                            value={formatNumber(item.downloads)}
                        />
                        <StatPill
                            label="浏览"
                            value={formatNumber(item.views)}
                        />
                        <StatPill
                            label="点赞"
                            value={formatNumber(item.likes)}
                        />
                        <StatPill
                            label="热度"
                            value={`${item.hot_score ?? 0}`}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>{isDeleted ? "资源已删除，仅保留记录" : "点击查看资源详情"}</span>
                        <div className="flex items-center gap-3">
                      <span
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            router.push(buildCoursePath(item.course_id));
                          }}
                          className="cursor-pointer font-medium text-first hover:underline"
                      >
                        查看关联课程
                      </span>
                          {!isDeleted ? (
                              <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void handleDelete(item);
                                  }}
                                  disabled={deletingId === item.id}
                                  className="font-medium text-rose-600 hover:underline disabled:opacity-60"
                              >
                                {deletingId === item.id ? "删除中..." : "删除资源"}
                              </button>
                          ) : null}
                        </div>
                      </div>
                    </GlassCard>
                );
                return isDeleted ? (
                    <div key={item.id}>{cardContent}</div>
                ) : (
                    <Link key={item.id} href={buildResourcePath(item.id)} className="block">
                      {cardContent}
                    </Link>
                );
              })}
            </div>
        ) : (
            <SectionEmptyState
                title="暂无上传资源"
                description="你上传的资源会显示在这里。"
            />
        )}
      </div>
  );
}

function StatPill({label, value}: { label: string; value: string }) {
  return (
      <div className="rounded-full border border-gray-200/70 bg-white/55 px-3 py-1.5 text-xs text-gray-600">
        <span className="mr-2 text-gray-400">{label}</span>
        <span className="font-medium text-gray-800">{value}</span>
      </div>
  );
}

function SectionEmptyState({
                             title,
                             description,
                           }: {
  title: string;
  description: string;
}) {
  return (
      <GlassCard className="border-dashed p-12 text-center">
        <img
            src="/undraw_mcp-server_7kvc.svg"
            alt="空状态插画"
            className="mx-auto mb-4 h-24 w-auto opacity-90"
        />
        <h3 className="mb-2 text-xl font-medium text-gray-800">{title}</h3>
        <p className="mx-auto max-w-md text-gray-500">{description}</p>
      </GlassCard>
  );
}
