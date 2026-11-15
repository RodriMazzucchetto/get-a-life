"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { RootmapLogo } from "@/components/rootmap/Logo";
import type { RmObjective } from "@/lib/rootmap/types";

const NAV = [
  { href: "/foco", label: "Foco" },
  { href: "/arvores", label: "Árvores" },
  { href: "/objetivos", label: "Objetivos" },
];

export function RootmapShell({
  children,
  objectives = [],
}: {
  children: React.ReactNode;
  objectives?: RmObjective[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuthContext();

  return (
    <div className="rm-shell">
      <aside className="rm-sidebar">
        <Link href="/foco" className="mb-3 px-1">
          <RootmapLogo />
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rm-nav-link"
            data-active={pathname === item.href || pathname.startsWith(item.href + "/")}
          >
            {item.label}
          </Link>
        ))}
        <div className="mt-4 px-3 text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--rm-muted)]">
          Objetivos
        </div>
        <div className="flex flex-col gap-1">
          {objectives.map((ob, i) => (
            <Link
              key={ob.id}
              href={`/arvores?obj=${ob.id}`}
              className="flex items-center gap-2 rounded-[10px] px-3 py-[7px] text-[14px] font-semibold"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: ob.color }}
              />
              <span>{ob.tag}</span>
              <span className="ml-auto font-medium text-[var(--rm-muted)]">
                #{i + 1}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-1 border-t-2 border-[var(--rm-ink)] pt-4">
          <Link href="/configuracoes" className="rm-nav-link">
            Configurações
          </Link>
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--rm-muted)]">
            {user?.email}
          </div>
          <button
            type="button"
            className="rm-nav-link text-left"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="rm-main">{children}</main>
    </div>
  );
}
