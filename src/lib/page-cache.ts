"use client";

const CACHE_PREFIX = "studyspark:page-cache:";

function cacheKey(key: string, userId?: string | null): string | null {
  if (!userId) return null;
  return `${CACHE_PREFIX}${userId}:${key}`;
}

export function readPageCache<T>(key: string, userId?: string | null): T | null {
  const storageKey = cacheKey(key, userId);
  if (!storageKey || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writePageCache<T>(
  key: string,
  userId: string | undefined | null,
  value: T
) {
  const storageKey = cacheKey(key, userId);
  if (!storageKey || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Page caches are only a speed boost; storage failures should not break UI.
  }
}
