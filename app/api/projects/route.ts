import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { markLandingProjects } from "@/lib/projects/landing";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import { supabaseRest } from "@/lib/supabase/project-storage";
import {
  DEFAULT_CATEGORY,
  PROJECT_CATEGORIES,
} from "@/lib/projects/categories";

const urlOptional = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().url().max(500).optional(),
);

const translationSchema = z.object({
  title: z.string().trim().max(160).optional(),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().max(8000).optional(),
});

const translationsSchema = z.object({
  es: translationSchema.optional(),
  en: translationSchema.optional(),
  pt: translationSchema.optional(),
});

const altText = z.string().trim().max(250).optional();

const imageSchema = z.object({
  url: z.string().trim().url(),
  isCover: z.boolean().default(false),
  // Texto alternativo por idioma (project_images.alt).
  alt: z.object({ es: altText, en: altText, pt: altText }).default({}),
});

const projectFields = {
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug invalido: usar minusculas, numeros y guiones.",
    ),
  client: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(160).optional(),
  ),
  category: z.enum(PROJECT_CATEGORIES).default(DEFAULT_CATEGORY),
  deployUrl: urlOptional,
  githubUrl: urlOptional,
  isPublished: z.boolean().default(false),
  translations: translationsSchema.default({}),
  images: z.array(imageSchema).max(20).default([]),
};

const createProjectSchema = z
  .object(projectFields)
  .refine((data) => Boolean(data.translations.es?.title?.trim()), {
    message: "El titulo en espanol es obligatorio.",
    path: ["translations", "es", "title"],
  });

// Ojo: `.partial()` NO saca los `.default()`, asi que un PATCH parcial saldria
// con `translations: {}` / `images: []` y borraria traducciones e imagenes.
// Por eso el schema de update declara cada campo optional sin default.
const updateProjectSchema = z.object({
  slug: projectFields.slug.optional(),
  client: projectFields.client.optional(),
  category: z.enum(PROJECT_CATEGORIES).optional(),
  deployUrl: urlOptional,
  githubUrl: urlOptional,
  isPublished: z.boolean().optional(),
  translations: translationsSchema.optional(),
  images: z.array(imageSchema).max(20).optional(),
});

const PROJECT_FIELD_NAMES = Object.keys(projectFields);

type ProjectInput = z.infer<typeof createProjectSchema>;
type ProjectPatch = z.infer<typeof updateProjectSchema>;

type TranslationRow = {
  idioma: string;
  titulo: string | null;
  descripcion: string | null;
  contenido: string | null;
};

type ImageAlt = { es?: string; en?: string; pt?: string };

type ImageRow = {
  url: string;
  es_portada: boolean | null;
  orden: number | null;
  alt: ImageAlt | null;
};

type ProjectRow = {
  id: string;
  slug: string | null;
  client: string | null;
  url_deploy: string | null;
  url_github: string | null;
  category: string | null;
  is_published: boolean | null;
  orden: number | null;
  created_at?: string;
  project_translations?: TranslationRow[] | null;
  project_images?: ImageRow[] | null;
};

const PROJECT_SELECT =
  "id,slug,client,url_deploy,url_github,category,is_published,orden,created_at," +
  "project_translations(idioma,titulo,descripcion,contenido)," +
  "project_images(url,es_portada,orden,alt)";

