"use client";

import { AppShell } from "@/components/AppShell";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
