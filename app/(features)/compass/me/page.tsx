"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Empty, Tag } from "tdesign-react";
import { getCompassAuthorMe, type AuthorStatus } from "@/api/compass";
import { PageLoading } from "@/components/ui/AsyncState";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useAuthStore } from "@/store/useAuthStore";

export default function CompassMePage() {
  const hasMounted = useHasMounted();
  const router = useRouter();
  const isAuthenticated = Boolean(useAuthStore((s) => s.access_token));
  const [author, setAuthor] = useState<AuthorStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasMounted || !isAuthenticated) {
      setLoading(false);
      return;
    }
    getCompassAuthorMe()
      .then(setAuthor)
      .catch(() => setAuthor(null))
      .finally(() => setLoading(false));
  }, [hasMounted, isAuthenticated]);

  if (!hasMounted || loading) return <PageLoading text="加载…" />;

  if (!isAuthenticated) {
    return (
      <div className="container py-16 text-center">
        <Empty title="请先登录" />
        <Button className="mt-4" theme="primary" onClick={() => router.push("/login")}>
          去登录
        </Button>
      </div>
    );
  }

  return (
    <div className="container flex flex-col gap-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的指北</h1>
        <Link href="/compass" className="text-sm text-sky-600">
          回广场
        </Link>
      </div>
      <div className="rounded-xl bg-white/50 p-4">
        <div className="text-sm text-gray-500">作者身份</div>
        <div className="mt-2 flex items-center gap-2">
          {author?.is_author ? (
            <Tag theme="success">已是作者</Tag>
          ) : (
            <Tag theme="default">尚未开通</Tag>
          )}
          {author?.latest_application ? (
            <span className="text-sm text-gray-600">
              最近申请：{author.latest_application.status}
            </span>
          ) : null}
        </div>
      </div>
      <p className="text-sm text-gray-500">
        随笔与合集请从广场「写随笔 / 新建合集」进入；课程共笔从课程详情进入。
      </p>
    </div>
  );
}
