"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  fetchAllOsTasks,
  fetchOsBetsByIds,
  fetchOsProjects,
  formatOsTaskStatusLabel,
  type OsProjectOption,
} from "@/lib/os-queries";
import { filterOsCompanies, findQuickWinProject, isQuickWinProject } from "@/lib/project-filters";
import type { OsBetRow, OsTaskRow, OsTaskStatus } from "@/lib/os-types";

type MaintenanceFilter = "all" | "maintenance" | "bet";
type TagFilter = "all" | "quick_win";

function getTaskStatusBadgeClass(status: OsTaskStatus): string {
  switch (status) {
    case "todo":
      return "bg-surface-container-high text-on-surface-variant";
    case "doing":
      return "bg-blue-100 text-blue-800";
    case "done":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-surface-container-high text-on-surface-variant";
  }
}

export default function OsTasksPage() {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<OsTaskRow[]>([]);
  const [betsById, setBetsById] = useState<Map<string, OsBetRow>>(new Map());
  const [projects, setProjects] = useState<OsProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OsTaskStatus>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<TagFilter>("all");
  const [maintenanceFilter, setMaintenanceFilter] = useState<MaintenanceFilter>("all");

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    let cancelled = false;

    async function loadTasks() {
      setLoading(true);
      setError(null);

      try {
        const [taskRows, projectRows] = await Promise.all([
          fetchAllOsTasks(userId),
          fetchOsProjects(userId),
        ]);

        if (cancelled) return;
        setTasks(taskRows);
        setProjects(projectRows);

        const betIds = [
          ...new Set(taskRows.map((task) => task.bet_id).filter((id): id is string => Boolean(id))),
        ];
        const bets = await fetchOsBetsByIds(betIds);
        if (cancelled) return;
        setBetsById(new Map(bets.map((bet) => [bet.id, bet])));
      } catch (loadError) {
        if (cancelled) return;
        console.error("Erro ao carregar tasks OS:", loadError);
        setError("Não foi possível carregar as tasks OS.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const companies = useMemo(() => filterOsCompanies(projects), [projects]);
  const quickWinProject = useMemo(() => findQuickWinProject(projects), [projects]);

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (projectFilter !== "all" && task.project_id !== projectFilter) return false;
      if (tagFilter === "quick_win") {
        if (!quickWinProject || task.project_id !== quickWinProject.id) return false;
      }
      if (maintenanceFilter === "maintenance" && !task.is_maintenance) return false;
      if (maintenanceFilter === "bet" && task.is_maintenance) return false;
      return true;
    });
  }, [tasks, statusFilter, projectFilter, tagFilter, quickWinProject, maintenanceFilter]);

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-2xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/15">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Tasks OS
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Listagem consolidada de todas as tasks do sistema OS.
          </p>
        </div>
      </section>

    <section className="rounded-2xl bg-surface-container-lowest p-6 ring-1 ring-outline-variant/15">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold text-on-surface">Todas as tasks</h2>
        </div>
        <span className="inline-flex rounded-full bg-tertiary-fixed px-3 py-1 text-xs font-bold uppercase text-on-tertiary-fixed-variant">
          {filteredTasks.length} tasks
        </span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | OsTaskStatus)}
            className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="all">Todos</option>
            <option value="todo">A fazer</option>
            <option value="doing">Em progresso</option>
            <option value="done">Concluída</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Empresa
          </span>
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="all">Todas</option>
            {companies.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        {quickWinProject ? (
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Tag
            </span>
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value as TagFilter)}
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="all">Todas</option>
              <option value="quick_win">{quickWinProject.name}</option>
            </select>
          </label>
        ) : null}

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Tipo
          </span>
          <select
            value={maintenanceFilter}
            onChange={(event) => setMaintenanceFilter(event.target.value as MaintenanceFilter)}
            className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
          >
            <option value="all">Todos</option>
            <option value="maintenance">Manutenção</option>
            <option value="bet">Aposta</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-error/40 bg-error/10 px-4 py-2 text-sm text-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl bg-surface-container-low px-4 py-8 text-center text-sm text-on-surface-variant">
          Carregando tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low px-4 py-8 text-center text-sm text-on-surface-variant">
          Nenhuma task encontrada com os filtros atuais.
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredTasks.map((task) => {
            const project = task.project_id ? projectsById.get(task.project_id) : null;
            const linkedBet = task.bet_id ? betsById.get(task.bet_id) : null;
            const isQuickWinTag = project ? isQuickWinProject(project) : false;
            const company = project && !isQuickWinTag ? project : null;

            return (
              <li
                key={task.id}
                className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-on-surface">{task.title}</p>
                    {task.description ? (
                      <p className="mt-1 text-xs text-on-surface-variant">{task.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${getTaskStatusBadgeClass(task.status)}`}
                    >
                      {formatOsTaskStatusLabel(task.status)}
                    </span>
                    {company ? (
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-on-primary"
                        style={{ backgroundColor: company.color }}
                      >
                        {company.name}
                      </span>
                    ) : null}
                    {isQuickWinTag && project ? (
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-on-primary"
                        style={{ backgroundColor: project.color }}
                      >
                        Tag: {project.name}
                      </span>
                    ) : null}
                    {!company && !isQuickWinTag ? (
                      <span className="inline-flex rounded-full bg-surface-container-highest px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                        Sem empresa
                      </span>
                    ) : null}
                    {linkedBet ? (
                      <span className="inline-flex rounded-full border border-[#FF0000]/30 bg-[#FF0000]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#FF0000]">
                        Pitch: {linkedBet.title}
                      </span>
                    ) : null}
                    {task.is_maintenance ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                        Manutenção
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-blue-800">
                        Aposta
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
    </div>
  );
}
