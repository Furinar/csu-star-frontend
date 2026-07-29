"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tag } from "tdesign-react";
import { getResourceDetail, updateResource } from "@/api/detail";
import { deleteResource } from "@/api/resource";
import ItemActionMenu from "@/components/ui/ItemActionMenu";
import ResourceEditModal from "@/components/detail/ResourceEditModal";
import { buildCoursePath, buildResourcePath } from "@/lib/paths";
import type { ResourceDetail } from "@/types/detail";
import type { EntityId } from "@/types/entity";
import type { PaginatedData, ResourceItem } from "@/types/me";
import {
  formatDateTime,
  formatNumber,
  getResourceTypeLabel,
} from "./shared/helpers";
import {
  ME_LIST_STACK,
  ME_META,
  ME_METRIC_ROW,
  ME_ROW,
  ME_ROW_INTERACTIVE,
  ME_TITLE,
} from "./shared/styles";
import { SectionEmptyState } from "./SectionStates";

interface MeResourcesProps {
  resources: PaginatedData<ResourceItem>;
}

export default function MeResources({ resources }: MeResourcesProps) {
  const router = useRouter();
  const [items, setItems] = useState(resources.items ?? []);
  const [deletingId, setDeletingId] = useState<EntityId | null>(null);
  const [editingItem, setEditingItem] = useState<ResourceDetail | null>(null);

  const handleDelete = async (item: ResourceItem) => {
    const confirmed = window.confirm(
      `确认删除资源《${item.title}》吗？\n文件会从 COS 中物理删除，记录会在数据库中标记为已删除。`,
    );
    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      await deleteResource(item.id);
      setItems((prev) =>
        prev.map((resource) =>
          resource.id === item.id
            ? { ...resource, status: "deleted" }
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
    <>
      <div className={ME_LIST_STACK}>
        {items.length > 0 ? (
          items.map((item) => {
            const courseName =
              item.course?.name || `课程 #${item.course_id}`;
            const isDeleted = item.status === "deleted";
            const rowClass = isDeleted ? ME_ROW : ME_ROW_INTERACTIVE;
            const cardContent = (
              <div className={rowClass}>
                <div className="mb-2 flex flex-col gap-2 sm:mb-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={ME_TITLE}>{item.title}</h4>
                      {isDeleted ? (
                        <Tag theme="danger" variant="light" size="small">
                          已删除
                        </Tag>
                      ) : null}
                    </div>
                    <p className={`mt-1 ${ME_META}`}>
                      上传于 {formatDateTime(item.created_at)}
                    </p>
                    <div className={`mt-1 ${ME_META}`}>
                      关联课程：
                      <span className="ml-1 font-medium text-slate-800">
                        {courseName}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={ME_METRIC_ROW}>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="uil uil-file-alt text-base text-emerald-500 sm:text-lg" />
                    <span>{getResourceTypeLabel(item.resource_type)}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="uil uil-cloud-download text-base text-blue-500 sm:text-lg" />
                    <span>下载 {formatNumber(item.downloads)}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="uil uil-eye text-base text-amber-500 sm:text-lg" />
                    <span>浏览 {formatNumber(item.views)}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="uil uil-thumbs-up text-base text-rose-500 sm:text-lg" />
                    <span>点赞 {formatNumber(item.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <i className="uil uil-bolt text-base text-violet-500 sm:text-lg" />
                    <span>热度 {item.hot_score ?? 0}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-y-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500 sm:mt-3.5 sm:pt-3 sm:text-sm">
                  <span>
                    {isDeleted
                      ? "资源已删除，仅保留记录"
                      : "点击查看资源详情"}
                  </span>
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        router.push(buildCoursePath(item.course_id));
                      }}
                      className="cursor-pointer text-sm font-medium text-first hover:underline"
                    >
                      查看关联课程
                    </span>
                    {!isDeleted ? (
                      <div
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <ItemActionMenu
                          items={[
                            {
                              key: "edit",
                              label: "修改资源",
                              onClick: async () => {
                                const detail = await getResourceDetail(
                                  item.id,
                                );
                                setEditingItem(detail);
                              },
                            },
                            {
                              key: "delete",
                              label:
                                deletingId === item.id
                                  ? "删除中..."
                                  : "删除资源",
                              destructive: true,
                              onClick: () => handleDelete(item),
                            },
                          ]}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
            return isDeleted ? (
              <div key={item.id}>{cardContent}</div>
            ) : (
              <Link
                key={item.id}
                href={buildResourcePath(item.id)}
                className="block"
              >
                {cardContent}
              </Link>
            );
          })
        ) : (
          <SectionEmptyState
            title="暂无上传资源"
            description="你上传的资源会显示在这里。"
          />
        )}
      </div>
      <ResourceEditModal
        resource={editingItem}
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSubmit={async (payload) => {
          if (!editingItem) return;
          const updated = await updateResource(editingItem.id, payload);
          const nextCourseName =
            updated?.course?.name ||
            editingItem.course?.name ||
            `课程 #${editingItem.course_id}`;
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingItem.id
                ? {
                    ...item,
                    title: updated?.title ?? item.title,
                    resource_type:
                      (updated?.resource_type as ResourceItem["resource_type"]) ??
                      item.resource_type,
                    course_id: updated?.course_id ?? item.course_id,
                    course: {
                      id: updated?.course?.id ?? item.course_id,
                      name: nextCourseName,
                    },
                  }
                : item,
            ),
          );
          setEditingItem(null);
        }}
      />
    </>
  );
}
