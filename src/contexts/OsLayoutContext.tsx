"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getOsCache,
  invalidateOsCache,
  isOsCacheFresh,
  osCacheKey,
  packBoardCache,
  packTasksCache,
  readOsBootstrapSnapshot,
  setOsCache,
  unpackBoardCache,
  unpackTasksCache,
  type OsBoardCache,
  type OsTasksCache,
} from "@/lib/os-cache";
import {
  OS_SELECTED_PROJECT_KEY,
  fetchOsCompanies,
  fetchOsPitchBoardWithUpdates,
  fetchOsTasksBoard,
  type OsBlockView,
  type OsProjectOption,
} from "@/lib/os-queries";
import type { OsBetRow, OsBetUpdateRow, OsTaskRow } from "@/lib/os-types";

interface OsLayoutContextValue {
  projects: OsProjectOption[];
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string) => void;
  loadingProjects: boolean;
  projectsError: string | null;

  board: OsBlockView[];
  latestUpdates: Map<string, OsBetUpdateRow>;
  boardReady: boolean;
  boardLoading: boolean;
  boardRefreshing: boolean;
  boardError: string | null;
  refreshBoard: (options?: { background?: boolean }) => Promise<void>;
  setBoard: React.Dispatch<React.SetStateAction<OsBlockView[]>>;
  setLatestUpdates: React.Dispatch<React.SetStateAction<Map<string, OsBetUpdateRow>>>;

  tasks: OsTaskRow[];
  setTasks: React.Dispatch<React.SetStateAction<OsTaskRow[]>>;
  taskProjects: OsProjectOption[];
  betsById: Map<string, OsBetRow>;
  tasksReady: boolean;
  tasksLoading: boolean;
  tasksRefreshing: boolean;
  tasksError: string | null;
  refreshTasks: (options?: { background?: boolean }) => Promise<void>;
  invalidateOsData: () => void;
}

const OsLayoutContext = createContext<OsLayoutContextValue | null>(null);

export function useOsLayout() {
  const context = useContext(OsLayoutContext);
  if (!context) {
    throw new Error("useOsLayout must be used within OsProjectProvider");
  }
  return context;
}

/** Alias explícito para consumo de dados cacheados. */
export const useOsData = useOsLayout;

