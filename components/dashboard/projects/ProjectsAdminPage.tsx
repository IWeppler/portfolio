"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Loader2, Plus, RotateCw, X } from "lucide-react";
import { ProjectsKanban } from "./ProjectsKanban";
import { ProjectFormDialog } from "./ProjectFormDialog";
import type { ProjectRecord } from "./types";
import {
  LANDING_PROJECT_LIMIT,
  markLandingProjects,
} from "@/lib/projects/landing";

type ToastState = { type: "success" | "error"; message: string } | null;

export function ProjectsAdminPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(
    null,
  );
  const [toast, setToast] = useState<ToastState>(null);
  const mutationPending = useRef(false);

  useEffect(() => {
    void loadProjects();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function loadProjects() {
    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { projects: ProjectRecord[] };
      setProjects(markLandingProjects(data.projects));
    } catch {
      setLoadError(true);
      setToast({
        type: "error",
        message: "No se pudo cargar la lista de proyectos. Volvé a intentar.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function openEditDialog(project: ProjectRecord) {
    if (mutationPending.current) return;
    setEditingProject(project);
    setIsDialogOpen(true);
  }

  async function saveBoard(next: ProjectRecord[]) {
    if (mutationPending.current) return;
    const previous = projects;
    if (
      previous.length === next.length &&
      previous.every(
        (project, index) =>
          project.id === next[index].id &&
          project.isPublished === next[index].isPublished,
      )
    )
      return;
    mutationPending.current = true;
    setIsSaving(true);
    setToast(null);
    const optimistic = markLandingProjects(
      next.map((project, order) => ({ ...project, order })),
    );
    setProjects(optimistic);
    try {
      const response = await fetch("/api/projects/order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: next.map(({ id, isPublished }) => ({ id, isPublished })),
          expected: previous.map(({ id, isPublished, order }) => ({
            id,
            isPublished,
            order,
          })),
        }),
      });
      if (response.status === 409) {
        await loadProjects();
        setToast({
          type: "error",
          message:
            "Los proyectos cambiaron en otra sesión. Cargamos el tablero actualizado; repetí el movimiento.",
        });
        return;
      }
      if (!response.ok) throw new Error();
      setToast({
        type: "success",
        message:
          "Orden guardado. La landing ya usa las primeras cinco posiciones.",
      });
    } catch {
      setProjects(previous);
      setToast({
        type: "error",
        message:
          "No se pudo guardar el movimiento. Restauramos el orden anterior; volvé a intentar.",
      });
    } finally {
      mutationPending.current = false;
      setIsSaving(false);
    }
  }

  function togglePublish(project: ProjectRecord) {
    const published = projects.filter(
      (item) => item.isPublished && item.id !== project.id,
    );
    const drafts = projects.filter(
      (item) => !item.isPublished && item.id !== project.id,
    );
    (project.isPublished ? drafts : published).push({
      ...project,
      isPublished: !project.isPublished,
    });
    void saveBoard([...published, ...drafts]);
  }

  async function deleteProject(project: ProjectRecord) {
    if (mutationPending.current) return;
    const title = project.translations.es?.title || project.slug;
    if (
      !window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)
    )
      return;
    mutationPending.current = true;
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/projects?id=${encodeURIComponent(project.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error();
      await loadProjects();
      setToast({ type: "success", message: "Proyecto eliminado." });
    } catch {
      setToast({ type: "error", message: "No se pudo eliminar el proyecto." });
    } finally {
      mutationPending.current = false;
      setIsSaving(false);
    }
  }

  const landingCount = projects.filter((project) => project.isFeatured).length;
  const disabled = isSaving || isLoading || isDialogOpen;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          className={`fixed right-4 top-24 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-2xl backdrop-blur md:right-8 ${toast.type === "success" ? "border-emerald-400/30 bg-surface text-emerald-200" : "border-red-400/30 bg-surface text-red-200"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <X className="mt-0.5 size-4 shrink-0" />
          )}
          <span className="max-w-sm">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Cerrar aviso"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-4xl font-medium uppercase leading-none tracking-tight md:text-6xl">
            Proyectos
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-paragraph">
            Ordená los proyectos arrastrando las tarjetas. Los primeros cinco
            publicados con portada se muestran en la landing.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => void loadProjects()}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-foreground hover:bg-white/[0.06] disabled:opacity-50"
          >
            <RotateCw className="size-4" />
            Recargar
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setEditingProject(null);
              setIsDialogOpen(true);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-orange px-4 text-sm font-medium text-white hover:bg-orange/90 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Nuevo proyecto
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-paragraph">
          <span className="font-medium text-foreground">
            {landingCount}/{LANDING_PROJECT_LIMIT}
          </span>{" "}
          proyectos en la landing <span className="mx-2 text-white/20">·</span>
          {projects.length} en total
        </p>
        <p
          aria-live="polite"
          className="flex items-center gap-2 text-xs text-paragraph"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Guardando cambios…
            </>
          ) : !isLoading && !loadError ? (
            <>
              <Check className="size-3.5 text-emerald-300" />
              Guardado automático
            </>
          ) : null}
        </p>
      </div>

      {isLoading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-surface py-16 text-sm text-paragraph"
        >
          <Loader2 className="size-4 animate-spin" />
          Cargando proyectos
        </div>
      ) : loadError ? (
        <div className="rounded-lg border border-red-400/20 bg-surface p-8 text-center">
          <p className="text-sm text-paragraph">
            No pudimos cargar el tablero.
          </p>
          <button
            type="button"
            onClick={() => void loadProjects()}
            className="mt-4 text-sm text-orange"
          >
            Volver a intentar
          </button>
        </div>
      ) : (
        <ProjectsKanban
          projects={projects}
          disabled={disabled}
          onChange={(next) => void saveBoard(next)}
          onEdit={openEditDialog}
          onTogglePublish={togglePublish}
          onDelete={(project) => void deleteProject(project)}
        />
      )}
      <p className="text-xs leading-5 text-paragraph">
        También podés ordenar desde el menú de cada tarjeta o enfocar el asa y
        usar Espacio, las flechas y Espacio para soltar.
      </p>
      <ProjectFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        project={editingProject}
        onSaved={() => void loadProjects()}
      />
    </div>
  );
}
