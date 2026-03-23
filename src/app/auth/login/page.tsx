"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { BRANDING } from "@/lib/branding";

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("invalid login") ||
    m.includes("invalid credentials") ||
    m.includes("email not confirmed")
  ) {
    return "Email ou senha incorretos. Verifique os dados ou confirme o e-mail.";
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
      router.replace("/dashboard/planning");
    }
  }, [user, authLoading, router]);

  const handleForgotPassword = useCallback(async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Informe seu e-mail acima para enviarmos o link de recuperação.");
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

    router.push("/dashboard/planning");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-on-surface">
        <div
          className="h-12 w-12 rounded-full border-2 border-outline-variant border-t-primary animate-spin"
          aria-hidden
        />
        <p className="text-sm font-medium text-on-surface-variant font-body">Carregando…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background font-body text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] max-w-md h-[40%] bg-secondary-container/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] max-w-sm h-[30%] bg-tertiary-fixed/10 blur-[100px] rounded-full pointer-events-none" />

      <section className="w-full max-w-[440px] z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <img
              src={BRANDING.stacked}
              alt={BRANDING.name}
              className="h-24 sm:h-28 w-auto max-w-[min(280px,90vw)] object-contain mx-auto"
              width={280}
              height={112}
            />
          </Link>
          <p className="font-headline text-on-surface-variant text-sm mt-4 tracking-tight">
            Precisão para o seu fluxo de trabalho
          </p>
        </div>

        <div
          className="bg-surface-container-lowest rounded-xl p-8 md:p-10 backdrop-blur-xl ring-1 ring-outline-variant/10"
          style={{
            boxShadow: "0 12px 24px rgba(25, 28, 30, 0.06)",
          }}
        >
          <div className="mb-8">
            <h2 className="font-headline font-bold text-2xl text-on-surface">Bem-vindo</h2>
            <p className="font-body text-on-surface-variant text-sm mt-1">
              Acesse sua área de planejamento
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1">
              <label
                className="font-body font-semibold text-xs text-on-secondary-fixed-variant tracking-wider uppercase px-1"
                htmlFor="login-email"
              >
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="quiet-input w-full bg-surface-container-high py-3 px-4 text-on-surface font-body text-sm rounded-t-lg placeholder:text-on-surface-variant/60 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center gap-2 px-1">
                <label
                  className="font-body font-semibold text-xs text-on-secondary-fixed-variant tracking-wider uppercase"
                  htmlFor="login-password"
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-primary font-body text-xs font-medium hover:underline transition-all shrink-0 disabled:opacity-50"
                >
                  Esqueceu a senha?
                </button>
              </div>
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
                className="quiet-input w-full bg-surface-container-high py-3 px-4 text-on-surface font-body text-sm rounded-t-lg placeholder:text-on-surface-variant/60 disabled:opacity-60"
              />
            </div>

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm bg-error-container text-on-error-container"
                role="alert"
              >
                {error}
              </div>
            )}
            {info && (
              <div
                className="rounded-lg px-4 py-3 text-sm bg-secondary-container/80 text-on-secondary-fixed"
                role="status"
              >
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold py-4 rounded-lg shadow-sm hover:opacity-95 active:scale-[0.98] transition-all duration-200 mt-4 disabled:opacity-60 disabled:active:scale-100"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-outline-variant/15 text-center">
            <p className="font-body text-sm text-on-surface-variant">
              Não tem uma conta?{" "}
              <Link
                href="/auth/register"
                className="text-primary font-semibold hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        <footer className="mt-12 flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-6">
            <a
              className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Privacidade
            </a>
            <a
              className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Termos
            </a>
            <a
              className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Suporte
            </a>
          </div>
          <p className="font-body text-[10px] text-outline opacity-60 tracking-widest uppercase text-center">
            © {new Date().getFullYear()} {BRANDING.name}. Precisão no fluxo de trabalho.
          </p>
        </footer>
      </section>
    </main>
  );
}
