"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Plus, RotateCw, X } from "lucide-react";
import { ProjectsTable } from "@/components/dashboard/projects/ProjectsTable";
import { ProjectFormDialog } from "@/components/dashboard/projects/ProjectFormDialog";
import type { ProjectRecord } from "@/components/dashboard/projects/types";

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

export function ProjectsAdminPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function loadProjects() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { projects?: ProjectRecord[] };
      setProjects(data.projects ?? []);
    } catch {
      setToast({ type: "error", message: "No se pudo cargar la lista de proyectos." });
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingProject(null);
    setIsDialogOpen(true);
  }

  function openEditDialog(project: ProjectRecord) {
    setEditingProject(project);
    setIsDialogOpen(true);
  }

  async function togglePublish(project: ProjectRecord) {
    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, isPublished: !project.isPublished }),
      });
      if (!response.ok) throw new Error();
      await loadProjects();
      setToast({
        type: "success",
        message: project.isPublished ? "Proyecto pasado a borrador." : "Proyecto publicado.",
      });
    } catch {
      setToast({ type: "error", message: "No se pudo cambiar el estado del proyecto." });
    }
  }

  async function deleteProject(project: ProjectRecord) {
    const title = project.translations.es?.title || project.slug;
    if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;

    try {
      const response = await fetch(`/api/projects?id=${encodeURIComponent(project.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      await loadProjects();
      setToast({ type: "success", message: "Proyecto eliminado." });
    } catch {
      setToast({ type: "error", message: "No se pudo eliminar el proyecto." });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {toast && (
        <div
          className={`fixed right-4 top-24 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-2xl backdrop-blur md:right-8 ${
            toast.type === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-medium uppercase leading-none tracking-tight md:text-6xl">
            Proyectos
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-paragraph">
            Administra el contenido multilingüe, assets y estado de publicación de cada proyecto del portfolio.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void loadProjects()}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.06]"
          >
            <RotateCw className="h-4 w-4" />
            Recargar
          </button>
          <button
            type="button"
            onClick={openCreateDialog}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-orange px-4 text-sm font-medium text-white transition-colors hover:bg-orange/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo Proyecto
          </button>
        </div>
      </header>

      <ProjectsTable
        projects={projects}
        isLoading={isLoading}
        onEdit={openEditDialog}
        onTogglePublish={togglePublish}
        onDelete={deleteProject}
      />

      <ProjectFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        project={editingProject}
        onSaved={loadProjects}
      />
    </div>
  );
}
