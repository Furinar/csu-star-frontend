import Identicon from "identicon.js";

export const IDENTICON_PREFIX = "identicon:";
export const DEFAULT_AVATAR_SRC = "/default-avatar.svg";

const identiconCache = new Map<string, string>();

export function resolveAvatarSrc(
  avatarUrl: string | null | undefined,
  fallbackAvatar: string,
): string {
  const normalized = avatarUrl?.trim();
  if (!normalized) {
    return fallbackAvatar;
  }

  if (!normalized.startsWith(IDENTICON_PREFIX)) {
    return normalized;
  }

  const hash = normalized.slice(IDENTICON_PREFIX.length);
  if (!/^[a-f0-9]{15,}$/i.test(hash)) {
    return fallbackAvatar;
  }

  const cacheKey = hash.toLowerCase();
  const cached = identiconCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const encoded = new Identicon(cacheKey, {
    size: 128,
    margin: 0.12,
    format: "svg",
    background: [240, 240, 240, 255],
  }).toString();
  const src = `data:image/svg+xml;base64,${encoded}`;
  identiconCache.set(cacheKey, src);
  return src;
}
