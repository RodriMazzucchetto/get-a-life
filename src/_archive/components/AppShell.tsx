"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuthContext } from "@/contexts/AuthContext";
import { mainNav } from "@/lib/app-navigation";

const NAV_LINK_BASE =
  "flex items-center gap-3 px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] transition-colors border-[1.5px]";

const NAV_LINK_ACTIVE =
  "border-ta-ink bg-ta-ink text-ta-paper";

const NAV_LINK_IDLE =
  "border-transparent text-ta-ink hover:border-ta-ink hover:bg-ta-paper-2";

const FUTURE_ITEM =
  "flex items-center gap-3 px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ta-muted/40 cursor-not-allowed select-none";

const FOOTER_LINK =
  "flex items-center gap-3 px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ta-muted transition-colors hover:bg-ta-paper-2 hover:text-ta-ink w-full text-left";

export function AppShell({
  children,
  fullWidth = false,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuthContext();
  const router = useRouter();
  const isOsRoute = pathname === "/os" || pathname.startsWith("/os/");
  const isPersonalRoute = pathname === "/dashboard/problems";
  const useTaShell = isOsRoute || isPersonalRoute;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const NavLink = ({
    href,
    label,
    icon,
    isActive,
    onNavigate,
  }: {
    href: string;
    label: string;
    icon: string;
    isActive: boolean;
    onNavigate?: () => void;
  }) => (
    <Link
      href={href}
      onClick={onNavigate}
      className={`${NAV_LINK_BASE} ${isActive ? NAV_LINK_ACTIVE : NAV_LINK_IDLE}`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </Link>
  );

  const renderNav = (onNavigate?: () => void) =>
    mainNav.map((item) =>
      item.future ? (
        <span key={item.name} title="Em breve" aria-disabled className={FUTURE_ITEM}>
          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
          {item.name}
        </span>
      ) : (
        <NavLink
          key={item.name + item.href}
          href={item.href}
          label={item.name}
          icon={item.icon}
          isActive={item.active(pathname)}
          onNavigate={onNavigate}
        />
      )
    );

  const renderFooter = (onNavigate?: () => void) => (
    <div className="mt-auto flex flex-col gap-1 border-t-[1.5px] border-ta-ink pt-4">
      <a href="#" className={FOOTER_LINK}>
        <span className="material-symbols-outlined text-[18px]">help</span>
        Suporte
      </a>
      <Link
        href="/dashboard/settings"
        onClick={onNavigate}
        className={`${FOOTER_LINK} ${
          pathname === "/dashboard/settings"
            ? "border-[1.5px] border-ta-ink bg-ta-ink text-ta-paper hover:bg-ta-ink hover:text-ta-paper"
            : ""
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">settings</span>
        Configurações
      </Link>
      {user?.email && (
        <p className="truncate px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ta-muted" title={user.email}>
          {user.email}
        </p>
      )}
      <button type="button" onClick={() => { void handleSignOut(); onNavigate?.(); }} className={FOOTER_LINK}>
        <span className="material-symbols-outlined text-[18px]">logout</span>
        Sair
      </button>
    </div>
  );

  const sidebarClass =
    "flex flex-col fixed left-0 top-0 bottom-0 w-64 z-40 bg-ta-paper border-r-[1.5px] border-ta-ink pt-6 px-4 pb-6";

  return (
    <div className={`min-h-screen font-body ${useTaShell ? "bg-ta-paper text-ta-ink" : "bg-background text-on-surface"}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ta-ink/25 backdrop-blur-sm lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`hidden lg:flex ${sidebarClass}`}>
        <Link href="/os/tasks" className="mb-8 px-1 pt-1 pb-1">
          <BrandLogo variant="sidebar" />
        </Link>
        <nav className="flex flex-col gap-1 flex-1">{renderNav()}</nav>
        {renderFooter()}
      </aside>

      <aside
        className={`${sidebarClass} z-50 p-4 pt-20 transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          className="absolute top-4 right-4 p-2 text-ta-muted hover:bg-ta-paper-2 hover:text-ta-ink"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <Link href="/os/tasks" className="mb-8 px-1 pt-1 pb-1" onClick={() => setSidebarOpen(false)}>
          <BrandLogo variant="sidebar" />
        </Link>
        <nav className="flex flex-col gap-1 flex-1">{renderNav(() => setSidebarOpen(false))}</nav>
        {renderFooter(() => setSidebarOpen(false))}
      </aside>

      <div className="lg:pl-64 min-h-screen">
        <button
          type="button"
          className="lg:hidden fixed top-4 left-4 z-30 p-2 border-[1.5px] border-ta-ink bg-ta-paper text-ta-ink"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <main
          className={`w-full px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pt-6 ${
            fullWidth ? "max-w-none" : "mx-auto max-w-7xl"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
