import { getResourceCategoryLabel } from "@/lib/resourceCategory";

interface ResourcePreviewSummaryItem {
  id: number;
  title: string;
  resource_type?: string | null;
  downloads?: number | null;
  likes?: number | null;
}

export default function ResourcePreviewSummary({
  items,
  totalCount,
  className = "",
}: {
  items?: ResourcePreviewSummaryItem[] | null;
  totalCount?: number | null;
  className?: string;
}) {
  const previewItems = (items ?? []).slice(0, 3);
  const resolvedTotalCount = totalCount ?? items?.length ?? 0;
  const remainingCount = Math.max(resolvedTotalCount - previewItems.length, 0);

  if (previewItems.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-3 py-3 text-xs text-gray-400 ${className}`}>
        暂无资料预览
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {previewItems.map((item) => {
        const showMeta = typeof item.downloads === "number" || typeof item.likes === "number";

        return (
          <div
            key={`${item.id}-${item.title}`}
            className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-700"
                title={item.title}
              >
                {item.title}
              </span>
              <span className="shrink-0 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-500">
                {getResourceCategoryLabel(item.resource_type)}
              </span>
            </div>
            {showMeta ? (
              <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-400">
                <span>下载 {item.downloads ?? 0}</span>
                <span>点赞 {item.likes ?? 0}</span>
              </div>
            ) : null}
          </div>
        );
      })}

      {remainingCount > 0 ? (
        <div className="px-1 text-[11px] text-gray-400">
          等 {remainingCount} 条资料信息
        </div>
      ) : null}
    </div>
  );
}
