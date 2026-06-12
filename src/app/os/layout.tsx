"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { OsSectionNav } from "@/components/os/OsSectionNav";
import { OsProjectProvider } from "@/contexts/OsLayoutContext";

/** Largura contida para OS / Pitch (tasks usa largura total). */
const OS_PAGE_CONTAINER =
  "mx-auto w-full max-w-6xl px-4 pt-2 pb-1 md:max-w-7xl md:px-6 xl:max-w-[1400px] xl:px-8 2xl:max-w-[1680px]";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTasksRoute = pathname === "/os/tasks" || pathname.startsWith("/os/tasks/");

  return (
    <AppShell fullWidth={isTasksRoute}>
      <OsProjectProvider>
        <div className={isTasksRoute ? "w-full pt-2 pb-1" : OS_PAGE_CONTAINER}>
          <OsSectionNav />
          {children}
        </div>
      </OsProjectProvider>
    </AppShell>
  );
}
