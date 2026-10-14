import { LANDING_PROJECT_LIMIT } from "@/lib/projects/landing";
import { getDictionary } from "@/lib/get-dictionary";
import { getPublishedProjects } from "@/lib/projects/published";
import { categoryLabel } from "@/lib/projects/categories";
import { VelocityGallery, type GalleryItem } from "./projects/VelocityGallery";
import { Reveal } from "./ui/Reveal";

// Capturas por proyecto: la portada y una mas, como "vista" y "detalle".
const IMAGES_PER_PROJECT = 2;

/**
 * "De cerca": una tira que se arrastra con capturas de los proyectos.
 *
 * - Los proyectos que no entran en la lista principal aparecen con su portada
 *   y una captura mas.
 * - Los que si estan en la lista ya muestran portada (y la segunda en su
 *   ficha), asi que aca aportan las capturas a partir de la tercera: por
 *   ejemplo, las del panel de TerraNova.
 *
 * Si no queda ninguna captura, la seccion no se muestra.
 */
export async function UpClose({ lang }: { lang: string }) {
  const t = getDictionary(lang);
  const published = (await getPublishedProjects(lang)).filter((project) => project.cover);

  const items: GalleryItem[] = published.flatMap((project, position) => {
    const index = `(${String(position + 1).padStart(2, "0")})`;
    const all = [
      project.cover as string,
      ...project.images.filter((url) => url !== project.cover),
    ];
    const inList = position < LANDING_PROJECT_LIMIT;
    const images = inList ? all.slice(IMAGES_PER_PROJECT) : all.slice(0, IMAGES_PER_PROJECT);

    // La primera captura que se muestra lleva la categoria; las demas, "Detalle".
    return images.map((src, i) => ({
      key: src,
      href: `/${lang}/projects/${project.slug}`,
      src,
      name: project.name,
      index,
      detail: i === 0 ? categoryLabel(project.category, lang) : t.slider.detail,
    }));
  });

  if (items.length === 0) return null;

  return (
    <section className="w-full pb-32 md:pb-48">
      <Reveal className="mb-6 flex justify-between gap-4 text-paragraph md:mb-8">
        <h2 className="label">({t.slider.label})</h2>
        <p className="label">{t.slider.hint}</p>
      </Reveal>

      <VelocityGallery items={items} />
    </section>
  );
}