export function OsProjectProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthContext();
  const userId = user?.id ?? null;

  const bootstrapRef = useRef(readOsBootstrapSnapshot());
  const bootstrap = bootstrapRef.current;

  const [projects, setProjects] = useState<OsProjectOption[]>(() => bootstrap.projects);
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(
    () => bootstrap.selectedProjectId
  );
  const [loadingProjects, setLoadingProjects] = useState(
    () => bootstrap.projects.length === 0 && bootstrap.userId !== null
  );
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [board, setBoard] = useState<OsBlockView[]>(() => bootstrap.board);
  const [latestUpdates, setLatestUpdates] = useState<Map<string, OsBetUpdateRow>>(
    () => bootstrap.latestUpdates
  );
  const [boardReady, setBoardReady] = useState(() => bootstrap.boardReady);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardRefreshing, setBoardRefreshing] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);

  const [tasks, setTasksState] = useState<OsTaskRow[]>(() => bootstrap.tasks);
  const [taskProjects, setTaskProjects] = useState<OsProjectOption[]>(() => bootstrap.taskProjects);
  const [betsById, setBetsById] = useState<Map<string, OsBetRow>>(() => bootstrap.betsById);
  const [tasksReady, setTasksReady] = useState(() => bootstrap.tasksReady);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksRefreshing, setTasksRefreshing] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const boardRequestRef = useRef(0);
  const tasksRequestRef = useRef(0);
  const patchTasksCache = useCallback(
    (nextTasks: OsTaskRow[]) => {
      if (!userId) return;
      const cacheKey = osCacheKey(userId, "tasks-board");
      const cached = getOsCache<OsTasksCache>(cacheKey);
      if (cached) {
        setOsCache(
          cacheKey,
          packTasksCache({
            tasks: nextTasks,
            projects: cached.projects,
            betsById: new Map(cached.betsByIdEntries),
          })
        );
      }
    },
    [userId]
  );

  const setTasks = useCallback<React.Dispatch<React.SetStateAction<OsTaskRow[]>>>(
    (action) => {
      setTasksState((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        patchTasksCache(next);
        return next;
      });
    },
    [patchTasksCache]
  );

  const companiesRequestRef = useRef(0);

  const setSelectedProjectId = useCallback((projectId: string) => {
    setSelectedProjectIdState(projectId);
    if (typeof window !== "undefined") {
      localStorage.setItem(OS_SELECTED_PROJECT_KEY, projectId);
    }
  }, []);

  const invalidateOsData = useCallback(() => {
    if (!userId) return;
    invalidateOsCache(osCacheKey(userId));
    setBoardReady(false);
    setTasksReady(false);
  }, [userId]);

  const hydrateFromCache = useCallback(
    (uid: string) => {
      const companies = getOsCache<OsProjectOption[]>(osCacheKey(uid, "companies"));
      if (companies?.length) {
        setProjects(companies);
        setLoadingProjects(false);

        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem(OS_SELECTED_PROJECT_KEY)
            : null;
        const storedValid = stored && companies.some((p) => p.id === stored);
        const projectId = storedValid ? stored : (companies[0]?.id ?? null);

        if (projectId) {
          setSelectedProjectIdState((prev) =>
            prev && companies.some((p) => p.id === prev) ? prev : projectId
          );

          const boardPacked = getOsCache<OsBoardCache>(osCacheKey(uid, "board", projectId));
          if (boardPacked) {
            const { board: cachedBoard, latestUpdates: cachedUpdates } =
              unpackBoardCache(boardPacked);
            setBoard(cachedBoard);
            setLatestUpdates(cachedUpdates);
            setBoardReady(true);
            setBoardLoading(false);
          }
        }
      }

      const tasksPacked = getOsCache<OsTasksCache>(osCacheKey(uid, "tasks-board"));
      if (tasksPacked) {
        const unpacked = unpackTasksCache(tasksPacked);
        setTasks(unpacked.tasks);
        setTaskProjects(unpacked.projects);
        setBetsById(unpacked.betsById);
        setTasksReady(true);
        setTasksLoading(false);
      }
    },
    [setTasks]
  );

  const loadCompanies = useCallback(async () => {
    if (!userId) return;

    const cacheKey = osCacheKey(userId, "companies");
    const cached = getOsCache<OsProjectOption[]>(cacheKey);
    if (cached) {
      hydrateFromCache(userId);
    }

    if (cached && isOsCacheFresh(cacheKey)) return;

    const requestId = ++companiesRequestRef.current;
    if (!cached) setLoadingProjects(true);
    setProjectsError(null);

    try {
      const data = await fetchOsCompanies(userId);
      if (companiesRequestRef.current !== requestId) return;

      setOsCache(cacheKey, data);
      setProjects(data);

      const stored =
        typeof window !== "undefined" ? localStorage.getItem(OS_SELECTED_PROJECT_KEY) : null;
      const storedValid = stored && data.some((project) => project.id === stored);
      const initialProjectId = storedValid ? stored : (data[0]?.id ?? null);

      setSelectedProjectIdState((prev) => {
        if (prev && data.some((p) => p.id === prev)) return prev;
        return initialProjectId;
      });

      if (initialProjectId && typeof window !== "undefined") {
        localStorage.setItem(OS_SELECTED_PROJECT_KEY, initialProjectId);
      }
    } catch (error) {
      if (companiesRequestRef.current !== requestId) return;
      console.error("Erro ao carregar projetos OS:", error);
      setProjectsError("Não foi possível carregar os projetos.");
    } finally {
      if (companiesRequestRef.current === requestId) setLoadingProjects(false);
    }
  }, [userId, hydrateFromCache]);

  const refreshBoard = useCallback(
    async (options?: { background?: boolean }) => {
      if (!userId || !selectedProjectId) {
        setBoard([]);
        setLatestUpdates(new Map());
        setBoardReady(false);
        return;
      }

      const cacheKey = osCacheKey(userId, "board", selectedProjectId);
      const cachedPacked = getOsCache<OsBoardCache>(cacheKey);
      const cached = cachedPacked ? unpackBoardCache(cachedPacked) : null;

      const background = options?.background ?? Boolean(cached);

      if (cached) {
        setBoard(cached.board);
        setLatestUpdates(cached.latestUpdates);
        setBoardReady(true);
        setBoardError(null);
      }

      if (cached && isOsCacheFresh(cacheKey) && background) return;

      const requestId = ++boardRequestRef.current;
      if (background) {
        setBoardRefreshing(true);
      } else {
        setBoardLoading(true);
      }
      if (!cached) setBoardError(null);

      try {
        const data = await fetchOsPitchBoardWithUpdates(userId, selectedProjectId);
        if (boardRequestRef.current !== requestId) return;

        setOsCache(cacheKey, packBoardCache(data));
        setBoard(data.board);
        setLatestUpdates(data.latestUpdates);
        setBoardReady(true);
        setBoardError(null);
      } catch (error) {
        if (boardRequestRef.current !== requestId) return;
        console.error("Erro ao carregar OS:", error);
        if (!cached) {
          setBoard([]);
          setLatestUpdates(new Map());
          setBoardError("Não foi possível carregar o OS.");
        }
      } finally {
        if (boardRequestRef.current === requestId) {
          setBoardLoading(false);
          setBoardRefreshing(false);
        }
      }
    },
    [userId, selectedProjectId]
  );

  const refreshTasks = useCallback(
    async (options?: { background?: boolean }) => {
      if (!userId) return;

      const cacheKey = osCacheKey(userId, "tasks-board");
      const cachedPacked = getOsCache<OsTasksCache>(cacheKey);
      const cached = cachedPacked ? unpackTasksCache(cachedPacked) : null;

      const background = options?.background ?? Boolean(cached);

      if (cached) {
        setTasks(cached.tasks);
        setTaskProjects(cached.projects);
        setBetsById(cached.betsById);
        setTasksReady(true);
        setTasksError(null);
      }

      if (cached && isOsCacheFresh(cacheKey) && background) return;

      const requestId = ++tasksRequestRef.current;
      if (background) {
        setTasksRefreshing(true);
      } else {
        setTasksLoading(true);
      }
      if (!cached) setTasksError(null);

      try {
        const data = await fetchOsTasksBoard(userId);
        if (tasksRequestRef.current !== requestId) return;

        setOsCache(cacheKey, packTasksCache(data));
        setTasks(data.tasks);
        setTaskProjects(data.projects);
        setBetsById(data.betsById);
        setTasksReady(true);
        setTasksError(null);
      } catch (error) {
        if (tasksRequestRef.current !== requestId) return;
        console.error("Erro ao carregar tasks OS:", error);
        if (!cached) {
          setTasksError("Não foi possível carregar as tasks.");
        }
      } finally {
        if (tasksRequestRef.current === requestId) {
          setTasksLoading(false);
          setTasksRefreshing(false);
        }
      }
    },
    [userId]
  );

  useLayoutEffect(() => {
    if (!userId || authLoading) return;
    hydrateFromCache(userId);
  }, [userId, authLoading, hydrateFromCache]);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setProjects([]);
      setSelectedProjectIdState(null);
      setLoadingProjects(false);
      setBoard([]);
      setLatestUpdates(new Map());
      setBoardReady(false);
      setTasks([]);
      setTaskProjects([]);
      setBetsById(new Map());
      setTasksReady(false);
      return;
    }

    void loadCompanies();
    void refreshTasks({ background: true });
  }, [userId, authLoading, loadCompanies, refreshTasks]);

  useEffect(() => {
    if (!userId || authLoading || !selectedProjectId) return;
    void refreshBoard({ background: true });
  }, [userId, authLoading, selectedProjectId, refreshBoard]);

  const contextValue = useMemo(
    () => ({
      projects,
      selectedProjectId,
      setSelectedProjectId,
      loadingProjects,
      projectsError,
      board,
      latestUpdates,
      boardReady,
      boardLoading,
      boardRefreshing,
      boardError,
      refreshBoard,
      setBoard,
      setLatestUpdates,
      tasks,
      setTasks,
      taskProjects,
      betsById,
      tasksReady,
      tasksLoading,
      tasksRefreshing,
      tasksError,
      refreshTasks,
      invalidateOsData,
    }),
    [
      projects,
      selectedProjectId,
      setSelectedProjectId,
      loadingProjects,
      projectsError,
      board,
      latestUpdates,
      boardReady,
      boardLoading,
      boardRefreshing,
      boardError,
      refreshBoard,
      tasks,
      taskProjects,
      betsById,
      tasksReady,
      tasksLoading,
      tasksRefreshing,
      tasksError,
      refreshTasks,
      invalidateOsData,
    ]
  );

  return (
    <OsLayoutContext.Provider value={contextValue}>{children}</OsLayoutContext.Provider>
  );
}
