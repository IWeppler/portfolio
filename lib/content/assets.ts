import { getPublishedProjects } from "@/lib/projects/published";
import { getKit, type BrandId } from "./kits";

// Imagenes que puede usar una pieza: logos y capturas del kit, y para el
// portfolio ademas los mockups reales de los proyectos publicados.

export async function listContentAssets(brand: BrandId) {
  const kit = getKit(brand);
  const base = { logos: kit.logos, assets: kit.assets };

  if (brand !== "portfolio") return base;

  const projects = await getPublishedProjects("es");

  return {
    ...base,
    projects: projects.map((project) => ({
      slug: project.slug,
      name: project.name,
      category: project.category,
      client: project.client,
      excerpt: project.excerpt,
      cover: project.cover,
      images: project.images.map((url) => ({ url, alt: project.alts[url] })),
    })),
  };
}
