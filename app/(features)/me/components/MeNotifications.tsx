"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "tdesign-react";
import {
  listMyNotifications,
  markAllNotificationsRead,
} from "@/api/me";
import {
  buildCoursePath,
  buildResourcePath,
  buildTeacherPath,
} from "@/lib/paths";
import { PageLoading } from "@/components/ui/AsyncState";
import { feedback } from "@/store/useFeedbackStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import type { NotificationItem, PaginatedData } from "@/types/me";
import { SectionEmptyState } from "./SectionStates";
import {
  createEmptyPaginated,
  formatDateTime,
  getErrorMessage,
  getNotificationBadgeLabel,
  getNotificationTagTheme,
  isAnnouncementNotification,
} from "./shared/helpers";
import {
  ME_LIST_STACK,
  ME_META,
  ME_ROW,
  ME_ROW_INTERACTIVE,
  ME_SECTION_TITLE,
  ME_TITLE,
} from "./shared/styles";

interface MeNotificationsProps {
  onUnreadCountChange?: (delta: number) => void;
}

export default function MeNotifications({
  onUnreadCountChange,
}: MeNotificationsProps) {
  const router = useRouter();
  const markAllReadLocal = useNotificationStore(
    (state) => state.markAllReadLocal,
  );
  const [notifications, setNotifications] = useState<
    PaginatedData<NotificationItem>
  >(createEmptyPaginated());
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const autoReadDoneRef = useRef(false);
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

  // Entering the notifications panel marks everything as read automatically.
  useEffect(() => {
    if (!hasLoaded || autoReadDoneRef.current) {
      return;
    }

    const unreadItems = (notifications.items ?? []).filter(
      (item) => !item.is_read,
    );
    if (unreadItems.length === 0) {
      autoReadDoneRef.current = true;
      markAllReadLocal();
      return;
    }

    autoReadDoneRef.current = true;
    void (async () => {
      try {
        await markAllNotificationsRead();
        setNotifications((current) => ({
          ...current,
          items: current.items.map((item) => ({
            ...item,
            is_read: true,
          })),
        }));
        onUnreadCountChange?.(-unreadItems.length);
        markAllReadLocal();
      } catch (error) {
        autoReadDoneRef.current = false;
        feedback.error({
          title: "自动已读失败",
          description: getErrorMessage(error, "请稍后再试"),
        });
      }
    })();
  }, [
    hasLoaded,
    notifications.items,
    onUnreadCountChange,
    markAllReadLocal,
  ]);

  const handleOpenNotification = useCallback(
    (item: NotificationItem) => {
      const targetPath = buildNotificationPath(item);
      if (!targetPath) {
        return;
      }
      router.push(targetPath);
    },
    [router],
  );

  const announcementItems = notificationItems.filter((item) =>
    isAnnouncementNotification(item),
  );
  const messageItems = notificationItems.filter(
    (item) => !isAnnouncementNotification(item),
  );

  if (isLoading) {
    return <PageLoading text="通知与公告加载中..." />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <p className="text-xs text-slate-500 sm:text-sm">
        进入本页后未读通知会自动标记为已读。
      </p>

      <NotificationSection
        title="公告"
        description="系统公告与平台提醒"
        items={announcementItems}
        emptyTitle="暂无公告"
        emptyDescription="新的平台公告会展示在这里。"
        onOpenItem={handleOpenNotification}
      />

      <NotificationSection
        title="通知"
        description="系统通知、审核结果与点赞评论等消息"
        items={messageItems}
        emptyTitle="暂无通知"
        emptyDescription="新的系统通知和互动消息会展示在这里。"
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
  onOpenItem,
}: {
  title: string;
  description: string;
  items: NotificationItem[];
  emptyTitle: string;
  emptyDescription: string;
  onOpenItem: (item: NotificationItem) => void;
}) {
  return (
    <div>
      <div className="mb-3 border-b border-slate-100 pb-2.5">
        <h3 className={`${ME_SECTION_TITLE} mb-0.5`}>{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      {items.length > 0 ? (
        <div className={ME_LIST_STACK}>
          {items.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
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
  onOpen,
}: {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
}) {
  const targetPath = buildNotificationPath(item);
  const theme = getNotificationTagTheme(item);
  const rowClass = targetPath ? ME_ROW_INTERACTIVE : ME_ROW;

  return (
    <div
      className={rowClass}
      onClick={targetPath ? () => onOpen(item) : undefined}
      role={targetPath ? "button" : undefined}
      tabIndex={targetPath ? 0 : undefined}
      onKeyDown={
        targetPath
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen(item);
              }
            }
          : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Tag theme={theme} variant="light" size="small">
          {getNotificationBadgeLabel(item)}
        </Tag>
        {!item.is_read ? (
          <Tag theme="danger" variant="light" size="small">
            未读
          </Tag>
        ) : null}
      </div>
      <p className={`mt-1.5 ${ME_TITLE}`}>{item.title}</p>
      <p className={`mt-0.5 ${ME_META} leading-5 sm:leading-6`}>
        {item.content || "暂无附加内容"}
      </p>
      <p className="mt-1.5 text-[10px] text-slate-400 sm:mt-2 sm:text-xs">
        {formatDateTime(item.created_at)}
      </p>
    </div>
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
