"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { coverTransition } from "@/lib/transitions";

export interface ProjectItem {
  slug: string;
  name: string;
  category: string;
  /** Estatica desde /public, o URL de Supabase Storage si viene del panel. */
  cover: StaticImageData | string;
  /** Que muestra la portada; sin el, se usa el nombre. */
  coverAlt?: string;
}

interface Props {
  projects: ProjectItem[];
  lang: string;
  /** Label traducido de cada categoria, mas `all` para el filtro sin filtrar. */
  categoryLabels: Record<string, string>;
}

const ALL = "all";

export const ProjectsGrid = ({ projects = [], lang, categoryLabels }: Props) => {
  const [filter, setFilter] = useState(ALL);

  // Solo se ofrecen las categorias que tienen al menos un proyecto, para no
  // dejar filtros que devuelven una grilla vacia.
  const usedCategories = Object.keys(categoryLabels).filter(
    (category) =>
      category !== ALL && projects.some((project) => project.category === category)
  );
  const categories = [ALL, ...usedCategories];

  const filteredProjects = projects.filter(
    (project) => filter === ALL || project.category === filter
  );

  return (
    <div>
      {/* Filtros: mismas etiquetas en mono que el resto del sitio. */}
      <div className="mb-10 flex flex-wrap gap-2 md:mb-14">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={filter === category}
            onClick={() => setFilter(category)}
            className={`label rounded-full px-4 py-2.5 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] ${
              filter === category
                ? "bg-foreground text-background"
                : "bg-foreground/[0.06] text-paragraph hover:bg-foreground/[0.12] hover:text-foreground"
            }`}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      <motion.ul layout className="grid grid-cols-1 gap-x-3 gap-y-12 md:grid-cols-2 md:gap-y-20">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => {
            const index = projects.indexOf(project);
            return (
              <motion.li
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                key={project.slug}
              >
                <Link
                  href={`/${lang}/projects/${project.slug}`}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
                >
                  <div
                    style={coverTransition(project.slug)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-surface"
                  >
                    <Image
                      src={project.cover}
                      alt={project.coverAlt ?? project.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      // El blur solo existe para las imagenes importadas de /public.
                      placeholder={typeof project.cover === "string" ? "empty" : "blur"}
                    />
                  </div>

                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h2 className="text-statement font-medium text-balance">{project.name}</h2>
                    <span className="label shrink-0 text-paragraph">
                      ({String(index + 1).padStart(2, "0")})
                    </span>
                  </div>
                  <p className="label mt-2 text-paragraph">{categoryLabels[project.category]}</p>
                </Link>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>

      {filteredProjects.length === 0 && (
        <p className="label py-20 text-center text-paragraph">No hay proyectos en esta categoría por ahora.</p>
      )}
    </div>
  );
};
