"use client";

import { useOsLayout } from "@/contexts/OsLayoutContext";
import { osCard, osDivider, osErrorBanner, osLabelMuted } from "@/lib/os-ui";

export function OsCompanySelector() {
  const { selectedProjectId, loadingProjects, setSelectedProjectId, projects, projectsError } =
    useOsLayout();

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <>
      <div className={`mb-6 ${osCard}`}>
        <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
          <div
            className={`flex shrink-0 items-center border-b px-4 py-3 text-sm font-bold sm:border-b-0 sm:border-r ${osDivider}`}
          >
            EMPRESA
          </div>
          <div className="flex flex-1 items-center px-4 py-2">
            {loadingProjects ? (
              <span className="text-sm font-bold normal-case">Carregando...</span>
            ) : projects.length === 0 ? (
              <span className="text-sm font-bold normal-case">Nenhuma empresa encontrada</span>
            ) : (
              <select
                value={selectedProjectId ?? ""}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none normal-case"
                aria-label="Selecionar empresa"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selectedProject ? (
            <div
              className={`hidden items-center border-l px-4 sm:flex ${osDivider}`}
              aria-hidden
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedProject.color }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {projectsError ? (
        <div className={osErrorBanner}>{projectsError}</div>
      ) : null}
    </>
  );
}
