import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { BRANDING } from "@/lib/branding";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCzznl50l-xBvjPPFRpzP4oUVGcc9xhPOqv-dFncaqU0SnqBXTpix9BrluDKtEj823DUaJbZxanOstOYuTpwVzA97R_ZU5c250BijJ6Er-uPEOh5phFxV92MwGid-dDeUBTeIq7gb62SGyfP3J2CunuZqUlqvSn1KHYfdX66j04PjuAsCT4ZXYBM0yl_bqVR4jGcVDbKXorCbKZwgj92v9nf6gj4ipU_fy3yRv2vAfy2HmH2PSEFVLMFuipbAoncocFHsmfn-muLCfA";

const BENTO_PROJECT_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAl7nO-hoCtpbMTeuxm2JfWwE64poEqSveGY1qADVUcfDAt616LFnM0FM8515GmyYv7DrE6zlJm2YAjXPeQLNf6u_4fu35HfQA9pD9itpMZCVCxiexCYn5FbYPhC05uPeP7y3QH5FWPRaFTnUbJlM_IoZ-6Ou0zavXvUCzjWaA_VHoMDlN5bCWT0MwcQUtXSLkIqcE-7JLrvI8TxOfa8B8ZW2NuitUI7UEgLkROp4ONKjg1YffU4ixzTjHLHlAreD1txG4RZ0oirUwF";

const BENTO_CHART_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCGxJfoaB9wjhKJ8F2RiLx-g1VYOenqPMoov-LTjFPrIAUsXnqaQz1u2Vpv4r59145kWwNSX-Qn1Y9GN77Vyteg3SDPwtYRYG6t2JhCzJbDKknENy-qG4dcGwV1PxpdHFUbzsuNitR5Jb4dGcYu9VAnDjcf69aYXfE9njbMfpnZf_5AFqilOc9lTgU_Rpcz6U-rj1LT9Qlv0srwyLXqq2GrfYrgOuqqQzLMg9NfJ0wW85bp5NIf9sRpBvKaOf4JsQAuvkUjIGeM8xmu";

type HomeLandingProps = {
  user: User | null;
};

