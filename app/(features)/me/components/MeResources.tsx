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
  getResourceTypeLabel,
} from "./shared/helpers";
import MeEntityCard, { ME_FILE_THUMB_WELL } from "./shared/MeEntityCard";
import {
  MeDownloadStat,
  MeFileTypeThumb,
  MeLikeStat,
  MeStat,
  MeViewStat,
} from "./shared/meCardIcons";
import {
  ME_CARD_GRID,
  ME_CARD_META,
  ME_CARD_TIME,
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
      {items.length > 0 ? (
        <div className={ME_CARD_GRID}>
          {items.map((item) => {
            const courseName =
              item.course?.name || `课程 #${item.course_id}`;
            const isDeleted = item.status === "deleted";
            const typeLabel = getResourceTypeLabel(item.resource_type);

            const card = (
              <MeEntityCard
                fullHeight
                icon={<MeFileTypeThumb resourceType={item.resource_type} />}
                tone={isDeleted ? "danger" : "resource"}
                iconWellClassName={
                  isDeleted
                    ? "border-rose-100 bg-rose-50/70 opacity-70"
                    : ME_FILE_THUMB_WELL
                }
                interactive={!isDeleted}
                title={item.title}
                tags={
                  <Tag
                    size="small"
                    variant="light"
                    theme={isDeleted ? "danger" : "success"}
                  >
                    {isDeleted ? "已删除" : typeLabel}
                  </Tag>
                }
                action={
                  !isDeleted ? (
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
                              const detail = await getResourceDetail(item.id);
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
                  ) : undefined
                }
                meta={
                  <div className={ME_CARD_META}>
                    {isDeleted ? (
                      <span className="min-w-0 truncate">{courseName}</span>
                    ) : (
                      <span
                        role="link"
                        tabIndex={0}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          router.push(buildCoursePath(item.course_id));
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            router.push(buildCoursePath(item.course_id));
                          }
                        }}
                        className="min-w-0 truncate font-medium text-slate-600 transition-colors hover:text-first"
                      >
                        {courseName}
                      </span>
                    )}
                  </div>
                }
                stats={
                  isDeleted ? (
                    <>
                      <MeStat muted>资源已删除，仅保留记录</MeStat>
                      <time
                        className={ME_CARD_TIME}
                        dateTime={item.created_at}
                      >
                        {formatDateTime(item.created_at)}
                      </time>
                    </>
                  ) : (
                    <>
                      <MeDownloadStat value={item.downloads} />
                      <MeLikeStat value={item.likes} />
                      <MeViewStat value={item.views} />
                      <time
                        className={ME_CARD_TIME}
                        dateTime={item.created_at}
                      >
                        {formatDateTime(item.created_at)}
                      </time>
                    </>
                  )
                }
              />
            );

            return isDeleted ? (
              <div key={item.id} className="min-h-0">
                {card}
              </div>
            ) : (
              <Link
                key={item.id}
                href={buildResourcePath(item.id)}
                className="block min-h-0"
              >
                {card}
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
