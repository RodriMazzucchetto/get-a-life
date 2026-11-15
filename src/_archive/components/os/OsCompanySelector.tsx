"use client";

import { useOsLayout } from "@/contexts/OsLayoutContext";
import { osErrorBanner } from "@/lib/os-ui";

export function OsCompanySelector() {
  const { selectedProjectId, loadingProjects, setSelectedProjectId, projects, projectsError } =
    useOsLayout();

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <>
      <div className="os-empresa-bar">
        <span className="lab">Empresa</span>
        {loadingProjects && projects.length === 0 ? (
          <span className="loading-text">Carregando…</span>
        ) : projects.length === 0 ? (
          <span className="loading-text">Nenhuma empresa encontrada</span>
        ) : (
          <select
            value={selectedProjectId ?? ""}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            aria-label="Selecionar empresa"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
        {selectedProject ? (
          <span
            className="status-dot"
            style={{ backgroundColor: selectedProject.color }}
            title="Empresa selecionada"
            aria-hidden
          />
        ) : null}
      </div>

      {projectsError ? <div className={osErrorBanner}>{projectsError}</div> : null}
    </>
  );
}
