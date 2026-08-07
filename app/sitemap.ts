import { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/projects/published";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ignacioweppler.com";

  const languages = ["es", "en", "pt"];
  const staticRoutes = ["", "/proyectos", "/contacto", "/about"];

  const routes = languages.flatMap((lang) =>
    staticRoutes.map((route) => ({
      url: `${baseUrl}/${lang}${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.8,
    }))
  );

  // Los slugs salen de los proyectos publicados en Supabase.
  const projectSlugs = (await getPublishedProjects("es")).map((project) => project.slug);

  const projectRoutes = languages.flatMap((lang) =>
    projectSlugs.map((slug) => ({
      url: `${baseUrl}/${lang}/projects/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }))
  );

  return [...routes, ...projectRoutes];
}
