"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { HomeLanding } from "@/components/landing/HomeLanding";

export default function Home() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-on-surface">
        <div
          className="h-12 w-12 rounded-full border-2 border-outline-variant border-t-primary animate-spin"
          aria-hidden
        />
        <p className="text-sm font-medium text-on-surface-variant font-body">
          A carregar…
        </p>
      </div>
    );
  }

  return <HomeLanding user={user} />;
}
