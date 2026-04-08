import type { SearchScope } from "@/types/search";

export function buildSearchPageHref(keyword: string, type: SearchScope) {
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    return null;
  }

  const searchParams = new URLSearchParams({
    q: trimmedKeyword,
  });

  if (type !== "all") {
    searchParams.set("type", type);
  }

  return `/search?${searchParams.toString()}`;
}
