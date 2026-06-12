"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  OS_SELECTED_PROJECT_KEY,
  fetchOsCompanies,
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
    throw new Error("useOsLayout must be used within OsProjectProvider");
  }
  return context;
}

export function OsProjectProvider({ children }: { children: React.ReactNode }) {
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
        const data = await fetchOsCompanies(userId);
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

  return (
    <OsLayoutContext.Provider value={contextValue}>{children}</OsLayoutContext.Provider>
  );
}
