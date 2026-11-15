"use client";

import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { RootmapLogo } from "@/components/rootmap/Logo";

export default function Home() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--rm-panel)]">
        <p className="text-sm font-medium text-[var(--rm-muted)]">A carregar…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--rm-panel)] text-[var(--rm-ink)]">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <RootmapLogo />
        <Link
          href={user ? "/foco" : "/auth/login"}
          className="rm-btn"
        >
          {user ? "Abrir app" : "Entrar"}
        </Link>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="mb-5 inline-block rounded-full border-2 border-[var(--rm-ink)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--rm-muted)]">
          Opportunity Solution Tree
        </div>
        <h1 className="rm-display mb-6 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
          Do objetivo à task, com foco.
        </h1>
        <p className="mb-10 max-w-xl text-base leading-relaxed text-[var(--rm-muted)] md:text-lg">
          Objetivo → Problema / Oportunidade → Solução → Task. Priorize com
          ordem, ★ foco e agora / próximo / depois. Premissas e testes fecham o
          loop de discovery.
        </p>
        <Link href={user ? "/foco" : "/auth/login"} className="rm-btn inline-flex">
          {user ? "Ir para o Foco" : "Começar"}
        </Link>
      </main>
    </div>
  );
}
