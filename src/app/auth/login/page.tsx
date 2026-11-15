"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { RootmapLogo } from "@/components/rootmap/Logo";

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("invalid login") ||
    m.includes("invalid credentials") ||
    m.includes("email not confirmed")
  ) {
    return "Email ou senha incorretos.";
  }
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, resetPassword, user, loading: authLoading } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/foco");
    }
  }, [user, authLoading, router]);

  const handleForgotPassword = useCallback(async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Informe seu e-mail acima para recuperar a senha.");
      return;
    }
    setLoading(true);
    const { error: resetErr } = await resetPassword(email.trim());
    setLoading(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setInfo(
      "Se existir conta com este e-mail, você receberá instruções para redefinir a senha."
    );
  }, [email, resetPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(mapAuthError(signInError.message));
      setLoading(false);
      return;
    }
    router.push("/foco");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--rm-panel)]">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--rm-muted)]">
          Carregando…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--rm-panel)] text-[var(--rm-ink)]">
      <nav className="border-b-2 border-[var(--rm-ink)] bg-[var(--rm-paper)] px-6 py-4">
        <Link href="/">
          <RootmapLogo />
        </Link>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--rm-muted)]">
              Rootmap
            </div>
            <h1 className="rm-display text-3xl font-extrabold tracking-tight">
              Entrar
            </h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div className="rm-card overflow-hidden p-0">
              <label className="block px-4 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--rm-muted)]">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full border-b border-[var(--rm-line)] bg-transparent px-4 py-3 outline-none"
              />
              <label className="block px-4 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--rm-muted)]">
                Senha
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-transparent px-4 py-3 outline-none"
              />
            </div>

            {error && (
              <div className="rounded-[10px] border-2 border-red-700 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-[10px] border-2 border-[var(--rm-ink)] px-4 py-3 text-xs font-semibold">
                {info}
              </div>
            )}

            <button type="submit" disabled={loading} className="rm-btn w-full">
              {loading ? "Entrando…" : "Entrar →"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--rm-muted)]"
            >
              Esqueceu a senha?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
