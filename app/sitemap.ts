import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const projectSlugs = [
    "proyecto1", "proyecto2", "proyecto3", 
    "proyecto4", "proyecto5", "proyecto6"
  ];

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