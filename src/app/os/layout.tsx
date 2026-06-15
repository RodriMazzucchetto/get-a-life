"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { OsSectionNav } from "@/components/os/OsSectionNav";
import "./os-refined.css";

const OS_PAGE_CONTAINER =
  "mx-auto w-full max-w-6xl px-4 pt-2 pb-1 md:max-w-7xl md:px-6 xl:max-w-[1400px] xl:px-8 2xl:max-w-[1500px]";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTasksRoute = pathname === "/os/tasks" || pathname.startsWith("/os/tasks/");

  return (
    <AppShell fullWidth={false}>
      <div className={`os-refined-page ${OS_PAGE_CONTAINER}`}>
        {!isTasksRoute ? <OsSectionNav /> : null}
        {children}
      </div>
    </AppShell>
  );
}