export function HomeLanding({ user }: HomeLandingProps) {
  const appHref = "/dashboard/planning";
  const primaryCtaHref = user ? appHref : "/auth/register";
  const primaryCtaLabel = user ? "Abrir planejamento" : "Comece agora — É grátis";
  const navSecondaryHref = user ? appHref : "/auth/login";
  const navSecondaryLabel = user ? "Planejamento" : "Entrar";
  const navPrimaryHref = user ? appHref : "/auth/register";
  const navPrimaryLabel = user ? "Abrir app" : "Começar";

  return (
    <>
      <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-md flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-full mx-auto fixed top-0 z-50">
        <Link href="/" className="inline-flex items-center shrink-0 min-w-0">
          <img
            src={BRANDING.horizontal}
            alt={BRANDING.name}
            className="h-14 sm:h-16 md:h-[4.5rem] w-auto max-w-[min(92vw,440px)] object-contain object-left"
            width={420}
            height={90}
          />
        </Link>
        <div className="hidden md:flex gap-8 items-center font-headline font-semibold text-sm tracking-tight">
          <Link
            className="text-primary-container border-b-2 border-primary-container pb-1 transition-colors"
            href="#"
          >
            Plataforma
          </Link>
          <Link
            className="text-on-surface-variant hover:text-primary-container transition-colors"
            href="#features"
          >
            Recursos
          </Link>
          <Link
            className="text-on-surface-variant hover:text-primary-container transition-colors"
            href="#cta"
          >
            Começar
          </Link>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            href={navSecondaryHref}
            className="font-headline font-semibold text-sm text-on-surface-variant hover:text-primary-container px-3 py-2 transition-colors"
          >
            {navSecondaryLabel}
          </Link>
          <Link
            href={navPrimaryHref}
            className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-lg font-headline font-bold text-sm shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
          >
            {navPrimaryLabel}
          </Link>
        </div>
      </nav>

      <main className="pt-24 bg-background text-on-surface">
        <section className="relative px-6 md:px-8 pt-16 md:pt-20 pb-24 md:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Novo: modo estratégico
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-headline leading-[1.1] tracking-tight text-on-surface">
                Organize seu fluxo de trabalho com{" "}
                <span className="text-primary italic">precisão</span>.
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-xl leading-relaxed">
                Projetos, metas e tarefas num só lugar. Construído para quem
                arquiteta o próprio tempo.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={primaryCtaHref}
                  className="inline-flex items-center justify-center bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-headline font-bold text-lg shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all"
                >
                  {primaryCtaLabel}
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center bg-surface-container-highest/60 text-on-surface px-8 py-4 rounded-xl font-headline font-bold text-lg hover:bg-surface-container-highest transition-all ring-1 ring-outline-variant/15"
                >
                  Ver recursos
                </Link>
              </div>
            </div>
            <div className="flex-1 relative w-full">
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-secondary-container/30 to-transparent blur-3xl rounded-full pointer-events-none" />
              <div className="bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden ring-1 ring-outline-variant/10">
                <img
                  alt="Pré-visualização do painel TaskArchitect"
                  className="w-full h-auto object-cover"
                  src={HERO_IMG}
                  width={1200}
                  height={800}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="bg-surface-container-low py-24 md:py-32 px-6 md:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 md:mb-16 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-extrabold font-headline mb-6 text-on-surface">
                Uma interface, infinitas formas de entregar.
              </h2>
              <p className="text-on-surface-variant text-lg">
                Três pilares para substituir o caos por sistemas de alto
                desempenho.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto">
              <div className="md:col-span-7 bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between group hover:shadow-lg transition-all ring-1 ring-outline-variant/10">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">
                      tactic
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold font-headline">
                    Projetos e metas
                  </h3>
                  <p className="text-on-surface-variant max-w-md">
                    Transforme visões em etapas concretas. Una metas de longo
                    prazo às tarefas do dia a dia.
                  </p>
                </div>
                <div className="mt-8 overflow-hidden rounded-xl ring-1 ring-outline-variant/10">
                  <img
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    alt=""
                    src={BENTO_PROJECT_IMG}
                    width={800}
                    height={320}
                  />
                </div>
              </div>

              <div className="md:col-span-5 bg-primary text-on-primary rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <span className="material-symbols-outlined text-9xl">
                    view_column
                  </span>
                </div>
                <div className="space-y-4 relative z-10">
                  <h3 className="text-2xl font-bold font-headline">
                    Priorização semanal
                  </h3>
                  <p className="text-primary-fixed-dim/90">
                    O foco não é fazer mais: é fazer o que importa. Organize a
                    semana e arraste tarefas para onde sua energia rende mais.
                  </p>
                </div>
                <div className="space-y-3 mt-8 relative z-10">
                  <div className="bg-primary-container p-4 rounded-xl ring-1 ring-on-primary/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                        Segunda-feira
                      </span>
                      <span className="material-symbols-outlined text-sm">
                        priority_high
                      </span>
                    </div>
                    <div className="font-medium">Revisar backlog e metas</div>
                  </div>
                  <div className="bg-primary-container/40 p-4 rounded-xl ring-1 ring-on-primary/5">
                    <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                      Terça-feira
                    </div>
                    <div className="font-medium">Alinhamento da sprint</div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-12 mt-4">
                <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 shadow-sm ring-1 ring-outline-variant/10 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-tertiary/5 to-transparent pointer-events-none" />
                  <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                    <div className="flex-1 space-y-8">
                      <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-tertiary/10 text-tertiary font-bold text-xs uppercase tracking-widest">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
                        </span>
                        Insights de performance
                      </div>
                      <h3 className="text-3xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tight">
                        Acompanhe o progresso
                      </h3>
                      <p className="text-xl text-on-surface-variant leading-relaxed">
                        Metas com progresso, lembretes e visão clara do que
                        avançou — para otimizar cada ciclo.
                      </p>
                      <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="space-y-1">
                          <div className="text-4xl font-extrabold text-tertiary font-headline">
                            94%
                          </div>
                          <div className="text-sm font-semibold text-on-surface-variant uppercase tracking-tighter">
                            Foco no fluxo
                          </div>
                          <div className="h-1.5 w-full bg-surface-container rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-tertiary rounded-full"
                              style={{ width: "94%" }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-4xl font-extrabold text-primary font-headline">
                            12.4h
                          </div>
                          <div className="text-sm font-semibold text-on-surface-variant uppercase tracking-tighter">
                            Tempo planejado
                          </div>
                          <div className="h-1.5 w-full bg-surface-container rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: "75%" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 w-full lg:max-w-md">
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-outline-variant/10 bg-surface-container-highest">
                        <img
                          className="w-full h-[320px] object-cover transition-transform duration-700 group-hover:scale-105"
                          alt=""
                          src={BENTO_CHART_IMG}
                          width={640}
                          height={320}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl ring-1 ring-white/50 shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary">
                              <span className="material-symbols-outlined text-sm">
                                trending_up
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-on-surface uppercase">
                                Tendência de entrega
                              </div>
                              <div className="text-[10px] text-on-surface-variant">
                                Ciclo a ciclo, com mais clareza
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="py-24 px-6 md:px-8">
          <div className="max-w-5xl mx-auto bg-surface-container-highest rounded-3xl p-10 md:p-20 text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-3xl md:text-5xl font-extrabold font-headline mb-8 text-on-surface relative z-10">
              Pronto para elevar sua arquitetura de trabalho?
            </h2>
            <p className="text-lg md:text-xl text-on-surface-variant mb-12 max-w-2xl mx-auto relative z-10">
              Entre e leve o planejamento GTD para o próximo nível — com calma e
              precisão.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link
                href={primaryCtaHref}
                className="inline-flex justify-center bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-5 rounded-xl font-headline font-bold text-lg hover:opacity-95 transition-all shadow-lg shadow-primary/15"
              >
                {user ? "Ir ao planejamento" : "Começar gratuitamente"}
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex justify-center bg-surface-container-lowest text-on-surface px-10 py-5 rounded-xl font-headline font-bold text-lg hover:bg-surface-bright transition-all ring-1 ring-outline-variant/20"
              >
                {user ? "Conta" : "Já tenho conta"}
              </Link>
            </div>
            <p className="mt-8 text-sm text-on-surface-variant/70 font-medium relative z-10">
              Sem cartão para explorar. Comece no seu ritmo.
            </p>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 bg-surface-container-low text-on-surface-variant">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 max-w-7xl mx-auto font-body text-xs gap-6">
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            <a className="hover:text-primary-container transition-colors" href="#">
              Privacidade
            </a>
            <a className="hover:text-primary-container transition-colors" href="#">
              Termos
            </a>
            <a className="hover:text-primary-container transition-colors" href="#">
              Segurança
            </a>
          </div>
          <div className="text-center md:text-right">
            © {new Date().getFullYear()} {BRANDING.name}. Precisão no fluxo de trabalho.
          </div>
        </div>
      </footer>
    </>
  );
}
