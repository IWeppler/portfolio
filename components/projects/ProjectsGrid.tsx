"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
      {/* BARRA DE FILTROS (Estilo Píldora) */}
      <div className="flex flex-wrap gap-4 mb-12">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
              filter === category
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-paragraph border-assets hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* GRID ANIMADA */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => {
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={project.slug}
                className={"md:col-span-1"}
              >
                <Link
                  href={`/${lang}/projects/${project.slug}`}
                  className="group block w-full h-full"
                >
                  {/* Imagen */}
                  <div
                    className={`relative w-full overflow-hidden rounded-xl mb-4 aspect-4/3 md:aspect-[1.2/1]`}
                  >
                    <Image
                      src={project.cover}
                      alt={project.coverAlt ?? project.name}
                      fill
                      className="object-cover transition-transform duration-900 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      // El blur solo existe para las imagenes importadas de /public.
                      placeholder={typeof project.cover === "string" ? "empty" : "blur"}
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                  </div>

                  {/* Textos */}
                  <div className="flex flex-col items-start">
                    <h3 className="text-xl font-light uppercase tracking-tight">
                      {project.name}
                    </h3>

                    <p className="text-xs md:text-sm text-paragraph tracking-widest mt-1">
                      {categoryLabels[project.category]}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 && (
        <div className="py-20 text-center text-white/40">
          No hay proyectos en esta categoría por ahora.
        </div>
      )}
    </div>
  );
};