function emptyStringToUndefined(value: unknown) {
  if (value === null) return undefined;

  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

/**
 * Columnas de "projects". Las traducciones e imagenes van en sus propias tablas.
 * `provided` son las claves que mando el cliente: solo esas se escriben, para que
 * un PATCH parcial no pise campos que no venian en el body.
 */
function toProjectColumns(payload: ProjectPatch, provided: Set<string>) {
  const columns: Record<string, unknown> = {};

  if (provided.has("slug")) columns.slug = payload.slug;
  if (provided.has("client")) columns.client = payload.client ?? null;
  if (provided.has("deployUrl")) columns.url_deploy = payload.deployUrl ?? null;
  if (provided.has("githubUrl")) columns.url_github = payload.githubUrl ?? null;
  if (provided.has("category"))
    columns.category = payload.category ?? DEFAULT_CATEGORY;
  if (provided.has("isPublished")) columns.is_published = payload.isPublished;

  return columns;
}

function toTranslationRows(
  projectId: string,
  translations: ProjectPatch["translations"],
) {
  return Object.entries(translations ?? {})
    .filter(([, value]) =>
      Boolean(value?.title || value?.excerpt || value?.content),
    )
    .map(([idioma, value]) => ({
      project_id: projectId,
      idioma,
      titulo: value?.title ?? null,
      descripcion: value?.excerpt ?? null,
      contenido: value?.content ?? null,
    }));
}

function toImageRows(projectId: string, images: ProjectPatch["images"]) {
  return (images ?? []).map((image, index) => ({
    project_id: projectId,
    url: image.url,
    es_portada: image.isCover,
    orden: index,
    // Solo los idiomas con texto: un alt vacio no se guarda.
    alt: Object.fromEntries(Object.entries(image.alt ?? {}).filter(([, text]) => Boolean(text))),
  }));
}

function fromProjectRow(row: ProjectRow) {
  const translations: Record<
    string,
    { title?: string; excerpt?: string; content?: string }
  > = {};

  for (const translation of row.project_translations ?? []) {
    translations[translation.idioma] = {
      title: translation.titulo ?? undefined,
      excerpt: translation.descripcion ?? undefined,
      content: translation.contenido ?? undefined,
    };
  }

  const images = [...(row.project_images ?? [])]
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((image) => ({ url: image.url, isCover: Boolean(image.es_portada), alt: image.alt ?? {} }));

  return {
    id: row.id,
    slug: row.slug ?? "",
    client: row.client,
    category: row.category ?? DEFAULT_CATEGORY,
    deployUrl: row.url_deploy,
    githubUrl: row.url_github,
    isPublished: Boolean(row.is_published),
    isFeatured: false,
    order: row.orden,
    translations,
    images,
    created_at: row.created_at,
  };
}

async function insertRows(table: string, rows: unknown[]) {
  if (rows.length === 0) return;

  await supabaseRest(table, {
    method: "POST",
    body: JSON.stringify(rows),
  });
}

async function deleteChildren(table: string, projectId: string) {
  await supabaseRest(
    `${table}?project_id=eq.${encodeURIComponent(projectId)}`,
    {
      method: "DELETE",
    },
  );
}

async function readProject(id: string) {
  const response = await supabaseRest(
    `projects?id=eq.${encodeURIComponent(id)}&select=${PROJECT_SELECT}`,
    { method: "GET" },
  );
  const rows = (await response.json()) as ProjectRow[];

  return rows[0] ? fromProjectRow(rows[0]) : null;
}

async function createProject(payload: ProjectInput) {
  const lastResponse = await supabaseRest(
    "projects?select=orden&orden=not.is.null&order=orden.desc&limit=1",
    { method: "GET", cache: "no-store" },
  );
  const lastRows = (await lastResponse.json()) as { orden: number }[];
  const order = (lastRows[0]?.orden ?? -1) + 1;
  const response = await supabaseRest("projects", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      ...toProjectColumns(payload, new Set(PROJECT_FIELD_NAMES)),
      orden: order,
    }),
  });
  const rows = (await response.json()) as ProjectRow[];
  const created = Array.isArray(rows) ? rows[0] : (rows as ProjectRow);

  try {
    await insertRows(
      "project_translations",
      toTranslationRows(created.id, payload.translations),
    );
    await insertRows("project_images", toImageRows(created.id, payload.images));
  } catch (error) {
    // Sin transacciones via REST: si fallan los hijos, el proyecto huerfano se borra.
    await supabaseRest(`projects?id=eq.${encodeURIComponent(created.id)}`, {
      method: "DELETE",
    }).catch(() => undefined);
    throw error;
  }

  return readProject(created.id);
}

async function updateProject(
  id: string,
  payload: ProjectPatch,
  provided: Set<string>,
) {
  const columns = toProjectColumns(payload, provided);

  if (Object.keys(columns).length > 0) {
    await supabaseRest(`projects?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(columns),
    });
  }

  // Traducciones e imagenes se reemplazan completas, pero solo si el cliente las
  // mando. Un PATCH de `isPublished` no las toca.
  if (provided.has("translations")) {
    await deleteChildren("project_translations", id);
    await insertRows(
      "project_translations",
      toTranslationRows(id, payload.translations),
    );
  }

  if (provided.has("images")) {
    await deleteChildren("project_images", id);
    await insertRows("project_images", toImageRows(id, payload.images));
  }

  return readProject(id);
}

function isDuplicateSlug(error: unknown) {
  return error instanceof Error && error.message.includes("23505");
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const response = await supabaseRest(
      `projects?select=${PROJECT_SELECT}&order=orden.asc.nullslast,created_at.desc,id.asc`,
      { method: "GET" },
    );
    const rows = (await response.json()) as ProjectRow[];

    return NextResponse.json({
      projects: markLandingProjects(rows.map(fromProjectRow)),
    });
  } catch (error) {
    console.error("projects: failed to load projects", error);

    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = createProjectSchema.parse(body);
    const project = await createProject(payload);

    revalidateTag("projects", { expire: 0 });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "invalid_payload", issues: error.issues },
        { status: 400 },
      );
    }

    if (isDuplicateSlug(error)) {
      return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });
    }

    console.error("projects: failed to create project", error);

    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...rest } = body as { id?: string };

    if (typeof id !== "string" || id.trim() === "") {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    const payload = updateProjectSchema.parse(rest);
    const provided = new Set(Object.keys(rest as Record<string, unknown>));
    const project = await updateProject(id, payload, provided);

    revalidateTag("projects", { expire: 0 });
    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "invalid_payload", issues: error.issues },
        { status: 400 },
      );
    }

    if (isDuplicateSlug(error)) {
      return NextResponse.json({ error: "duplicate_slug" }, { status: 409 });
    }

    console.error("projects: failed to update project", error);

    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    // Explicito por si el FK todavia no tiene on delete cascade.
    await deleteChildren("project_translations", id);
    await deleteChildren("project_images", id);
    await supabaseRest(`projects?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    revalidateTag("projects", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("projects: failed to delete project", error);

    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
