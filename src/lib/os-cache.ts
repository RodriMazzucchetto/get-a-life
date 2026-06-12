/** Cache em memória (sessão) para dados OS — evita refetch completo ao navegar. */

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export const OS_CACHE_TTL_MS = 60_000;

export function osCacheKey(...parts: (string | number | null | undefined)[]): string {
  return parts.filter((p) => p != null && p !== "").join(":");
}

export function getOsCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  return entry?.data ?? null;
}

export function setOsCache<T>(key: string, data: T): void {
  store.set(key, { data, fetchedAt: Date.now() });
}

export function isOsCacheFresh(key: string, ttlMs = OS_CACHE_TTL_MS): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < ttlMs;
}

export function invalidateOsCache(keyPrefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) store.delete(key);
  }
}

export function invalidateAllOsCacheForUser(userId: string): void {
  invalidateOsCache(`${userId}:`);
}
