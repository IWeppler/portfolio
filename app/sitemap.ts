import { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/projects/published";
import { LANGS, SITE_URL } from "@/lib/seo";

// Cada pagina va una vez por idioma, con sus versiones en los otros idiomas
// (hreflang), igual que en los alternates de la metadata.
function localized(path: string, priority: number): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LANGS.map((lang) => [lang, `${SITE_URL}/${lang}${path}`]));

  return LANGS.map((lang) => ({
    url: `${SITE_URL}/${lang}${path}`,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Los slugs salen de los proyectos publicados en Supabase.
  const projectSlugs = (await getPublishedProjects("es")).map((project) => project.slug);

  return [
    ...localized("", 1),
    ...localized("/projects", 0.8),
    ...localized("/contacto", 0.6),
    // Landing solo en espanol.
    { url: `${SITE_URL}/es/inmobiliarias`, priority: 0.9 },
    ...projectSlugs.flatMap((slug) => localized(`/projects/${slug}`, 0.7)),
  ];
}
