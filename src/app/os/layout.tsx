"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { OsSectionNav } from "@/components/os/OsSectionNav";
import { useOsLayout } from "@/contexts/OsLayoutContext";
import "./os-refined.css";

const OS_PAGE_CONTAINER =
  "mx-auto w-full max-w-6xl px-4 pt-2 pb-1 md:max-w-7xl md:px-6 xl:max-w-[1400px] xl:px-8 2xl:max-w-[1500px]";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { refreshProjects } = useOsLayout();
  const prevPathRef = useRef<string | null>(null);
  const isTasksRoute = pathname === "/os/tasks" || pathname.startsWith("/os/tasks/");

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (pathname.startsWith("/os") && prev && !prev.startsWith("/os")) {
      void refreshProjects();
    }
  }, [pathname, refreshProjects]);

  return (
    <AppShell fullWidth={false}>
      <div className={`os-refined-page ${OS_PAGE_CONTAINER}`}>
        {!isTasksRoute ? <OsSectionNav /> : null}
        {children}
      </div>
    </AppShell>
  );
}
