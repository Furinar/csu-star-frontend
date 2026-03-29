"use client";

import {useCallback, useEffect, useState} from "react";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/me";
import GlassCard from "@/components/ui/GlassCard";
import {feedback} from "@/store/useFeedbackStore";
import type {NotificationItem, PaginatedData} from "@/types/me";
import {
  createEmptyPaginated,
  formatDateTime,
  getErrorMessage,
  getNotificationTypeLabel,
} from "./shared/helpers";

interface MeNotificationsProps {
  onUnreadCountChange?: (delta: number) => void;
}

export default function MeNotifications({onUnreadCountChange}: MeNotificationsProps) {
  const [notifications, setNotifications] = useState<PaginatedData<NotificationItem>>(
      createEmptyPaginated(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listMyNotifications({page: 1, size: 20});
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

  const handleMarkRead = async (id: number) => {
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

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      const unreadCount = notifications.items.filter((item) => !item.is_read).length;
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

  const announcementItems = notifications.items.filter(
      (item) => item.type === "system",
  );
  const messageItems = notifications.items.filter(
      (item) => item.type !== "system",
  );

  if (isLoading) {
    return (
        <SectionEmptyState title="通知与公告加载中..." description="请稍候。"/>
    );
  }

  return (
      <div className="space-y-6">
        <div className="flex justify-end">
          {notifications.items.length > 0 ? (
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
        />

        <NotificationSection
            title="通知"
            description="审核结果、点赞评论等互动消息"
            items={messageItems}
            emptyTitle="暂无通知"
            emptyDescription="新的互动通知会展示在这里。"
            onMarkRead={handleMarkRead}
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
}: {
  title: string;
  description: string;
  items: NotificationItem[];
  emptyTitle: string;
  emptyDescription: string;
  onMarkRead: (id: number) => void;
}) {
  return (
      <div className="space-y-3">
        <div className="ml-1">
          <h3 className="text-base font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>

        {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                  <GlassCard key={item.id} className="border border-white/50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-gray-200 bg-white/60 px-2.5 py-1 text-xs text-gray-600">
                        {item.type === "system"
                            ? "公告"
                            : getNotificationTypeLabel(item.type)}
                      </span>
                          {!item.is_read ? (
                              <span className="rounded-full bg-first/10 px-2 py-1 text-[11px] text-first">
                          未读
                        </span>
                          ) : null}
                        </div>
                        <p className="mt-2 font-medium text-gray-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          {item.content || "暂无附加内容"}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {formatDateTime(item.created_at)}
                        </p>
                      </div>
                      {!item.is_read ? (
                          <button
                              type="button"
                              onClick={() => void onMarkRead(item.id)}
                              className="rounded-xl border border-gray-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-white"
                          >
                            标记已读
                          </button>
                      ) : null}
                    </div>
                  </GlassCard>
              ))}
            </div>
        ) : (
            <SectionEmptyState title={emptyTitle} description={emptyDescription}/>
        )}
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
