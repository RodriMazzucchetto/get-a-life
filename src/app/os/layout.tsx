"use client";

import { AppShell } from "@/components/AppShell";
import { OsSectionNav } from "@/components/os/OsSectionNav";
import { OsProjectProvider } from "@/contexts/OsLayoutContext";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <OsProjectProvider>
        <div className="mx-auto w-full max-w-6xl px-4 pt-2 md:max-w-7xl md:px-6 xl:max-w-[1400px] xl:px-8 2xl:max-w-[1680px]">
          <OsSectionNav />
          {children}
        </div>
      </OsProjectProvider>
    </AppShell>
  );
}
