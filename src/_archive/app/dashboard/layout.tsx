"use client";

import { AppShell } from "@/components/AppShell";
import { PlanningDataProvider } from "@/hooks/usePlanningData";
import { ProblemsDataProvider } from "@/contexts/ProblemsDataContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <PlanningDataProvider>
        <ProblemsDataProvider>{children}</ProblemsDataProvider>
      </PlanningDataProvider>
    </AppShell>
  );
}
