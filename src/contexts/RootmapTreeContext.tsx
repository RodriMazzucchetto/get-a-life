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
  fetchTreeData,
  seedRootmapDemo,
} from "@/lib/rootmap/queries";
import type {
  RmCompany,
  RmOpportunity,
  RmSolution,
  RmTask,
  TreeObjective,
  TreeOpportunity,
  TreeSolution,
} from "@/lib/rootmap/types";

type ReloadOpts = {
  /** Também refetch empresas (default: só no 1º load). */
  companies?: boolean;
};

type Ctx = {
  tree: TreeObjective[];
  companies: RmCompany[];
  tasks: RmTask[];
  loading: boolean;
  error: string | null;
  reload: (opts?: ReloadOpts) => Promise<void>;
  /** Atualiza árvore/tasks em memória sem refetch. */
  patchOpportunity: (id: string, patch: Partial<RmOpportunity>) => void;
  patchSolution: (id: string, patch: Partial<RmSolution>) => void;
  patchTask: (id: string, patch: Partial<RmTask>) => void;
  removeTaskLocal: (id: string) => void;
  removeOpportunityLocal: (id: string) => void;
};

const RootmapTreeContext = createContext<Ctx | null>(null);

function mapTree(
  tree: TreeObjective[],
  mapOpp: (o: TreeOpportunity) => TreeOpportunity
): TreeObjective[] {
  return tree.map((ob) => ({
    ...ob,
    opportunities: ob.opportunities.map(mapOpp),
  }));
}

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
  const companiesLoaded = useRef(false);
  const inflight = useRef<Promise<void> | null>(null);

  const reload = useCallback(async (opts?: ReloadOpts) => {
    if (inflight.current) return inflight.current;

    const run = (async () => {
      if (!hasLoaded.current) setLoading(true);
      setError(null);
      try {
        let { tree: data, tasks: allTasks } = await fetchTreeData();
        if (data.length === 0 && !hasLoaded.current) {
          await seedRootmapDemo();
          ({ tree: data, tasks: allTasks } = await fetchTreeData());
        }
        setTree(data);
        setTasks(allTasks);

        const needCompanies =
          opts?.companies === true || !companiesLoaded.current;
        if (needCompanies) {
          setCompanies(await fetchCompanies());
          companiesLoaded.current = true;
        }
        hasLoaded.current = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
        inflight.current = null;
      }
    })();

    inflight.current = run;
    return run;
  }, []);

  useEffect(() => {
    void reload({ companies: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  const patchOpportunity = useCallback(
    (id: string, patch: Partial<RmOpportunity>) => {
      setTree((prev) =>
        mapTree(prev, (o) => (o.id === id ? { ...o, ...patch } : o))
      );
    },
    []
  );

  const patchSolution = useCallback((id: string, patch: Partial<RmSolution>) => {
    setTree((prev) =>
      mapTree(prev, (o) => ({
        ...o,
        solutions: o.solutions.map((s) =>
          s.id === id ? ({ ...s, ...patch } as TreeSolution) : s
        ),
      }))
    );
  }, []);

  const patchTask = useCallback((id: string, patch: Partial<RmTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
    setTree((prev) =>
      mapTree(prev, (o) => ({
        ...o,
        solutions: o.solutions.map((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      }))
    );
  }, []);

  const removeTaskLocal = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setTree((prev) =>
      mapTree(prev, (o) => ({
        ...o,
        solutions: o.solutions.map((s) => ({
          ...s,
          tasks: s.tasks.filter((t) => t.id !== id),
        })),
      }))
    );
  }, []);

  const removeOpportunityLocal = useCallback((id: string) => {
    setTree((prev) =>
      prev.map((ob) => ({
        ...ob,
        opportunities: ob.opportunities.filter((o) => o.id !== id),
      }))
    );
  }, []);

  const value = useMemo(
    () => ({
      tree,
      companies,
      tasks,
      loading,
      error,
      reload,
      patchOpportunity,
      patchSolution,
      patchTask,
      removeTaskLocal,
      removeOpportunityLocal,
    }),
    [
      tree,
      companies,
      tasks,
      loading,
      error,
      reload,
      patchOpportunity,
      patchSolution,
      patchTask,
      removeTaskLocal,
      removeOpportunityLocal,
    ]
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
