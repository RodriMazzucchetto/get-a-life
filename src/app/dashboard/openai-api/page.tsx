"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { OpenaiBalanceTracker } from "@/types";

const LINKS = [
  {
    label: "Faturação e limites",
    href: "https://platform.openai.com/settings/organization/billing/overview",
    description: "Saldo, método de pagamento e limites da organização.",
  },
  {
    label: "Uso (Usage)",
    href: "https://platform.openai.com/usage",
    description: "Consumo por API e período.",
  },
  {
    label: "Conta OpenAI",
    href: "https://platform.openai.com/account/overview",
    description: "Visão geral da conta.",
  },
] as const;

function formatCheckedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function OpenAiApiPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastBalanceLabel, setLastBalanceLabel] = useState("");
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("onboarding_data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      const od = data?.onboarding_data as { openaiBalanceTracker?: OpenaiBalanceTracker } | null | undefined;
      const t: OpenaiBalanceTracker | undefined = od?.openaiBalanceTracker;
      if (t?.lastBalanceLabel) setLastBalanceLabel(t.lastBalanceLabel);
      if (t?.lastCheckedAt) {
        const d = new Date(t.lastCheckedAt);
        if (!Number.isNaN(d.getTime())) {
          setLastCheckedAt(d.toISOString().slice(0, 16));
        }
      }
      if (t?.notes) setNotes(t.notes);
      if (!t?.lastCheckedAt) {
        setLastCheckedAt(new Date().toISOString().slice(0, 16));
      }
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const { data: row, error: fetchErr } = await supabase
        .from("user_profiles")
        .select("full_name, onboarding_data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchErr) {
        console.error(fetchErr);
        setMessage("Não foi possível carregar o perfil.");
        return;
      }

      const prevOd =
        row?.onboarding_data &&
        typeof row.onboarding_data === "object" &&
        row.onboarding_data !== null
          ? (row.onboarding_data as Record<string, unknown>)
          : {};
      const tracker: OpenaiBalanceTracker = {
        lastBalanceLabel: lastBalanceLabel.trim() || "—",
        lastCheckedAt: lastCheckedAt
          ? new Date(lastCheckedAt).toISOString()
          : new Date().toISOString(),
        notes: notes.trim() || undefined,
      };

      const { error } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          full_name: row?.full_name?.trim() || "Usuário",
          onboarding_data: { ...prevOd, openaiBalanceTracker: tracker },
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error(error);
        setMessage("Não foi possível salvar.");
        return;
      }
      setMessage("Registo atualizado.");
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      console.error(e);
      setMessage("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <section className="rounded-2xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/15">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
          OpenAI — referência manual
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          O TaskArchitect{" "}
          <strong className="font-semibold text-on-surface">não se liga</strong> à API da OpenAI nem
          guarda chaves. Usa esta página para ver atalhos ao site oficial e, se quiseres, anotar o
          último saldo ou crédito que viste — para não teres de abrir o painel da OpenAI sempre.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl bg-surface-container-lowest p-5 ring-1 ring-outline-variant/10 transition hover:ring-primary/30"
          >
            <span className="font-headline text-base font-bold text-primary group-hover:underline">
              {link.label}
            </span>
            <span className="mt-2 text-xs leading-relaxed text-on-surface-variant">
              {link.description}
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              platform.openai.com
            </span>
          </a>
        ))}
      </section>

      <section className="rounded-xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/10">
        <h2 className="font-headline text-lg font-bold text-on-surface">Último valor que viste</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Copia do painel da OpenAI (faturação ou uso) e regista aqui quando verificares.
        </p>

        <div className="mt-6 grid max-w-xl gap-4">
          <div>
            <label htmlFor="balance-label" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Saldo / crédito (texto livre)
            </label>
            <input
              id="balance-label"
              type="text"
              value={lastBalanceLabel}
              onChange={(e) => setLastBalanceLabel(e.target.value)}
              placeholder='Ex.: "$8,20" ou "Abaixo de $5"'
              className="mt-1 w-full rounded-lg border border-outline-variant/25 bg-surface-container-low px-3 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="checked-at" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Quando verificaste
            </label>
            <input
              id="checked-at"
              type="datetime-local"
              value={lastCheckedAt}
              onChange={(e) => setLastCheckedAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant/25 bg-surface-container-low px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lembrete para ti mesmo…"
              className="mt-1 w-full resize-y rounded-lg border border-outline-variant/25 bg-surface-container-low px-3 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-95 disabled:opacity-50"
            >
              {saving ? "A guardar…" : "Guardar registo"}
            </button>
            {message ? (
              <span className="text-sm text-tertiary" role="status">
                {message}
              </span>
            ) : null}
          </div>
        </div>

        {lastBalanceLabel.trim() && lastCheckedAt ? (
          <p className="mt-6 rounded-lg bg-primary-container/15 px-4 py-3 text-sm text-on-surface">
            <span className="font-semibold">Resumo:</span> {lastBalanceLabel.trim()} — visto em{" "}
            {formatCheckedAt(new Date(lastCheckedAt).toISOString())}
          </p>
        ) : null}
      </section>
    </div>
  );
}
