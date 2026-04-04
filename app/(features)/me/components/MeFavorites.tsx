"use client";

import {useState} from "react";
import GlassCard from "@/components/ui/GlassCard";
import EntityTypeBadge from "@/components/ui/EntityTypeBadge";
import type {EntityThemeKey} from "@/lib/entityTheme";
import type {FavoriteItem, PaginatedData} from "@/types/me";
import {
  formatDateTime,
  getResourceTypeLabel,
} from "./shared/helpers";

interface MeFavoritesProps {
  favorites: PaginatedData<FavoriteItem>;
}

function getFavoriteType(item: FavoriteItem): EntityThemeKey {
  if (item.resource_type) {
    return "resource";
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
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
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
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredFavorites.map((item) => (
                  <GlassCard
                      key={`${getFavoriteType(item)}-${item.id}`}
                      className="p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {getFavoriteTitle(item)}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          收藏于 {formatDateTime(item.created_at)}
                        </p>
                      </div>
                      <EntityTypeBadge
                          type={getFavoriteType(item)}
                          label={getFavoriteTypeLabel(item)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
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
                      {item.hot_score != null ? (
                          <StatPill
                              label="热度"
                              value={`${item.hot_score}`}
                          />
                      ) : null}
                    </div>
                  </GlassCard>
              ))}
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
      <div className="rounded-full border border-gray-200/70 bg-white/55 px-3 py-1.5 text-xs text-gray-600">
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
      <GlassCard className="border-dashed p-12 text-center">
        <img
            src="/undraw_mcp-server_7kvc.svg"
            alt="空状态插画"
            className="mx-auto mb-4 h-24 w-auto opacity-90"
        />
        <h3 className="mb-2 text-xl font-medium text-gray-800">{title}</h3>
        <p className="mx-auto max-w-md text-gray-500">{description}</p>
      </GlassCard>
  );
}
