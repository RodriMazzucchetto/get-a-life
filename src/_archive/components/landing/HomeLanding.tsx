import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { BrandLogo } from "@/components/BrandLogo";

type HomeLandingProps = {
  user: User | null;
};

export function HomeLanding({ user }: HomeLandingProps) {
  const appHref = "/os/reports";

  return (
    <div className="min-h-screen bg-ta-paper text-ta-ink font-mono">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b-[1.5px] border-ta-ink bg-ta-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" className="shrink-0">
            <BrandLogo variant="horizontal" className="origin-left" />
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <Link
                href={appHref}
                className="border-[1.5px] border-ta-ink bg-ta-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ta-paper transition-colors hover:bg-ta-ink/90"
              >
                Abrir app
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="border-[1.5px] border-ta-ink bg-ta-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ta-paper transition-colors hover:bg-ta-ink/90"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-[73px]">
        {/* Hero */}
        <section className="border-b-[1.5px] border-ta-ink px-6 py-24 md:px-10 md:py-36">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 inline-block border-[1.5px] border-ta-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
              Sistema GTD 2.0
            </div>

            <h1 className="mb-8 max-w-4xl text-4xl font-bold uppercase leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Arquitete seu{" "}
              <span className="text-ta-cyan">tempo</span>{" "}
              com precisão.
            </h1>

            <p className="mb-12 max-w-xl text-sm font-normal normal-case leading-relaxed text-ta-muted md:text-base">
              Projetos, metas, tarefas e foco num sistema único. Construído para
              quem trata o próprio tempo como o recurso mais escasso.
            </p>

            {user ? (
              <Link
                href={appHref}
                className="inline-block border-[1.5px] border-ta-ink bg-ta-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ta-paper transition-colors hover:bg-ta-ink/90"
              >
                Ir para o planejamento →
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="inline-block border-[1.5px] border-ta-ink bg-ta-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ta-paper transition-colors hover:bg-ta-ink/90"
              >
                Entrar no sistema →
              </Link>
            )}
          </div>
        </section>

        {/* Pilares */}
        <section className="border-b-[1.5px] border-ta-ink px-6 py-20 md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
              Três camadas de clareza
            </div>

            <div className="grid grid-cols-1 gap-0 border-[1.5px] border-ta-ink md:grid-cols-3">
              {/* OS */}
              <div className="border-b-[1.5px] border-ta-ink p-8 md:border-b-0 md:border-r-[1.5px]">
                <div className="mb-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
                  01 — Operating System
                </div>
                <h3 className="mb-4 text-xl font-bold uppercase tracking-tight">
                  Estratégia
                </h3>
                <p className="text-xs font-normal normal-case leading-relaxed text-ta-muted">
                  Blocos, metas e ciclos. Uma visão clara do que você está
                  construindo em Finance, Growth e Ops. Cada aposta com ciclo,
                  progresso e execução rastreados.
                </p>
                <div className="mt-8 space-y-2">
                  {["Metas por pilar", "Apostas", "Ciclos de execução", "Weekly updates"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[11px] uppercase tracking-wide">
                      <span className="h-px w-4 bg-ta-cyan" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks OS */}
              <div className="border-b-[1.5px] border-ta-ink p-8 md:border-b-0 md:border-r-[1.5px]">
                <div className="mb-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
                  02 — Tasks OS
                </div>
                <h3 className="mb-4 text-xl font-bold uppercase tracking-tight">
                  Execução
                </h3>
                <p className="text-xs font-normal normal-case leading-relaxed text-ta-muted">
                  Board kanban com priorização por importância, urgência e
                  esforço. Tasks que se movem do backlog ao foco com intenção —
                  não por impulso.
                </p>
                <div className="mt-8 space-y-2">
                  {["Score I × U ÷ Esforço", "Backlog → Semana → Foco", "On hold com contexto", "Projetos vinculados"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[11px] uppercase tracking-wide">
                      <span className="h-px w-4 bg-ta-cyan" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pessoal */}
              <div className="p-8">
                <div className="mb-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
                  03 — Pessoal
                </div>
                <h3 className="mb-4 text-xl font-bold uppercase tracking-tight">
                  Clareza
                </h3>
                <p className="text-xs font-normal normal-case leading-relaxed text-ta-muted">
                  Problemas, lembretes e planejamento semanal numa visão única.
                  Registre o que bloqueia, priorize o que importa e avance com
                  menos ruído mental.
                </p>
                <div className="mt-8 space-y-2">
                  {["Log de problemas", "Planejamento semanal", "Lembretes ativos", "Fila de foco"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[11px] uppercase tracking-wide">
                      <span className="h-px w-4 bg-ta-cyan" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Princípios */}
        <section className="border-b-[1.5px] border-ta-ink px-6 py-20 md:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
              <div className="border-b-[1.5px] border-ta-ink pb-12 pr-0 md:border-b-0 md:border-r-[1.5px] md:pb-0 md:pr-16">
                <div className="mb-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
                  Filosofia
                </div>
                <h2 className="mb-6 text-3xl font-bold uppercase leading-tight tracking-tight md:text-4xl">
                  Não é sobre fazer mais.
                  <br />
                  <span className="text-ta-muted">É sobre fazer o certo.</span>
                </h2>
                <p className="text-xs font-normal normal-case leading-relaxed text-ta-muted">
                  A maioria das ferramentas de produtividade incentiva volume.
                  Task Architect é construído ao redor do GTD — capturar,
                  clarificar, organizar, refletir e executar. Um sistema que
                  amplifica intenção, não ansiedade.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-0 pt-12 md:pt-0 md:pl-16">
                {[
                  { label: "Score de prioridade", desc: "Importância × Urgência ÷ Esforço — não achismo." },
                  { label: "Ciclos de execução", desc: "Cada meta vive dentro de um ciclo com início e fim." },
                  { label: "Contexto preservado", desc: "Problemas e decisões documentados, não esquecidos." },
                  { label: "Foco operacional", desc: "Uma tela, um objetivo: o que você faz hoje importa." },
                ].map(({ label, desc }) => (
                  <div key={label} className="border-l-[1.5px] border-ta-ink pl-6 pb-8">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ta-cyan">
                      {label}
                    </div>
                    <p className="text-xs font-normal normal-case leading-relaxed text-ta-muted">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-6 py-24 md:px-10 md:py-36">
          <div className="mx-auto max-w-7xl">
            <div className="border-[1.5px] border-ta-ink p-12 md:p-20">
              <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
                Acesso restrito
              </div>
              <h2 className="mb-6 text-3xl font-bold uppercase leading-tight tracking-tight md:text-5xl">
                Sistema fechado.<br />
                <span className="text-ta-cyan">Acesso por convite.</span>
              </h2>
              <p className="mb-10 max-w-md text-xs font-normal normal-case leading-relaxed text-ta-muted">
                Task Architect não tem registro público. Se você já tem acesso,
                entre com suas credenciais abaixo.
              </p>
              {user ? (
                <Link
                  href={appHref}
                  className="inline-block border-[1.5px] border-ta-ink bg-ta-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ta-paper transition-colors hover:bg-ta-ink/90"
                >
                  Ir para o planejamento →
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-block border-[1.5px] border-ta-ink bg-ta-ink px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ta-paper transition-colors hover:bg-ta-ink/90"
                >
                  Entrar →
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-[1.5px] border-ta-ink px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
            © {new Date().getFullYear()} Task Architect — GTD 2.0
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ta-muted">
            Precisão no fluxo de trabalho.
          </div>
        </div>
      </footer>
    </div>
  );
}
