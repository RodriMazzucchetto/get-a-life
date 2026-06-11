"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  OS_SELECTED_PROJECT_KEY,
  fetchOsProjects,
  type OsProjectOption,
} from "@/lib/os-queries";

interface OsLayoutContextValue {
  projects: OsProjectOption[];
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string) => void;
  loadingProjects: boolean;
  projectsError: string | null;
}

const OsLayoutContext = createContext<OsLayoutContextValue | null>(null);

export function useOsLayout() {
  const context = useContext(OsLayoutContext);
  if (!context) {
    throw new Error("useOsLayout must be used within OsLayout");
  }
  return context;
}

export default function OsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<OsProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const setSelectedProjectId = useCallback((projectId: string) => {
    setSelectedProjectIdState(projectId);
    if (typeof window !== "undefined") {
      localStorage.setItem(OS_SELECTED_PROJECT_KEY, projectId);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    let cancelled = false;

    async function loadProjects() {
      setLoadingProjects(true);
      setProjectsError(null);

      try {
        const data = await fetchOsProjects(userId);
        if (cancelled) return;

        setProjects(data);

        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem(OS_SELECTED_PROJECT_KEY)
            : null;
        const storedValid = stored && data.some((project) => project.id === stored);
        const initialProjectId = storedValid ? stored : data[0]?.id ?? null;

        setSelectedProjectIdState(initialProjectId);
        if (initialProjectId && typeof window !== "undefined") {
          localStorage.setItem(OS_SELECTED_PROJECT_KEY, initialProjectId);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Erro ao carregar projetos OS:", error);
        setProjectsError("Não foi possível carregar os projetos.");
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const contextValue = useMemo(
    () => ({
      projects,
      selectedProjectId,
      setSelectedProjectId,
      loadingProjects,
      projectsError,
    }),
    [projects, selectedProjectId, setSelectedProjectId, loadingProjects, projectsError]
  );

  const isTasksRoute = pathname === "/os/tasks";

  return (
    <AppShell>
      <OsLayoutContext.Provider value={contextValue}>
        <div className="space-y-6 pb-8">
          <section className="rounded-2xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/15">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                  OS
                </h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Sistema de execução por blocos, metas e apostas.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/os"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    !isTasksRoute
                      ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant/15"
                      : "text-on-surface-variant hover:bg-surface-container-high/80"
                  }`}
                >
                  Visão geral
                </Link>
                <Link
                  href="/os/tasks"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isTasksRoute
                      ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-outline-variant/15"
                      : "text-on-surface-variant hover:bg-surface-container-high/80"
                  }`}
                >
                  Tasks
                </Link>
              </div>
            </div>

            <div className="mt-4 max-w-md">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Projeto
              </label>
              {loadingProjects ? (
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface-variant">
                  Carregando projetos...
                </div>
              ) : projects.length === 0 ? (
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface-variant">
                  Nenhum projeto encontrado.
                </div>
              ) : (
                <select
                  value={selectedProjectId ?? ""}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {projectsError ? (
              <div className="mt-4 rounded-lg border border-error/40 bg-error/10 px-4 py-2 text-sm text-error">
                {projectsError}
              </div>
            ) : null}
          </section>

          {children}
        </div>
      </OsLayoutContext.Provider>
    </AppShell>
  );
}
