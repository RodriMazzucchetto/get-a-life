"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ModalKind = "opp" | "sol" | "task";

const KEYS: ModalKind[] = ["opp", "sol", "task"];

export function useRootmapModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = useMemo(() => {
    for (const kind of KEYS) {
      const id = searchParams.get(kind);
      if (id) return { kind, id };
    }
    return null;
  }, [searchParams]);

  const open = useCallback(
    (kind: ModalKind, id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const k of KEYS) params.delete(k);
      // keep filter params like obj=
      params.set(kind, id);
      const q = params.toString();
      router.push(`${pathname}?${q}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of KEYS) params.delete(k);
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return { active, open, close };
}
