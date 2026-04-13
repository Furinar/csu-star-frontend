"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/me";
import {
  buildCoursePath,
  buildResourcePath,
  buildTeacherPath,
} from "@/lib/paths";
import GlassCard from "@/components/ui/GlassCard";
import { feedback } from "@/store/useFeedbackStore";
import type { NotificationItem, PaginatedData } from "@/types/me";
import {
  createEmptyPaginated,
  formatDateTime,
  getErrorMessage,
  getNotificationBadgeLabel,
  getNotificationCardTone,
  isAnnouncementNotification,
} from "./shared/helpers";

interface MeNotificationsProps {
  onUnreadCountChange?: (delta: number) => void;
}

export default function MeNotifications({
  onUnreadCountChange,
}: MeNotificationsProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<
    PaginatedData<NotificationItem>
  >(createEmptyPaginated());
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const notificationItems = notifications.items ?? [];

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listMyNotifications({ page: 1, size: 20 });
      setNotifications(data);
      setHasLoaded(true);
    } catch (error) {
      feedback.error({
        title: "通知列表加载失败",
        description: getErrorMessage(error, "暂时无法获取通知"),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      void loadNotifications();
    }
  }, [hasLoaded, loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: true,
              }
            : item,
        ),
      }));
      onUnreadCountChange?.(-1);
    } catch (error) {
      feedback.error({
        title: "操作失败",
        description: getErrorMessage(error, "无法标记通知状态"),
      });
    }
  };

  const handleOpenNotification = useCallback(
    async (item: NotificationItem) => {
      const targetPath = buildNotificationPath(item);
      if (!targetPath) {
        return;
      }

      if (!item.is_read) {
        try {
          await markNotificationRead(item.id);
          setNotifications((current) => ({
            ...current,
            items: current.items.map((currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    is_read: true,
                  }
                : currentItem,
            ),
          }));
          onUnreadCountChange?.(-1);
        } catch (error) {
          feedback.error({
            title: "已读状态同步失败",
            description: getErrorMessage(error, "无法更新通知状态"),
          });
        }
      }

      router.push(targetPath);
    },
    [onUnreadCountChange, router],
  );

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      const unreadCount = notificationItems.filter(
        (item) => !item.is_read,
      ).length;
      setNotifications((current) => ({
        ...current,
        items: current.items.map((item) => ({
          ...item,
          is_read: true,
        })),
      }));
      onUnreadCountChange?.(-unreadCount);
      feedback.success({
        title: "全部通知已标记为已读",
      });
    } catch (error) {
      feedback.error({
        title: "操作失败",
        description: getErrorMessage(error, "请稍后再试"),
      });
    }
  };

  const announcementItems = notificationItems.filter(
    (item) => isAnnouncementNotification(item),
  );
  const messageItems = notificationItems.filter(
    (item) => !isAnnouncementNotification(item),
  );

  if (isLoading) {
    return (
      <SectionEmptyState title="通知与公告加载中..." description="请稍候。" />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-end">
        {notificationItems.length > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="rounded-xl border border-gray-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-white"
          >
            全部标记已读
          </button>
        ) : null}
      </div>

      <NotificationSection
        title="公告"
        description="系统公告与平台提醒"
        items={announcementItems}
        emptyTitle="暂无公告"
        emptyDescription="新的平台公告会展示在这里。"
        onMarkRead={handleMarkRead}
        onOpenItem={handleOpenNotification}
      />

      <NotificationSection
        title="通知"
        description="系统通知、审核结果与点赞评论等消息"
        items={messageItems}
        emptyTitle="暂无通知"
        emptyDescription="新的系统通知和互动消息会展示在这里。"
        onMarkRead={handleMarkRead}
        onOpenItem={handleOpenNotification}
      />
    </div>
  );
}

