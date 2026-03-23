"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { BRANDING } from "@/lib/branding";

const mainNav: {
  name: string;
  href: string;
  icon: string;
  /** Item não clicável — funcionalidade futura */
  future?: boolean;
  active: (pathname: string) => boolean;
}[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "grid_view",
    future: true,
    active: () => false,
  },
  {
    name: "Tarefas",
    href: "/dashboard/planning",
    icon: "checklist",
    active: (pathname) => pathname === "/dashboard/planning",
  },
  {
    name: "Relatórios",
    href: "#",
    icon: "analytics",
    future: true,
    active: () => false,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuthContext();
  const router = useRouter();

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
  }) => {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant/15"
            : "text-on-surface-variant hover:bg-surface-container-high/80"
        }`}
      >
        <span className="material-symbols-outlined text-xl">{icon}</span>
        {label}
      </Link>
    );
  };

  const futureItemClass =
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant/32 bg-surface-container-high/20 cursor-not-allowed select-none border border-transparent";

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-inverse-surface/30 backdrop-blur-sm lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-40 bg-surface-container-low border-r border-outline-variant/15 pt-6 px-4 pb-6">
        <div className="flex items-center mb-8 px-1 pt-1 pb-1">
          <img
            alt={BRANDING.name}
            src={BRANDING.horizontal}
            className="h-14 w-auto max-w-full object-contain object-left shrink-0"
            width={280}
            height={56}
          />
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {mainNav.map((item) =>
            item.future ? (
              <span
                key={item.name}
                title="Em breve"
                aria-disabled
                className={futureItemClass}
              >
                <span className="material-symbols-outlined text-xl opacity-70">{item.icon}</span>
                {item.name}
              </span>
            ) : (
              <NavLink
                key={item.name + item.href}
                href={item.href}
                label={item.name}
                icon={item.icon}
                isActive={item.active(pathname)}
              />
            ),
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-outline-variant/15 pt-4">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high/80 rounded-lg text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-xl">help</span>
            Suporte
          </a>
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/dashboard/settings"
                ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant/15 font-medium"
                : "text-on-surface-variant hover:bg-surface-container-high/80"
            }`}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            Configurações
          </Link>
          {user?.email && (
            <p className="text-[11px] text-on-surface-variant truncate px-2" title={user.email}>
              {user.email}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high/80 rounded-lg text-sm font-medium transition-colors w-full text-left"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col bg-surface-container-low border-r border-outline-variant/15 p-4 pt-20 transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          className="absolute top-4 right-4 p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="flex items-center mb-8 px-1 pt-1 pb-1">
          <img
            alt={BRANDING.name}
            src={BRANDING.horizontal}
            className="h-14 w-auto max-w-full object-contain object-left shrink-0"
            width={280}
            height={56}
          />
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {mainNav.map((item) =>
            item.future ? (
              <span
                key={item.name}
                title="Em breve"
                aria-disabled
                className={futureItemClass}
              >
                <span className="material-symbols-outlined text-xl opacity-70">{item.icon}</span>
                {item.name}
              </span>
            ) : (
              <NavLink
                key={item.name + item.href}
                href={item.href}
                label={item.name}
                icon={item.icon}
                isActive={item.active(pathname)}
                onNavigate={() => setSidebarOpen(false)}
              />
            ),
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-outline-variant/15 pt-4">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high/80 rounded-lg text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-xl">help</span>
            Suporte
          </a>
          <Link
            href="/dashboard/settings"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/dashboard/settings"
                ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant/15 font-medium"
                : "text-on-surface-variant hover:bg-surface-container-high/80"
            }`}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            Configurações
          </Link>
          {user?.email && (
            <p className="text-[11px] text-on-surface-variant truncate px-2">{user.email}</p>
          )}
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg text-sm w-full text-left"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64 min-h-screen">
        <button
          type="button"
          className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-surface-container-lowest shadow-md ring-1 ring-outline-variant/15 text-on-surface"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 pt-4 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
