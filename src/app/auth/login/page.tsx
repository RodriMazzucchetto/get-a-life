"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

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
      router.replace("/os/reports");
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
    setInfo("Se existir conta com este e-mail, você receberá instruções para redefinir a senha.");
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
    router.push("/os/reports");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ta-paper font-mono">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
          Carregando…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-ta-paper font-mono text-ta-ink">
      {/* Nav */}
      <nav className="border-b-[1.5px] border-ta-ink px-6 py-4 md:px-10">
        <Link href="/">
          <BrandLogo variant="horizontal" className="origin-left" />
        </Link>
      </nav>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-10">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
              Acesso restrito
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">
              Entrar no sistema
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-0">
            <div className="border-[1.5px] border-ta-ink">
              {/* Email */}
              <div className="border-b-[1.5px] border-ta-ink">
                <label
                  htmlFor="login-email"
                  className="block border-b border-ta-rule px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-ta-paper px-4 py-3 text-sm font-normal normal-case text-ta-ink placeholder:text-ta-muted-2 focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-ta-cyan)] disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block border-b border-ta-rule px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted"
                >
                  Senha
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-ta-paper px-4 py-3 text-sm font-normal normal-case text-ta-ink placeholder:text-ta-muted-2 focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-ta-cyan)] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Errors / Info */}
            {error && (
              <div className="border-[1.5px] border-ta-red bg-red-50 px-4 py-3 text-xs font-semibold normal-case text-ta-red">
                {error}
              </div>
            )}
            {info && (
              <div className="border-[1.5px] border-ta-ink bg-ta-paper-2 px-4 py-3 text-xs font-semibold normal-case text-ta-ink">
                {info}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full border-[1.5px] border-ta-ink bg-ta-ink py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ta-paper transition-colors hover:bg-ta-ink/90 disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar →"}
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ta-muted transition-colors hover:text-ta-ink disabled:opacity-50"
            >
              Esqueceu a senha?
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-[1.5px] border-ta-ink px-6 py-6 md:px-10">
        <div className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
          © {new Date().getFullYear()} Task Architect — Acesso por convite
        </div>
      </footer>
    </div>
  );
}
