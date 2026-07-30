"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Empty } from "tdesign-react";
import { getCompassCollection } from "@/api/compass";
import DocumentWorkbench from "../components/DocumentWorkbench";
import { PageLoading } from "@/components/ui/AsyncState";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useAuthStore } from "@/store/useAuthStore";

export default function CompassCollectionPage() {
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const router = useRouter();
  const isAuthenticated = Boolean(useAuthStore((s) => s.access_token));
  const id = hasMounted ? searchParams.get("id") : null;
  const [rootId, setRootId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasMounted || !isAuthenticated || !id) {
      setLoading(false);
      return;
    }
    getCompassCollection(id)
      .then((data) => setRootId(String(data.root_page.id)))
      .catch(() => setRootId(null))
      .finally(() => setLoading(false));
  }, [hasMounted, isAuthenticated, id]);

  if (!hasMounted || loading) return <PageLoading text="打开合集…" />;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <Empty title="请先登录" />
        <Button theme="primary" onClick={() => router.push("/login")}>
          去登录
        </Button>
      </div>
    );
  }

  if (!id || !rootId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <Empty title="合集不存在" />
        <Button onClick={() => router.push("/compass")}>回广场</Button>
      </div>
    );
  }

  return (
    <DocumentWorkbench pageId={rootId} spaceKey="plaza" rootPageId={rootId} />
  );
}
