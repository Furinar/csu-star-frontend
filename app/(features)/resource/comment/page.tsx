"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createResourceComment, getResourceDetail } from "@/api/detail";
import CommentComposerForm from "@/components/detail/CommentComposerForm";
import ComposePageShell from "@/components/detail/ComposePageShell";
import { useHasMounted } from "@/hooks/useHasMounted";
import { requireAuthAction } from "@/lib/requireAuthAction";
import { buildResourceCommentsAnchor, buildResourcePath } from "@/lib/paths";
import { useAuthStore } from "@/store/useAuthStore";
import { feedback } from "@/store/useFeedbackStore";
import type { ResourceDetail } from "@/types/detail";
import { getResourceTypeLabel } from "@/app/(features)/me/components/shared/helpers";

export default function ResourceCommentComposerPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.access_token);
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const resourceId = hasMounted ? searchParams.get("id") : null;
  const isInvalidResourceId = hasMounted && !resourceId;

  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    if (
      !requireAuthAction({
        isSignedIn: Boolean(accessToken),
        router,
        description: "登录后才能发表评论。",
        redirectMethod: "replace",
      })
    ) {
      return;
    }

    if (isInvalidResourceId) {
      return;
    }
    if (!resourceId) {
      return;
    }

    let active = true;

    getResourceDetail(resourceId)
      .then((detail) => {
        if (!active) {
          return;
        }
        setResource(detail);
      })
      .catch((error) => {
        console.error(error);
        feedback.error({ title: "资源信息加载失败", description: "请稍后重试。" });
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, hasMounted, isInvalidResourceId, resourceId, router]);

  if (isInvalidResourceId) {
    return <div className="p-8 text-center text-slate-500">请提供有效的资源 ID</div>;
  }

  if (!hasMounted || isLoading) {
    return <div className="p-8 text-center text-slate-500">正在加载资源信息...</div>;
  }

  if (!resource) {
    return <div className="p-8 text-center text-slate-500">资源不存在或已被删除</div>;
  }

  return (
    <ComposePageShell
      accent="resource"
      badge="资源评论"
      title={`聊聊 ${resource.title}`}
      description="更像在帖子下补充一句使用反馈：哪里好用、哪里缺失、值不值得下、适合什么场景。"
      backHref={buildResourcePath(resource.id)}
      backLabel="返回资源详情"
      meta={
        <>
          <div className="rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm">
            资源类型 {getResourceTypeLabel(resource.resource_type)}
          </div>
          <div className="rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm">
            文件数 {resource.files?.length || 0}
          </div>
        </>
      }
    >
      <CommentComposerForm
        placeholder="这份资源适合考前速刷、平时补笔记还是查漏补缺？文件是否完整、清晰、好下载？"
        onSubmit={async (content) => {
          try {
            await createResourceComment(resource.id, { content });
            feedback.success({ title: "评论已发布" });
            router.push(buildResourceCommentsAnchor(resource.id));
          } catch (error) {
            console.error(error);
            feedback.error({ title: "发布失败", description: "请稍后重试。" });
            throw error;
          }
        }}
      />
    </ComposePageShell>
  );
}
