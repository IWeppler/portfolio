"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedTitle } from "@/components/ui/AnimatedTitle";

export interface ProjectItem {
  slug: string;
  name: string;
  etiqueta: string;
  cover: StaticImageData;
  category?: string;
}

interface Props {
  projects: ProjectItem[];
  lang: string;
}

export const ProjectsGrid = ({ projects = [], lang }: Props) => {
  const [filter, setFilter] = useState("Todos");

  const categories = ["Todos", "Web", "App/SaaS", "E-commerce"];

  const getCategory = (tag: string) => {
    if (!tag) return "Web";

    const t = tag.toLowerCase();
    if (
      t.includes("saas") ||
      t.includes("sistema") ||
      t.includes("app") ||
      t.includes("platform")
    )
      return "App/SaaS";
    if (t.includes("e-commerce") || t.includes("tienda")) return "E-commerce";
    return "Web";
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === "Todos") return true;
    return getCategory(p.etiqueta) === filter;
  });

  return (
    <div>
      {/* BARRA DE FILTROS (Estilo Píldora) */}
      <div className="flex flex-wrap gap-4 mb-12">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
              filter === cat
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-paragraph border-assets hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID ANIMADA */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => {

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
                      alt={project.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      placeholder="blur"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                  </div>

                  {/* Textos */}
                  <div className="flex flex-col items-start">
                    <h3 className="text-2xl font-medium tracking-tight group-hover:text-orange transition-colors">
                      {project.name}
                    </h3>

                    <p className="text-xs md:text-sm text-paragraph uppercase tracking-widest mt-1">
                      {project.etiqueta}
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
