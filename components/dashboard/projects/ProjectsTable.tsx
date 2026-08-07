"use client";

import Image from "next/image";
import { ImageOff, Loader2, MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LANGS, isTranslationComplete, type ProjectRecord } from "@/components/dashboard/projects/types";
import { CATEGORY_ADMIN_LABELS } from "@/lib/projects/categories";

type ProjectsTableProps = {
  projects: ProjectRecord[];
  isLoading: boolean;
  onEdit: (project: ProjectRecord) => void;
  onTogglePublish: (project: ProjectRecord) => void;
  onDelete: (project: ProjectRecord) => void;
};

export function ProjectsTable({ projects, isLoading, onEdit, onTogglePublish, onDelete }: ProjectsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-surface py-16 text-sm text-paragraph">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando proyectos
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-surface py-16 text-center text-sm text-paragraph">
        No hay proyectos cargados todavía. Creá el primero con &quot;+ Nuevo Proyecto&quot;.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-paragraph">Portada</TableHead>
            <TableHead className="text-paragraph">Proyecto</TableHead>
            <TableHead className="text-paragraph">Idiomas</TableHead>
            <TableHead className="text-paragraph">Categoría</TableHead>
            <TableHead className="text-paragraph">Estado</TableHead>
            <TableHead className="w-12 text-paragraph">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const cover = project.images.find((image) => image.isCover) ?? project.images[0];
            const title = project.translations.es?.title || project.slug;

            return (
              <TableRow key={project.id} className="border-white/5">
                <TableCell>
                  <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-white/[0.04]">
                    {cover ? (
                      <Image src={cover.url} alt={title} fill unoptimized className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageOff className="h-4 w-4 text-paragraph" />
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <p className="font-medium text-foreground">{title}</p>
                  {project.client && <p className="text-xs text-paragraph">{project.client}</p>}
                </TableCell>

                <TableCell>
                  <div className="flex gap-1.5">
                    {LANGS.map((lang) => {
                      const complete = isTranslationComplete(project.translations[lang.code]);
                      return (
                        <Badge
                          key={lang.code}
                          className={
                            complete
                              ? "border-transparent bg-emerald-400/10 text-emerald-300"
                              : "border-white/10 bg-white/[0.03] text-paragraph"
                          }
                        >
                          {lang.code.toUpperCase()}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge className="border-white/10 bg-white/[0.03] text-paragraph">
                    {CATEGORY_ADMIN_LABELS[project.category] ?? project.category}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      className={
                        project.isPublished
                          ? "border-transparent bg-emerald-400/10 text-emerald-300"
                          : "border-transparent bg-white/[0.06] text-paragraph"
                      }
                    >
                      {project.isPublished ? "Publicado" : "Borrador"}
                    </Badge>
                    {project.isFeatured && (
                      <Badge className="border-transparent bg-blue-400/10 text-blue-300">Destacado</Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-paragraph transition-colors hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-white/10 bg-surface text-foreground">
                      <DropdownMenuItem onClick={() => onEdit(project)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTogglePublish(project)}>
                        {project.isPublished ? (
                          <ToggleLeft className="h-4 w-4" />
                        ) : (
                          <ToggleRight className="h-4 w-4" />
                        )}
                        {project.isPublished ? "Pasar a borrador" : "Publicar"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(project)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