function NotificationSection({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
  onMarkRead,
  onOpenItem,
}: {
  title: string;
  description: string;
  items: NotificationItem[];
  emptyTitle: string;
  emptyDescription: string;
  onMarkRead: (id: string) => void;
  onOpenItem: (item: NotificationItem) => void;
}) {
  return (
    <div className="space-y-2.5 sm:space-y-3">
      <div className="ml-1">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2.5 sm:space-y-3">
          {items.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onMarkRead={onMarkRead}
              onOpen={onOpenItem}
            />
          ))}
        </div>
      ) : (
        <SectionEmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}

function NotificationCard({
  item,
  onMarkRead,
  onOpen,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  onOpen: (item: NotificationItem) => void;
}) {
  const tone = getNotificationCardTone(item);
  const targetPath = buildNotificationPath(item);

  return (
    <GlassCard
      className={`rounded-xl sm:rounded-2xl ${tone.cardClassName} p-2.5 sm:p-4 ${
        targetPath ? "cursor-pointer transition hover:-translate-y-0.5" : ""
      }`}
      onClick={targetPath ? () => void onOpen(item) : undefined}
      role={targetPath ? "button" : undefined}
      tabIndex={targetPath ? 0 : undefined}
      onKeyDown={
        targetPath
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                void onOpen(item);
              }
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] sm:px-2.5 sm:py-1 sm:text-xs ${tone.badgeClassName}`}
            >
              {getNotificationBadgeLabel(item)}
            </span>
            {!item.is_read ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-[11px] ${tone.unreadClassName}`}
              >
                未读
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[13px] font-medium leading-5 text-gray-900 sm:mt-2 sm:text-sm sm:leading-6">
            {item.title}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-gray-600 sm:mt-1 sm:text-sm sm:leading-6">
            {item.content || "暂无附加内容"}
          </p>
          <p className="mt-1.5 text-[10px] text-gray-500 sm:mt-2 sm:text-xs">
            {formatDateTime(item.created_at)}
          </p>
        </div>
        {!item.is_read ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void onMarkRead(item.id);
            }}
            className="self-end rounded-lg border border-gray-200/70 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition hover:bg-white sm:self-start sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs"
          >
            标记已读
          </button>
        ) : null}
      </div>
    </GlassCard>
  );
}

function buildNotificationPath(item: NotificationItem) {
  const metadata = item.metadata;

  if (metadata?.target_page && metadata.target_id) {
    const extraParams = new URLSearchParams();

    if (metadata.evaluation_id) {
      extraParams.set("evaluation_id", String(metadata.evaluation_id));
    }
    if (metadata.comment_id) {
      extraParams.set("comment_id", String(metadata.comment_id));
    }
    if (metadata.reply_id) {
      extraParams.set("reply_id", String(metadata.reply_id));
    }
    const suffix = extraParams.toString();

    if (metadata.target_page === "resource") {
      return `${buildResourcePath(metadata.target_id)}${
        suffix ? `&${suffix}` : ""
      }${metadata.comment_id || metadata.reply_id ? "#comments" : ""}`;
    }

    if (metadata.target_page === "teacher") {
      return `${buildTeacherPath(metadata.target_id)}${
        suffix ? `&${suffix}` : ""
      }#evaluations`;
    }

    if (metadata.target_page === "course") {
      return `${buildCoursePath(metadata.target_id)}${
        suffix ? `&${suffix}` : ""
      }#evaluations`;
    }
  }

  if (item.source_type === "resource" && item.source_id) {
    return buildResourcePath(item.source_id);
  }

  return null;
}

function SectionEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <GlassCard className="rounded-xl border-dashed p-6 text-center sm:rounded-2xl sm:p-12">
      <Image
        src="/undraw_mcp-server_7kvc.svg"
        alt="空状态插画"
        className="mx-auto mb-3 h-20 w-auto opacity-90 sm:mb-4 sm:h-24"
        width={160}
        height={96}
      />
      <h3 className="mb-1.5 text-lg font-medium text-gray-800 sm:mb-2 sm:text-xl">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-gray-500 sm:text-base">{description}</p>
    </GlassCard>
  );
}
