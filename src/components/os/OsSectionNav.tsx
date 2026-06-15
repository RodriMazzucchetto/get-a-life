"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const OS_SECTION_ITEMS = [
  { label: "OS", href: "/os" },
  { label: "Pitch", href: "/os/pitch" },
];

export function OsSectionNav() {
  const pathname = usePathname();
  const showSubNav = pathname === "/os" || pathname === "/os/pitch";

  if (!showSubNav) return null;

  return (
    <nav className="os-tabs" aria-label="Navegação OS">
      {OS_SECTION_ITEMS.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={isActive ? "active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
