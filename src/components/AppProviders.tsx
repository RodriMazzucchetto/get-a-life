"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { OsProjectProvider } from "@/contexts/OsLayoutContext";

/** Providers globais — OS cache persiste ao navegar dashboard ↔ OS. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OsProjectProvider>{children}</OsProjectProvider>
    </AuthProvider>
  );
}
