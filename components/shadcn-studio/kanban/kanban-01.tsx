"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUp,
  GripVertical,
  ImageOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanMoveEvent,
} from "@/components/ui/kanban";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LANGS,
  isTranslationComplete,
  type ProjectRecord,
} from "@/components/dashboard/projects/types";
import { CATEGORY_ADMIN_LABELS } from "@/lib/projects/categories";
import {
  isLandingEligible,
  LANDING_PROJECT_LIMIT,
} from "@/lib/projects/landing";

type Props = {
  projects: ProjectRecord[];
  disabled: boolean;
  onChange: (projects: ProjectRecord[]) => void;
  onEdit: (project: ProjectRecord) => void;
  onTogglePublish: (project: ProjectRecord) => void;
  onDelete: (project: ProjectRecord) => void;
};

type CardProps = Omit<Props, "projects" | "onChange"> & {
  project: ProjectRecord;
  landingPosition?: number;
  index: number;
  total: number;
  overlay?: boolean;
  onReorder: (index: number) => void;
};

function ProjectCard({
  project,
  landingPosition,
  index,
  total,
  disabled,
  overlay,
  onEdit,
  onTogglePublish,
  onDelete,
  onReorder,
}: CardProps) {
  const cover =
    project.images.find((image) => image.isCover) ?? project.images[0];
  const title = project.translations.es?.title || project.slug;

  return (
    <KanbanItem
      value={project.id}
      disabled={disabled}
      role="group"
      tabIndex={-1}
      aria-label={title}
    >
      <article
        className={`rounded-lg border bg-surface p-3 transition-colors ${landingPosition ? "border-orange/30" : "border-white/10"} ${overlay ? "shadow-2xl ring-2 ring-orange/40" : "hover:border-white/25"}`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <KanbanItemHandle asChild>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Arrastrar ${title}`}
                className="flex size-8 touch-none items-center justify-center rounded-md text-paragraph hover:bg-white/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-orange disabled:cursor-wait"
              >
                <GripVertical className="size-4" />
              </button>
            </KanbanItemHandle>
            {landingPosition ? (
              <Badge className="border-orange/20 bg-orange/10 text-orange">
                Landing · {landingPosition}
              </Badge>
            ) : (
              <span className="text-xs text-paragraph">
                {project.isPublished ? `Portfolio · ${index + 1}` : "Borrador"}
              </span>
            )}
          </div>
          {!overlay && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Acciones de ${title}`}
                  className="flex size-8 items-center justify-center rounded-md text-paragraph hover:bg-white/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-orange"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-white/10 bg-surface text-foreground"
              >
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePublish(project)}>
                  {project.isPublished ? (
                    <ToggleLeft className="size-4" />
                  ) : (
                    <ToggleRight className="size-4" />
                  )}
                  {project.isPublished ? "Pasar a borrador" : "Publicar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  disabled={index === 0}
                  onClick={() => onReorder(0)}
                >
                  <ChevronsUp className="size-4" />
                  Mover al inicio
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={index === 0}
                  onClick={() => onReorder(index - 1)}
                >
                  <ArrowUp className="size-4" />
                  Subir una posición
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={index === total - 1}
                  onClick={() => onReorder(index + 1)}
                >
                  <ArrowDown className="size-4" />
                  Bajar una posición
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(project)}
                >
                  <Trash2 className="size-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex gap-3">
          <div className="relative aspect-[4/3] w-24 shrink-0 self-start overflow-hidden rounded-md bg-white/5">
            {cover ? (
              <Image
                src={cover.url}
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="96px"
                draggable={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-paragraph">
                <ImageOff className="size-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              disabled={disabled || overlay}
              onClick={() => onEdit(project)}
              className="line-clamp-2 text-left text-sm font-medium leading-5 text-foreground hover:text-orange focus-visible:outline-2 focus-visible:outline-orange"
            >
              {title}
            </button>
            <p className="mt-1 text-xs text-paragraph">
              {CATEGORY_ADMIN_LABELS[project.category] ?? project.category}
            </p>
            {project.client && (
              <p className="mt-1 truncate text-xs text-paragraph">
                {project.client}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {LANGS.map((lang) => (
                <span
                  key={lang.code}
                  title={`${lang.label}: ${isTranslationComplete(project.translations[lang.code]) ? "completo" : "incompleto"}`}
                  className={`rounded border px-1.5 py-0.5 text-[10px] ${isTranslationComplete(project.translations[lang.code]) ? "border-emerald-400/15 bg-emerald-400/5 text-emerald-300" : "border-white/10 text-paragraph"}`}
                >
                  {lang.code.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
        {project.isPublished && !isLandingEligible(project) && (
          <p className="mt-3 border-t border-white/5 pt-2 text-xs text-amber-300">
            {!cover
              ? "Agregá una portada para que pueda aparecer en la landing."
              : "Completá el título en español y el slug para aparecer en la landing."}
          </p>
        )}
      </article>
    </KanbanItem>
  );
}

export function ProjectsKanban(props: Props) {
  const { projects, disabled, onChange } = props;
  const columns: Record<string, ProjectRecord[]> = {
    published: projects.filter((project) => project.isPublished),
    drafts: projects.filter((project) => !project.isPublished),
  };
  const landingIds = columns.published
    .filter(isLandingEligible)
    .slice(0, LANDING_PROJECT_LIMIT)
    .map((project) => project.id);

  function commit(next: Record<string, ProjectRecord[]>) {
    onChange([
      ...next.published.map((project) => ({ ...project, isPublished: true })),
      ...next.drafts.map((project) => ({ ...project, isPublished: false })),
    ]);
  }

  function move({
    activeContainer,
    activeIndex,
    overContainer,
    overIndex,
  }: KanbanMoveEvent) {
    if (disabled || activeIndex < 0) return;
    if (activeContainer === overContainer) {
      const target = Math.min(overIndex, columns[activeContainer].length - 1);
      if (activeIndex !== target)
        commit({
          ...columns,
          [activeContainer]: arrayMove(
            columns[activeContainer],
            activeIndex,
            target,
          ),
        });
      return;
    }
    const source = [...columns[activeContainer]];
    const destination = [...columns[overContainer]];
    const [project] = source.splice(activeIndex, 1);
    destination.splice(Math.max(0, overIndex), 0, project);
    commit({
      ...columns,
      [activeContainer]: source,
      [overContainer]: destination,
    });
  }

  function card(
    project: ProjectRecord,
    columnId: string,
    index: number,
    overlay = false,
  ) {
    const landingIndex = landingIds.indexOf(project.id);
    return (
      <ProjectCard
        key={project.id}
        {...props}
        project={project}
        index={index}
        total={columns[columnId].length}
        landingPosition={landingIndex < 0 ? undefined : landingIndex + 1}
        overlay={overlay}
        onReorder={(target) =>
          commit({
            ...columns,
            [columnId]: arrayMove(columns[columnId], index, target),
          })
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <Kanban
        value={columns}
        onValueChange={commit}
        getItemValue={(project) => project.id}
        onMove={move}
      >
        <KanbanBoard className="grid-cols-[repeat(2,minmax(18rem,1fr))] items-start gap-4 sm:grid-cols-[repeat(2,minmax(20rem,1fr))]">
          {Object.entries(columns).map(([columnId, items]) => (
            <KanbanColumn
              key={columnId}
              value={columnId}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
            >
              <header className="px-1 pb-4 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className={`size-2 rounded-full ${columnId === "published" ? "bg-orange" : "bg-white/30"}`}
                    />
                    {columnId === "published" ? "Publicados" : "Borradores"}
                  </h2>
                  <Badge className="border-white/10 bg-white/5 text-paragraph">
                    {items.length}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-paragraph">
                  {columnId === "published"
                    ? "De arriba hacia abajo: los primeros 5 con portada aparecen en la landing."
                    : "Arrastrá un proyecto a Publicados cuando esté listo."}
                </p>
              </header>
              <KanbanColumnContent value={columnId} className="min-h-48 gap-3">
                {items.length === 0 && (
                  <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-white/15 px-6 text-center text-sm text-paragraph">
                    Soltá un proyecto acá.
                  </div>
                )}
                {items.map((project, index) => card(project, columnId, index))}
              </KanbanColumnContent>
            </KanbanColumn>
          ))}
        </KanbanBoard>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant !== "item") return null;
            const columnId = Object.keys(columns).find((id) =>
              columns[id].some((project) => project.id === value),
            );
            if (!columnId) return null;
            const index = columns[columnId].findIndex(
              (project) => project.id === value,
            );
            return card(columns[columnId][index], columnId, index, true);
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}

export default ProjectsKanban;
