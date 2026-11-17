"use client";

import { startTransition, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ModalKind = "opp" | "sol" | "task";

const KEYS: ModalKind[] = ["opp", "sol", "task"];

function stripModalParams(params: URLSearchParams) {
  for (const k of KEYS) params.delete(k);
}

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

  /** Abre uma modal (empilha no histórico do browser). */
  const open = useCallback(
    (kind: ModalKind, id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      stripModalParams(params);
      params.set(kind, id);
      const q = params.toString();
      startTransition(() => {
        router.push(`${pathname}?${q}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  /**
   * Voltar: restaura a modal anterior no histórico (ou a página por baixo).
   * Cada open() faz push — a pilha fica no browser history.
   */
  const back = useCallback(() => {
    startTransition(() => {
      router.back();
    });
  }, [router]);

  /** Fecha todas as modais (sem passar pela pilha). */
  const closeAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    stripModalParams(params);
    const q = params.toString();
    startTransition(() => {
      router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  return { active, open, back, close: back, closeAll };
}
