"use client";

import { useSearchParams } from "next/navigation";
import DocumentWorkbench from "../components/DocumentWorkbench";
import { useHasMounted } from "@/hooks/useHasMounted";
import { PageLoading } from "@/components/ui/AsyncState";
import { Empty, Button } from "tdesign-react";
import { useRouter } from "next/navigation";

export default function CompassPageRoute() {
  const searchParams = useSearchParams();
  const hasMounted = useHasMounted();
  const router = useRouter();
  const pageId = hasMounted ? searchParams.get("id") : null;
  const space = hasMounted ? searchParams.get("space") || undefined : undefined;
  const courseId = hasMounted ? searchParams.get("courseId") || undefined : undefined;
  const rootPageId = hasMounted ? searchParams.get("root") || undefined : undefined;

  if (!hasMounted) {
    return <PageLoading text="打开文档…" />;
  }

  if (!pageId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <Empty title="缺少文档 id" />
        <Button onClick={() => router.push("/compass")}>回广场</Button>
      </div>
    );
  }

  return (
    <DocumentWorkbench
      pageId={pageId}
      spaceKey={space}
      courseId={courseId}
      rootPageId={rootPageId}
    />
  );
}
