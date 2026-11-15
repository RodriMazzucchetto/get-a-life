/** Cache OS — memória + sessionStorage (sobrevive navegação entre /dashboard e /os). */

import type { OsBetRow, OsBetUpdateRow, OsTaskRow } from "@/lib/os-types";
import type { OsBlockView, OsProjectOption } from "@/lib/os-queries";
import { OS_SELECTED_PROJECT_KEY } from "@/lib/os-queries";
import { readStoredAuthUserId } from "@/lib/auth-session";

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const SESSION_PREFIX = "ta-os:";

export const OS_CACHE_TTL_MS = 5 * 60_000;

export function osCacheKey(...parts: (string | number | null | undefined)[]): string {
  return parts.filter((p) => p != null && p !== "").join(":");
}

export type OsBoardCache = {
  board: OsBlockView[];
  latestUpdatesEntries: [string, OsBetUpdateRow][];
};

export type OsTasksCache = {
  tasks: OsTaskRow[];
  projects: OsProjectOption[];
  betsByIdEntries: [string, OsBetRow][];
};

export function packBoardCache(data: {
  board: OsBlockView[];
  latestUpdates: Map<string, OsBetUpdateRow>;
}): OsBoardCache {
  return {
    board: data.board,
    latestUpdatesEntries: [...data.latestUpdates.entries()],
  };
}

export function unpackBoardCache(packed: OsBoardCache): {
  board: OsBlockView[];
  latestUpdates: Map<string, OsBetUpdateRow>;
} {
  return {
    board: packed.board,
    latestUpdates: new Map(packed.latestUpdatesEntries),
  };
}

export function packTasksCache(data: {
  tasks: OsTaskRow[];
  projects: OsProjectOption[];
  betsById: Map<string, OsBetRow>;
}): OsTasksCache {
  return {
    tasks: data.tasks,
    projects: data.projects,
    betsByIdEntries: [...data.betsById.entries()],
  };
}

export function unpackTasksCache(packed: OsTasksCache): {
  tasks: OsTaskRow[];
  projects: OsProjectOption[];
  betsById: Map<string, OsBetRow>;
} {
  return {
    tasks: packed.tasks,
    projects: packed.projects,
    betsById: new Map(packed.betsByIdEntries),
  };
}

function readSessionEntry<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed?.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionEntry<T>(key: string, entry: CacheEntry<T>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* quota — memória ainda funciona */
  }
}

export function getOsCache<T>(key: string): T | null {
  const mem = store.get(key) as CacheEntry<T> | undefined;
  if (mem) return mem.data;

  const session = readSessionEntry<T>(key);
  if (session) {
    store.set(key, session);
    return session.data;
  }
  return null;
}

export function setOsCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, fetchedAt: Date.now() };
  store.set(key, entry);
  writeSessionEntry(key, entry);
}

export function isOsCacheFresh(key: string, ttlMs = OS_CACHE_TTL_MS): boolean {
  const entry = store.get(key) ?? readSessionEntry(key);
  if (!entry) return false;
  if (!store.has(key)) store.set(key, entry);
  return Date.now() - entry.fetchedAt < ttlMs;
}

export function invalidateOsCache(keyPrefix: string): void {
  for (const key of [...store.keys()]) {
    if (key.startsWith(keyPrefix)) store.delete(key);
  }
  if (typeof window !== "undefined") {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(SESSION_PREFIX + keyPrefix)) {
        sessionStorage.removeItem(k);
      }
    }
  }
}

export function invalidateOsProjectsCache(userId: string): void {
  invalidateOsCacheEntry(osCacheKey(userId, "companies"));
  invalidateOsCacheEntry(osCacheKey(userId, "tasks-board"));
}

export function invalidateAllOsCacheForUser(userId: string): void {
  invalidateOsCache(`${userId}:`);
}

export function invalidateOsCacheEntry(key: string): void {
  store.delete(key);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_PREFIX + key);
  }
}

export type OsBootstrapSnapshot = {
  userId: string | null;
  projects: OsProjectOption[];
  selectedProjectId: string | null;
  board: OsBlockView[];
  latestUpdates: Map<string, OsBetUpdateRow>;
  boardReady: boolean;
  tasks: OsTaskRow[];
  taskProjects: OsProjectOption[];
  betsById: Map<string, OsBetRow>;
  tasksReady: boolean;
};

/** Hidratação síncrona no primeiro render — evita "Carregando OS..." com cache válido. */
export function readOsBootstrapSnapshot(): OsBootstrapSnapshot {
  const empty: OsBootstrapSnapshot = {
    userId: null,
    projects: [],
    selectedProjectId: null,
    board: [],
    latestUpdates: new Map(),
    boardReady: false,
    tasks: [],
    taskProjects: [],
    betsById: new Map(),
    tasksReady: false,
  };

  const userId = readStoredAuthUserId();
  if (!userId) return empty;

  const projects = getOsCache<OsProjectOption[]>(osCacheKey(userId, "companies")) ?? [];
  let selectedProjectId: string | null = null;

  if (projects.length > 0) {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(OS_SELECTED_PROJECT_KEY) : null;
    const storedValid = stored && projects.some((p) => p.id === stored);
    selectedProjectId = storedValid ? stored : (projects[0]?.id ?? null);
  }

  let board: OsBlockView[] = [];
  let latestUpdates = new Map<string, OsBetUpdateRow>();
  let boardReady = false;

  if (selectedProjectId) {
    const boardPacked = getOsCache<OsBoardCache>(osCacheKey(userId, "board", selectedProjectId));
    if (boardPacked) {
      const unpacked = unpackBoardCache(boardPacked);
      board = unpacked.board;
      latestUpdates = unpacked.latestUpdates;
      boardReady = board.length > 0;
    }
  }

  const tasksPacked = getOsCache<OsTasksCache>(osCacheKey(userId, "tasks-board"));
  const tasksUnpacked = tasksPacked ? unpackTasksCache(tasksPacked) : null;

  return {
    userId,
    projects,
    selectedProjectId,
    board,
    latestUpdates,
    boardReady,
    tasks: tasksUnpacked?.tasks ?? [],
    taskProjects: tasksUnpacked?.projects ?? [],
    betsById: tasksUnpacked?.betsById ?? new Map(),
    tasksReady: Boolean(tasksUnpacked),
  };
}
