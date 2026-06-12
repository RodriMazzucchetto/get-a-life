"use client";

import { AppShell } from "@/components/AppShell";
import { OsSectionNav } from "@/components/os/OsSectionNav";
import { OsProjectProvider } from "@/contexts/OsLayoutContext";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell fullWidth>
      <OsProjectProvider>
        <div className="w-full pt-2 pb-1">
          <OsSectionNav />
          {children}
        </div>
      </OsProjectProvider>
    </AppShell>
  );
}
