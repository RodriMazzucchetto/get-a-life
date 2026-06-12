import type { User } from "@supabase/supabase-js";

/** Lê sessão Supabase do localStorage de forma síncrona (evita flash de loading). */
export function readStoredAuthUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.includes("auth-token")) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const session = JSON.parse(raw) as { user?: User };
      if (session?.user?.id) return session.user;
    }
  } catch {
    /* ignore corrupt storage */
  }

  return null;
}

export function readStoredAuthUserId(): string | null {
  return readStoredAuthUser()?.id ?? null;
}
