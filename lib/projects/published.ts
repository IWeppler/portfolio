import { supabaseRest } from "@/lib/supabase/rest";
import { DEFAULT_CATEGORY, isProjectCategory, type ProjectCategory } from "./categories";

export type PublishedProject = {
  slug: string;
  name: string;
  category: ProjectCategory;
  excerpt: string;
  content: string;
  cover: string | null;
  images: string[];
  deployUrl: string | null;
  githubUrl: string | null;
  client: string | null;
  isFeatured: boolean;
};

type TranslationRow = {
  idioma: string;
  titulo: string | null;
  descripcion: string | null;
  contenido: string | null;
};

type ImageRow = {
  url: string;
  es_portada: boolean | null;
  orden: number | null;
};

type PublishedRow = {
  slug: string | null;
  client: string | null;
  url_deploy: string | null;
  url_github: string | null;
  category: string | null;
  is_featured: boolean | null;
  orden: number | null;
  created_at: string | null;
  project_translations: TranslationRow[] | null;
  project_images: ImageRow[] | null;
};

const DEFAULT_LANG = "es";

const SELECT =
  "slug,client,url_deploy,url_github,category,is_featured,orden,created_at," +
  "project_translations(idioma,titulo,descripcion,contenido)," +
  "project_images(url,es_portada,orden)";

function pickTranslation(rows: TranslationRow[] | null, lang: string) {
  const byLang = rows?.find((row) => row.idioma === lang);
  const fallback = rows?.find((row) => row.idioma === DEFAULT_LANG);

  return {
    titulo: byLang?.titulo || fallback?.titulo || "",
    descripcion: byLang?.descripcion || fallback?.descripcion || "",
    contenido: byLang?.contenido || fallback?.contenido || "",
  };
}

function toPublishedProject(row: PublishedRow, lang: string): PublishedProject | null {
  if (!row.slug) return null;

  const translation = pickTranslation(row.project_translations, lang);

  if (!translation.titulo) return null;

  const images = [...(row.project_images ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const cover = images.find((image) => image.es_portada) ?? images[0];

  return {
    slug: row.slug,
    name: translation.titulo,
    category: isProjectCategory(row.category) ? row.category : DEFAULT_CATEGORY,
    excerpt: translation.descripcion,
    content: translation.contenido,
    cover: cover?.url ?? null,
    images: images.map((image) => image.url),
    deployUrl: row.url_deploy,
    githubUrl: row.url_github,
    client: row.client,
    isFeatured: Boolean(row.is_featured),
  };
}

/**
 * Proyectos publicados desde el panel. Se cachea 60s: publicar o despublicar se
 * ve en la landing sin necesidad de rebuild.
 */
export async function getPublishedProjects(lang: string): Promise<PublishedProject[]> {
  try {
    const response = await supabaseRest(
      `projects?is_published=eq.true&select=${SELECT}&order=orden.asc.nullslast,created_at.desc`,
      { method: "GET", next: { revalidate: 60 } }
    );
    const rows = (await response.json()) as PublishedRow[];

    return rows
      .map((row) => toPublishedProject(row, lang))
      .filter((project): project is PublishedProject => project !== null);
  } catch (error) {
    // La landing no puede caerse porque Supabase no responda: se cae al
    // contenido estatico de los locales.
    console.error("projects: failed to load published projects", error);

    return [];
  }
}

export async function getPublishedProject(slug: string, lang: string) {
  const projects = await getPublishedProjects(lang);

  return projects.find((project) => project.slug === slug) ?? null;
}
