"use client";

import { AppShell } from "@/components/AppShell";
import { OsSectionNav } from "@/components/os/OsSectionNav";
import { OsProjectProvider } from "@/contexts/OsLayoutContext";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <OsProjectProvider>
        <div className="mx-auto max-w-6xl px-4 pt-2">
          <OsSectionNav />
          {children}
        </div>
      </OsProjectProvider>
    </AppShell>
  );
}
