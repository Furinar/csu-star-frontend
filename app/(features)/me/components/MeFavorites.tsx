"use client";

import Link from "next/link";
import {useState} from "react";
import GlassCard from "@/components/ui/GlassCard";
import EntityTypeBadge from "@/components/ui/EntityTypeBadge";
import type {EntityThemeKey} from "@/lib/entityTheme";
import { buildCoursePath, buildResourcePath, buildTeacherPath } from "@/lib/paths";
import type {FavoriteItem, PaginatedData} from "@/types/me";
import {
  formatDateTime,
  getResourceTypeLabel,
} from "./shared/helpers";

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
      : typeof targetId === "number" && Number.isFinite(targetId) && targetId > 0
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

export default function MeFavorites({favorites}: MeFavoritesProps) {
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
          {[
            {key: "all" as const, label: "全部"},
            {key: "resource" as const, label: "资源"},
            {key: "course" as const, label: "课程"},
            {key: "teacher" as const, label: "教师"},
          ].map((item) => (
              <button
                  key={item.key}
                  type="button"
                  onClick={() => setFavoriteFilter(item.key)}
                  className={`rounded-full px-2.5 py-1 text-xs transition sm:px-3 sm:py-1.5 sm:text-sm ${
                      favoriteFilter === item.key
                          ? "bg-first text-white"
                          : "border border-gray-200/70 bg-white/50 text-gray-600 hover:bg-white/70"
                  }`}
              >
                {item.label}
              </button>
          ))}
        </div>

        {filteredFavorites.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredFavorites.map((item) => {
                const href = getFavoriteHref(item);
                const cardContent = (
                    <GlassCard
                        className="rounded-xl p-3 transition-all hover:bg-white/55 hover:shadow-[0_12px_36px_0_rgba(31,38,135,0.18)] md:rounded-2xl md:p-5"
                    >
                      <div className="mb-2.5 flex items-start justify-between gap-2.5 md:mb-3 md:gap-3">
                        <div className="min-w-0">
                          <h4 className="text-[15px] font-semibold leading-6 text-gray-900 md:text-base">
                            {getFavoriteTitle(item)}
                          </h4>
                          <p className="mt-1 text-xs text-gray-500 md:text-sm">
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
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600 md:gap-3 md:text-sm">
                        {item.resource_type ? (
                            <StatPill
                                label="资源类型"
                                value={getResourceTypeLabel(item.resource_type)}
                            />
                        ) : null}
                        {item.avg_score != null ? (
                            <StatPill
                                label="评分"
                                value={`${item.avg_score}`}
                            />
                        ) : null}
                      </div>
                    </GlassCard>
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

function StatPill({label, value}: { label: string; value: string }) {
  return (
      <div className="rounded-full border border-gray-200/70 bg-white/55 px-2.5 py-1 text-[11px] text-gray-600 md:px-3 md:py-1.5 md:text-xs">
        <span className="mr-2 text-gray-400">{label}</span>
        <span className="font-medium text-gray-800">{value}</span>
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
      <GlassCard className="rounded-xl border-dashed p-6 text-center md:rounded-2xl md:p-12">
        <img
            src="/undraw_mcp-server_7kvc.svg"
            alt="空状态插画"
            className="mx-auto mb-3 h-20 w-auto opacity-90 md:mb-4 md:h-24"
        />
        <h3 className="mb-1.5 text-lg font-medium text-gray-800 md:mb-2 md:text-xl">{title}</h3>
        <p className="mx-auto max-w-md text-sm text-gray-500 md:text-base">{description}</p>
      </GlassCard>
  );
}
