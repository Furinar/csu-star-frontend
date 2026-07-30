/**
 * In-memory list query cache for stale-while-revalidate UX.
 * Survives client navigations within the same SPA session; cleared on full reload.
 */

type CacheEntry<T> = {
  data: T;
  updatedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

/** Default TTL: 10 minutes. */
export const LIST_CACHE_TTL_MS = 10 * 60 * 1000;

export function readListCache<T>(
  key: string,
  ttlMs: number = LIST_CACHE_TTL_MS,
): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.updatedAt > ttlMs) {
    store.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function writeListCache<T>(key: string, data: T): void {
  store.set(key, { data, updatedAt: Date.now() });
}

export function hasListCache(
  key: string,
  ttlMs: number = LIST_CACHE_TTL_MS,
): boolean {
  return readListCache(key, ttlMs) !== undefined;
}

export function buildLandingListCacheKey(type: string, size: number) {
  return `landing:${type}:size=${size}`;
}

export function buildSearchListCacheKey(
  query: string,
  type: string,
  relevance: boolean,
) {
  return `search:q=${query.trim().toLowerCase()}:type=${type}:rel=${relevance ? 1 : 0}`;
}

export function buildRankListCacheKey(
  category: string,
  filter: string,
  sort: string,
) {
  return `rank:${category}:${filter}:${sort}`;
}
