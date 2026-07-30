"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckTag, Tag } from "tdesign-react";
import EntityTypeBadge from "@/components/ui/EntityTypeBadge";
import type { EntityThemeKey } from "@/lib/entityTheme";
import {
  buildCoursePath,
  buildResourcePath,
  buildTeacherPath,
} from "@/lib/paths";
import type { FavoriteItem, PaginatedData } from "@/types/me";
import {
  formatDateTime,
  getResourceTypeLabel,
} from "./shared/helpers";
import {
  ME_META,
  ME_ROW_INTERACTIVE,
  ME_TITLE,
} from "./shared/styles";
import { SectionEmptyState } from "./SectionStates";

interface MeFavoritesProps {
  favorites: PaginatedData<FavoriteItem>;
}

function getFavoriteType(item: FavoriteItem): EntityThemeKey {
  if (item.target_type === "resource") {
    return "resource";
  }

  if (item.target_type === "course") {
    return "course";
  }

  if (item.target_type === "teacher") {
    return "teacher";
  }

  if (item.resource_type) {
    return "resource";
  }

  if (item.course_type || item.title_label) {
    return "course";
  }

  if (item.name) {
    return "teacher";
  }

  return "course";
}

function getFavoriteTypeLabel(item: FavoriteItem) {
  const type = getFavoriteType(item);
  if (type === "resource") {
    return "资源";
  }

  if (type === "teacher") {
    return "教师";
  }

  return "课程";
}

function getFavoriteTitle(item: FavoriteItem) {
  return item.title || item.name || item.title_label || "未命名收藏";
}

function getFavoriteHref(item: FavoriteItem) {
  const type = item.target_type ?? getFavoriteType(item);
  const targetId = item.target_id ?? item.id;

  const normalizedTargetId =
    typeof targetId === "string" && targetId.trim() !== ""
      ? targetId
      : typeof targetId === "number" &&
          Number.isFinite(targetId) &&
          targetId > 0
        ? String(targetId)
        : null;

  if (!normalizedTargetId) {
    return null;
  }

  if (type === "resource") {
    return buildResourcePath(normalizedTargetId);
  }

  if (type === "teacher") {
    return buildTeacherPath(normalizedTargetId);
  }

  if (type === "course") {
    return buildCoursePath(normalizedTargetId);
  }

  return null;
}

const FILTERS = [
  { key: "all" as const, label: "全部" },
  { key: "resource" as const, label: "资源" },
  { key: "course" as const, label: "课程" },
  { key: "teacher" as const, label: "教师" },
];

export default function MeFavorites({ favorites }: MeFavoritesProps) {
  const [favoriteFilter, setFavoriteFilter] = useState<
    "all" | "resource" | "course" | "teacher"
  >("all");
  const favoriteItems = favorites.items ?? [];

  const filteredFavorites =
    favoriteFilter === "all"
      ? favoriteItems
      : favoriteItems.filter(
          (item) => getFavoriteType(item) === favoriteFilter,
        );

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {FILTERS.map((item) => (
          <CheckTag
            key={item.key}
            checked={favoriteFilter === item.key}
            size="small"
            onChange={(checked) => {
              if (checked) setFavoriteFilter(item.key);
            }}
          >
            {item.label}
          </CheckTag>
        ))}
      </div>

      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
          {filteredFavorites.map((item) => {
            const href = getFavoriteHref(item);
            const cardContent = (
              <div className={ME_ROW_INTERACTIVE}>
                <div className="mb-2 flex items-start justify-between gap-2.5 md:mb-2.5 md:gap-3">
                  <div className="min-w-0">
                    <h4 className={ME_TITLE}>{getFavoriteTitle(item)}</h4>
                    <p className={`mt-1 ${ME_META}`}>
                      收藏于 {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <div className="shrink-0 scale-90 origin-top-right md:scale-100">
                    <EntityTypeBadge
                      type={getFavoriteType(item)}
                      label={getFavoriteTypeLabel(item)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs text-slate-600 md:gap-2 md:text-sm">
                  {item.resource_type ? (
                    <Tag size="small" variant="light" theme="default">
                      类型 {getResourceTypeLabel(item.resource_type)}
                    </Tag>
                  ) : null}
                  {item.avg_score != null ? (
                    <Tag size="small" variant="light" theme="warning">
                      评分 {item.avg_score}
                    </Tag>
                  ) : null}
                </div>
              </div>
            );

            if (!href) {
              return (
                <div key={`${getFavoriteType(item)}-${item.id}`}>
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={`${getFavoriteType(item)}-${item.id}`}
                href={href}
                className="block"
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      ) : (
        <SectionEmptyState
          title="还没有符合条件的收藏"
          description="你收藏过的资源、课程和教师会统一展示在这里。"
        />
      )}
    </div>
  );
}
