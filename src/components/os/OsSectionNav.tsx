"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const OS_SECTION_ITEMS = [
  { label: "OS", href: "/os" },
  { label: "PITCH", href: "/os/pitch" },
];

export function OsSectionNav() {
  const pathname = usePathname();
  const showSubNav = pathname === "/os" || pathname === "/os/pitch";

  if (!showSubNav) return null;

  return (
    <nav
      className="mb-6 flex border-2 border-black font-mono text-sm font-bold uppercase tracking-wide"
      aria-label="Navegação OS"
    >
      {OS_SECTION_ITEMS.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 px-4 py-2.5 text-center transition-colors ${
              isActive ? "bg-black text-white" : "bg-white text-black hover:bg-black/5"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
