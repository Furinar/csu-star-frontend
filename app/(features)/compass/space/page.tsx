"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Empty } from "tdesign-react";
import { getCompassTree, getCourseCoNoteRoot } from "@/api/compass";
import DocumentWorkbench from "../components/DocumentWorkbench";
import { PageLoading } from "@/components/ui/AsyncState";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useAuthStore } from "@/store/useAuthStore";

export default function CompassSpacePage() {
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const router = useRouter();
  const isAuthenticated = Boolean(useAuthStore((s) => s.access_token));
  const spaceKey = hasMounted ? searchParams.get("key") || "plaza" : "plaza";
  const courseId = hasMounted ? searchParams.get("courseId") : null;
  const [rootId, setRootId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasMounted || !isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        if (spaceKey === "courses" && courseId) {
          const data = await getCourseCoNoteRoot(courseId);
          if (!cancelled) setRootId(String(data.page_id));
        } else {
          const data = await getCompassTree(spaceKey);
          const first = data.tree?.[0]?.id;
          if (!cancelled) setRootId(first ? String(first) : null);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasMounted, isAuthenticated, spaceKey, courseId]);

  if (!hasMounted || loading) {
    return <PageLoading text="打开知识空间…" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <Empty title="请先登录" description="知识空间仅登录后可读" />
        <Button theme="primary" onClick={() => router.push("/login")}>
          去登录
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <Empty title="加载失败" />
        <Button onClick={() => router.push("/compass")}>回广场</Button>
      </div>
    );
  }

  if (!rootId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <Empty
          title="空间暂无文档"
          description={
            spaceKey === "courses"
              ? "请从课程详情进入共笔以创建合集根"
              : "登录用户均可阅读；作者可在此发布新内容"
          }
        />
        <Button onClick={() => router.push("/compass")}>回广场</Button>
      </div>
    );
  }

  return (
    <DocumentWorkbench
      pageId={rootId}
      spaceKey={spaceKey}
      rootPageId={undefined}
      courseId={courseId || undefined}
    />
  );
}
