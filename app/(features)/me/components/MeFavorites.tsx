"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckTag } from "tdesign-react";
import EntityTypeBadge from "@/components/ui/EntityTypeBadge";
import StarRating from "@/components/ui/StarRating";
import type { EntityThemeKey } from "@/lib/entityTheme";
import { getEntityTheme } from "@/lib/entityTheme";
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
import MeEntityCard, { ME_FILE_THUMB_WELL } from "./shared/MeEntityCard";
import {
  MeEntityFaThumb,
  MeFileTypeThumb,
  getEntityFaWellClass,
} from "./shared/meCardIcons";
import {
  ME_CARD_GRID,
  ME_CARD_META,
  ME_META_DOT,
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
  const favoriteItems = useMemo(
    () => favorites.items ?? [],
    [favorites.items],
  );

  const filteredFavorites =
    favoriteFilter === "all"
      ? favoriteItems
      : favoriteItems.filter(
          (item) => getFavoriteType(item) === favoriteFilter,
        );

  const filterCounts = useMemo(() => {
    const counts = {
      all: favoriteItems.length,
      resource: 0,
      course: 0,
      teacher: 0,
    };
    for (const item of favoriteItems) {
      const type = getFavoriteType(item);
      counts[type] += 1;
    }
    return counts;
  }, [favoriteItems]);

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
            {filterCounts[item.key] > 0 ? (
              <span className="ml-1 tabular-nums opacity-70">
                {filterCounts[item.key]}
              </span>
            ) : null}
          </CheckTag>
        ))}
      </div>

      {filteredFavorites.length > 0 ? (
        <div className={ME_CARD_GRID}>
          {filteredFavorites.map((item) => {
            const href = getFavoriteHref(item);
            const type = getFavoriteType(item);
            const theme = getEntityTheme(type);
            const hasScore =
              item.avg_score != null &&
              Number.isFinite(Number(item.avg_score));
            const categoryLabel =
              type === "resource" && item.resource_type
                ? getResourceTypeLabel(item.resource_type)
                : null;

            const icon =
              type === "resource" ? (
                <MeFileTypeThumb resourceType={item.resource_type} />
              ) : (
                <MeEntityFaThumb type={type} />
              );

            // Single source of truth per field:
            // - entity kind → badge only
            // - resource category → meta only (not also in badge / aside)
            // - score → one inline row (no aside clone)
            const card = (
              <MeEntityCard
                fullHeight
                icon={icon}
                tone={type}
                iconWellClassName={
                  type === "resource"
                    ? ME_FILE_THUMB_WELL
                    : getEntityFaWellClass(type)
                }
                interactive={Boolean(href)}
                title={getFavoriteTitle(item)}
                tags={
                  <EntityTypeBadge
                    type={type}
                    label={getFavoriteTypeLabel(item)}
                  />
                }
                meta={
                  <div className={ME_CARD_META}>
                    <span className="shrink-0">
                      {formatDateTime(item.created_at)}
                    </span>
                    {categoryLabel ? (
                      <>
                        <span className={ME_META_DOT}>·</span>
                        <span className="min-w-0 truncate">
                          {categoryLabel}
                        </span>
                      </>
                    ) : null}
                  </div>
                }
                stats={
                  hasScore ? (
                    <span className="inline-flex items-center gap-1.5">
                      <StarRating
                        score={Number(item.avg_score)}
                        size="11px"
                        fillClassName={theme.starFillClassName}
                      />
                      <span
                        className={`text-sm font-semibold tabular-nums ${theme.badgeTextClassName}`}
                      >
                        {Number(item.avg_score).toFixed(1)}
                      </span>
                    </span>
                  ) : undefined
                }
              />
            );

            if (!href) {
              return (
                <div key={`${type}-${item.id}`} className="min-h-0">
                  {card}
                </div>
              );
            }

            return (
              <Link
                key={`${type}-${item.id}`}
                href={href}
                className="block min-h-0"
              >
                {card}
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
