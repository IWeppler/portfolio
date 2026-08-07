"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageManager } from "@/components/dashboard/projects/ImageManager";
import {
  CATEGORY_ADMIN_LABELS,
  DEFAULT_CATEGORY,
  PROJECT_CATEGORIES,
  type ProjectCategory,
} from "@/lib/projects/categories";
import {
  LANGS,
  type LangCode,
  type ProjectImage,
  type ProjectRecord,
  type ProjectTranslations,
} from "@/components/dashboard/projects/types";

type ProjectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectRecord | null;
  onSaved: () => void;
};

type FormState = {
  slug: string;
  client: string;
  deployUrl: string;
  githubUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  category: ProjectCategory;
  translations: ProjectTranslations;
  images: ProjectImage[];
};

const emptyForm: FormState = {
  slug: "",
  client: "",
  deployUrl: "",
  githubUrl: "",
  isPublished: false,
  isFeatured: false,
  category: DEFAULT_CATEGORY,
  translations: {},
  images: [],
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

export function ProjectFormDialog({ open, onOpenChange, project, onSaved }: ProjectFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (project) {
      setForm({
        slug: project.slug,
        client: project.client ?? "",
        deployUrl: project.deployUrl ?? "",
        githubUrl: project.githubUrl ?? "",
        isPublished: project.isPublished,
        isFeatured: project.isFeatured,
        category: project.category ?? DEFAULT_CATEGORY,
        translations: project.translations ?? {},
        images: project.images ?? [],
      });
    } else {
      setForm(emptyForm);
    }

    setError(null);
  }, [open, project]);

  function updateTranslation(lang: LangCode, field: "title" | "excerpt" | "content", value: string) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [lang]: {
          ...current.translations[lang],
          [field]: value,
        },
      },
    }));
  }

  const defaultLang = LANGS.find((lang) => lang.isDefault)?.code ?? LANGS[0].code;
  const autoSlug = slugify(form.translations[defaultLang]?.title ?? "");
  // Al editar conservamos el slug guardado para no romper URLs publicadas.
  const effectiveSlug = project ? form.slug : autoSlug;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!effectiveSlug) {
      setError("Escribe el título en el idioma por defecto para generar el slug.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      slug: effectiveSlug,
      // null y no undefined: JSON.stringify borra las claves undefined y el
      // PATCH no podria vaciar un campo que antes tenia valor.
      client: form.client.trim() || null,
      deployUrl: form.deployUrl.trim() || null,
      githubUrl: form.githubUrl.trim() || null,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      category: form.category,
      translations: form.translations,
      images: form.images,
    };

    try {
      const response = await fetch("/api/projects", {
        method: project ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project ? { id: project.id, ...payload } : payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "save_failed");
      }

      onSaved();
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message === "duplicate_slug"
          ? `Ya existe un proyecto con el slug "${effectiveSlug}". Cambia el título.`
          : "No se pudo guardar el proyecto. Revisa los campos e intenta de nuevo."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[92vh] w-[95vw] max-w-[1400px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-white/10 bg-surface text-foreground sm:max-w-[1400px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium uppercase tracking-tight">
            {project ? "Editar Proyecto" : "Nuevo Proyecto"}
          </DialogTitle>
          <DialogDescription className="text-paragraph">
            Completa los datos globales y el contenido traducido para cada idioma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-6">
          <div className="grid min-h-0 gap-8 lg:grid-cols-2">
            {/* Columna izquierda: campos globales + imagenes */}
            <div className="grid min-h-0 content-start gap-4 overflow-y-auto pr-1 md:grid-cols-2">

              <div className="grid gap-2">
                <Label htmlFor="client">Cliente</Label>
                <Input
                  id="client"
                  value={form.client}
                  onChange={(event) => setForm((current) => ({ ...current, client: event.target.value }))}
                  placeholder="El Nuevo Manantial"
                  className="border-white/10 bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deployUrl">URL de demo</Label>
                <Input
                  id="deployUrl"
                  type="url"
                  value={form.deployUrl}
                  onChange={(event) => setForm((current) => ({ ...current, deployUrl: event.target.value }))}
                  placeholder="https://..."
                  className="border-white/10 bg-background"
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="githubUrl">URL de GitHub</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  value={form.githubUrl}
                  onChange={(event) => setForm((current) => ({ ...current, githubUrl: event.target.value }))}
                  placeholder="https://github.com/..."
                  className="border-white/10 bg-background"
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, category: value as ProjectCategory }))
                  }
                >
                  <SelectTrigger id="category" className="border-white/10 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-surface text-foreground">
                    {PROJECT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {CATEGORY_ADMIN_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-md border border-white/10 bg-background px-4 py-3">
                <Label htmlFor="isPublished" className="cursor-pointer">
                  Publicado
                </Label>
                <Switch
                  id="isPublished"
                  checked={form.isPublished}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isPublished: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-white/10 bg-background px-4 py-3">
                <Label htmlFor="isFeatured" className="cursor-pointer">
                  Destacado
                </Label>
                <Switch
                  id="isFeatured"
                  checked={form.isFeatured}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isFeatured: checked }))}
                />
              </div>

              {/* Imagenes */}
              <div className="grid gap-3 md:col-span-2">
                <Label>Imágenes</Label>
                <ImageManager
                  images={form.images}
                  onChange={(images) => setForm((current) => ({ ...current, images }))}
                />
              </div>
            </div>

            {/* Columna derecha: contenido multilingue */}
            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
              <Label>Contenido por idioma</Label>
              <Tabs defaultValue="es" className="flex min-h-0 flex-col">
                <TabsList className="bg-background">
                  {LANGS.map((lang) => (
                    <TabsTrigger key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                      {lang.isDefault && <span className="ml-1 text-[10px] text-paragraph">(Default)</span>}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {LANGS.map((lang) => (
                  <TabsContent
                    key={lang.code}
                    value={lang.code}
                    className="flex min-h-0 flex-1 flex-col gap-4 pt-4"
                  >
                    <div className="grid gap-2">
                      <Label htmlFor={`title-${lang.code}`}>Título del proyecto</Label>
                      <Input
                        id={`title-${lang.code}`}
                        required={lang.isDefault}
                        value={form.translations[lang.code]?.title ?? ""}
                        onChange={(event) => updateTranslation(lang.code, "title", event.target.value)}
                        placeholder="Work Manantial"
                        className="border-white/10 bg-background"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`excerpt-${lang.code}`}>Descripción corta / Extracto</Label>
                      <Textarea
                        id={`excerpt-${lang.code}`}
                        required={lang.isDefault}
                        value={form.translations[lang.code]?.excerpt ?? ""}
                        onChange={(event) => updateTranslation(lang.code, "excerpt", event.target.value)}
                        placeholder="Resumen breve para tarjetas y listados."
                        className="min-h-20 border-white/10 bg-background"
                      />
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-2">
                      <Label htmlFor={`content-${lang.code}`}>Caso de estudio / Detalle</Label>
                      <Textarea
                        id={`content-${lang.code}`}
                        required={lang.isDefault}
                        value={form.translations[lang.code]?.content ?? ""}
                        onChange={(event) => updateTranslation(lang.code, "content", event.target.value)}
                        placeholder="Detalle del proyecto. Soporta Markdown."
                        className="h-full min-h-32 flex-1 resize-none border-white/10 bg-background"
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <p className="text-sm text-red-400">{error}</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-5 text-sm font-medium text-paragraph transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-orange px-5 text-sm font-medium text-white transition-colors hover:bg-orange/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Guardando" : project ? "Guardar cambios" : "Crear proyecto"}
            </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
