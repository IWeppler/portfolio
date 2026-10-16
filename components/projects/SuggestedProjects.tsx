import Image from "next/image";
import Link from "next/link";
import { coverTransition } from "@/lib/transitions";
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
    <section className="mt-24 border-t border-foreground/20 pt-10 md:mt-40">
      <h2 className="label text-paragraph">({t.projects.suggestedTitle})</h2>

      <ul className="mt-8 grid grid-cols-1 gap-x-3 gap-y-12 md:grid-cols-2">
        {suggestions.map((project) => (
          <li key={project.slug}>
            <Link
              href={`/${lang}/projects/${project.slug}`}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
            >
              {/* Mismo nombre que el hero de su ficha: la portada viaja al abrirla. */}
              <div
                style={coverTransition(project.slug)}
                className="relative aspect-[4/3] w-full overflow-hidden bg-surface"
              >
                {project.cover && (
                  <Image
                    src={project.cover}
                    alt={project.alts[project.cover] ?? project.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                )}
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h3 className="text-statement font-medium text-balance">{project.name}</h3>
                <span
                  aria-hidden="true"
                  className="label shrink-0 text-paragraph transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </div>
              <p className="label mt-2 text-paragraph">{categoryLabel(project.category, lang)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
