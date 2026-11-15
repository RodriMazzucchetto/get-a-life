"use client";

import { RootmapShell } from "@/components/rootmap/RootmapShell";
import {
  RootmapTreeProvider,
  useRootmapTree,
} from "@/contexts/RootmapTreeContext";

function Shell({ children }: { children: React.ReactNode }) {
  const { tree } = useRootmapTree();
  return <RootmapShell objectives={tree}>{children}</RootmapShell>;
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
