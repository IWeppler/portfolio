"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { Reveal } from "../ui/Reveal";

export type ProjectRow = {
  slug: string;
  name: string;
  excerpt: string;
  cover: string;
};

// Resorte suave: la vista previa persigue al cursor con algo de inercia en vez
// de quedar pegada al puntero, que se siente artificial.
const SPRING = { stiffness: 260, damping: 30, mass: 0.6 };

/**
 * Lista de proyectos en filas grandes de texto. Con mouse, la portada del
 * proyecto aparece flotando junto al cursor y las demas filas se apagan; en
 * pantallas tactiles cada fila muestra su propia imagen.
 */
export function ProjectList({ lang, projects }: { lang: string; projects: ProjectRow[] }) {
  const [active, setActive] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  return (
    <div
      className="relative"
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        x.set(event.clientX);
        y.set(event.clientY);
      }}
    >
      <ul
        className="flex flex-col [@media(hover:hover)_and_(pointer:fine)]:[&:has(a:hover)_a:not(:hover)]:opacity-35"
        onPointerLeave={() => setActive(null)}
      >
        {projects.map((project, index) => (
          <Reveal as="li" key={project.slug} delay={Math.min(index, 4) * 70}>
            <Link
              href={`/${lang}/projects/${project.slug}`}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setActive(index);
              }}
              onFocus={() => setActive(null)}
              className="grid grid-cols-1 gap-3 py-6 transition-opacity duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange md:grid-cols-12 md:items-baseline md:gap-8 md:py-7"
            >
              <div className="relative mb-2 aspect-[16/10] w-full overflow-hidden bg-surface [@media(hover:hover)_and_(pointer:fine)]:hidden">
                <Image
                  src={project.cover}
                  alt={project.name}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>

              <h3 className="text-title font-medium text-balance relative z-40 text-foreground mix-blend-difference md:col-span-7">
                {project.name}
              </h3>

              {project.excerpt && (
                <p className="text-body text-paragraph md:col-span-4 md:col-start-9">
                  {project.excerpt}
                </p>
              )}
            </Link>
          </Reveal>
        ))}
      </ul>

      {/* Vista previa flotante: todas las portadas apiladas y solo la activa
          visible, asi el cambio entre filas es un fundido y no un salto. */}
      {!reduceMotion && (
        <motion.div
          aria-hidden="true"
          style={{ x: springX, y: springY }}
          className="pointer-events-none fixed left-0 top-0 z-30 hidden [@media(hover:hover)_and_(pointer:fine)]:block"
        >
          <div
            className={`relative -ml-[170px] -mt-[128px] aspect-[4/3] w-[340px] overflow-hidden bg-surface transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              active === null ? "scale-90 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            {projects.map((project, index) => (
              <Image
                key={project.slug}
                src={project.cover}
                alt=""
                fill
                sizes="340px"
                className={`object-cover transition-opacity duration-300 ${
                  index === active ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
