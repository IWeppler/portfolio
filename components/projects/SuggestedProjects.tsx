import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDictionary } from "@/lib/get-dictionary";
import { getPublishedProjects } from "@/lib/projects/published";
import { categoryLabel } from "@/lib/projects/categories";

const CARD_COUNT = 2;

interface Props {
  lang: string;
  /** Slug del proyecto que se esta viendo: nunca se sugiere a si mismo. */
  currentSlug: string;
}

/**
 * Cierre de la ficha de proyecto: en vez de mandar al visitante de vuelta al
 * listado, le ofrece dos proyectos mas para seguir viendo.
 *
 * Reusa `getPublishedProjects`, que ya trae la lista completa cacheada 60s, asi
 * que no agrega una consulta extra a Supabase respecto de lo que la pagina ya
 * pide para renderizar el proyecto actual.
 */
export default async function SuggestedProjects({ lang, currentSlug }: Props) {
  const t = getDictionary(lang);
  const projects = await getPublishedProjects(lang);

  const current = projects.find((project) => project.slug === currentSlug);
  const candidates = projects.filter((project) => project.slug !== currentSlug);

  // Primero los de la misma categoria (la sugerencia mas relevante), despues el
  // resto respetando el orden del panel. `Set` evita repetir un slug al unir.
  const sameCategory = candidates.filter(
    (project) => current && project.category === current.category
  );
  const suggestions = [...new Map(
    [...sameCategory, ...candidates].map((project) => [project.slug, project])
  ).values()].slice(0, CARD_COUNT);

  // Con un solo proyecto publicado no hay nada que sugerir: mejor no dejar una
  // seccion vacia colgando al final de la pagina.
  if (suggestions.length === 0) return null;

  return (
    <section className="pt-16 border-t border-assets">
      <h2 className="mb-10 text-sm uppercase tracking-widest text-paragraph">
        {t.projects.suggestedTitle}
      </h2>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {suggestions.map((project) => (
          <Link
            key={project.slug}
            href={`/${lang}/projects/${project.slug}`}
            className="group block w-full"
          >
            <div className="relative mb-4 aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-900 md:aspect-[1.2/1]">
              {project.cover && (
                <Image
                  src={project.cover}
                  alt={project.name}
                  fill
                  className="object-cover transition-transform duration-900 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col items-start">
                <h3 className="text-xl font-light uppercase tracking-tight">
                  {project.name}
                </h3>
                <p className="mt-1 text-xs tracking-widest text-paragraph md:text-sm">
                  {categoryLabel(project.category, lang)}
                </p>
              </div>

              <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-paragraph transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
