"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { osNav, osNavLinkActive, osNavLinkIdle } from "@/lib/os-ui";

const OS_SECTION_ITEMS = [
  { label: "OS", href: "/os" },
  { label: "PITCH", href: "/os/pitch" },
];

export function OsSectionNav() {
  const pathname = usePathname();
  const showSubNav = pathname === "/os" || pathname === "/os/pitch";

  if (!showSubNav) return null;

  return (
    <nav className={osNav} aria-label="Navegação OS">
      {OS_SECTION_ITEMS.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 px-4 py-2.5 text-center ${
              isActive ? osNavLinkActive : osNavLinkIdle
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
