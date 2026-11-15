"use client";

import { Suspense } from "react";
import { RootmapModals } from "@/components/rootmap/RootmapModals";
import { RootmapShell } from "@/components/rootmap/RootmapShell";
import {
  RootmapTreeProvider,
  useRootmapTree,
} from "@/contexts/RootmapTreeContext";

function Shell({ children }: { children: React.ReactNode }) {
  const { tree } = useRootmapTree();
  return (
    <RootmapShell objectives={tree}>
      {children}
      <Suspense fallback={null}>
        <RootmapModals />
      </Suspense>
    </RootmapShell>
  );
}

export default function RootmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootmapTreeProvider>
      <Shell>{children}</Shell>
    </RootmapTreeProvider>
  );
}
