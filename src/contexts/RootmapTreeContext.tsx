"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchLooseAndAllTasks,
  fetchTree,
  seedRootmapDemo,
} from "@/lib/rootmap/queries";
import type { RmTask, TreeObjective } from "@/lib/rootmap/types";

type Ctx = {
  tree: TreeObjective[];
  tasks: RmTask[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const RootmapTreeContext = createContext<Ctx | null>(null);

export function RootmapTreeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tree, setTree] = useState<TreeObjective[]>([]);
  const [tasks, setTasks] = useState<RmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await fetchTree();
      if (data.length === 0) {
        await seedRootmapDemo();
        data = await fetchTree();
      }
      const allTasks = await fetchLooseAndAllTasks();
      setTree(data);
      setTasks(allTasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ tree, tasks, loading, error, reload }),
    [tree, tasks, loading, error, reload]
  );

  return (
    <RootmapTreeContext.Provider value={value}>
      {children}
    </RootmapTreeContext.Provider>
  );
}

export function useRootmapTree() {
  const ctx = useContext(RootmapTreeContext);
  if (!ctx) throw new Error("useRootmapTree fora do provider");
  return ctx;
}
