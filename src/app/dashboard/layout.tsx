"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const nav = [
  { name: "Planejamento", href: "/dashboard/planning", icon: "checklist" as const },
  { name: "Configurações", href: "/dashboard/settings", icon: "settings" as const },
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
    onNavigate,
  }: {
    href: string;
    label: string;
    icon: string;
    onNavigate?: () => void;
  }) => {
    const active = pathname === href || (href === "/dashboard/planning" && pathname === "/dashboard");
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant/15"
            : "text-on-surface-variant hover:bg-surface-container-high/80"
        }`}
      >
        <span className="material-symbols-outlined text-xl">{icon}</span>
        {label}
      </Link>
    );
  };

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
        <div className="flex items-center gap-3 mb-8 px-2 pt-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-headline font-bold text-lg shrink-0">
            G
          </div>
          <div>
            <p className="font-headline font-extrabold text-primary tracking-tight leading-tight text-sm">
              Get a Life
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
              Workspace
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.name} icon={item.icon} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-outline-variant/15 pt-4">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high/80 rounded-lg text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-xl">help</span>
            Suporte
          </a>
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
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-headline font-bold">
            G
          </div>
          <div>
            <p className="font-headline font-extrabold text-primary text-sm">Get a Life</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.name}
              icon={item.icon}
              onNavigate={() => setSidebarOpen(false)}
            />
          ))}
        </nav>
        <div className="mt-auto border-t border-outline-variant/15 pt-4 space-y-2">
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
