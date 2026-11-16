"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchCompanies,
  fetchLooseAndAllTasks,
  fetchTree,
  seedRootmapDemo,
} from "@/lib/rootmap/queries";
import type { RmCompany, RmTask, TreeObjective } from "@/lib/rootmap/types";

type Ctx = {
  tree: TreeObjective[];
  companies: RmCompany[];
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
  const [companies, setCompanies] = useState<RmCompany[]>([]);
  const [tasks, setTasks] = useState<RmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const reload = useCallback(async () => {
    // Soft reload: não desmonta a UI (ex.: modal aberta) após o 1º load
    if (!hasLoaded.current) setLoading(true);
    setError(null);
    try {
      let data = await fetchTree();
      if (data.length === 0) {
        await seedRootmapDemo();
        data = await fetchTree();
      }
      const [allTasks, comps] = await Promise.all([
        fetchLooseAndAllTasks(),
        fetchCompanies(),
      ]);
      setTree(data);
      setTasks(allTasks);
      setCompanies(comps);
      hasLoaded.current = true;
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
    () => ({ tree, companies, tasks, loading, error, reload }),
    [tree, companies, tasks, loading, error, reload]
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
