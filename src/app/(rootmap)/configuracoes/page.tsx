"use client";

import { useAuthContext } from "@/contexts/AuthContext";

export default function ConfigPage() {
  const { user } = useAuthContext();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="rm-display text-[36px] font-extrabold">Configurações</h1>
      <p className="text-[15px] text-[var(--rm-muted)]">
        Conta: <strong>{user?.email}</strong>
      </p>
      <p className="text-[14px] leading-relaxed text-[var(--rm-muted)]">
        Rootmap usa o projeto Supabase <strong>GTD 2.0</strong> e o deploy
        Vercel <strong>get-a-life</strong>. O framework antigo (OS, Pessoal,
        Relatórios, ciclos) está em <code>src/_archive</code> — não deletado.
      </p>
    </div>
  );
}
