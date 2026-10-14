"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { Reveal } from "../ui/Reveal";

export type ProjectRow = {
  slug: string;
  name: string;
  excerpt: string;
  cover: string;
  /** Portada primero, luego el resto de la galeria. */
  images: string[];
};

// Cada cuanto cambia la imagen mientras la vista previa esta a la vista.
const CYCLE_MS = 1400;
// Tope de imagenes por proyecto en la rotacion, para no cargar de mas.
const MAX_CYCLE = 5;

/** Imagenes apiladas que se funden de a una. Con `run` en false vuelve a la primera. */
function CyclingImages({
  images,
  run,
  cycle = true,
  sizes,
  alt = "",
  priority = false,
}: {
  images: string[];
  run: boolean;
  cycle?: boolean;
  sizes: string;
  alt?: string;
  priority?: boolean;
}) {
  // Sin `cycle` (mobile) solo se carga y muestra la portada.
  const list = images.slice(0, cycle ? MAX_CYCLE : 1);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!run || list.length < 2) {
      setCurrent(0);
      return;
    }
    const id = window.setInterval(() => setCurrent((value) => (value + 1) % list.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [run, list.length]);

  return (
    <>
      {list.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          fill
          sizes={sizes}
          priority={priority && i === 0}
          className={`object-cover transition-opacity duration-700 ease-out ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </>
  );
}

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
              <div className="relative mb-2 aspect-[4/5] w-full overflow-hidden bg-surface [@media(hover:hover)_and_(pointer:fine)]:hidden">
                <CyclingImages images={project.images} run={false} cycle={false} sizes="100vw" alt={project.name} />
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
            className={`relative -ml-[210px] -mt-[158px] aspect-[4/3] w-[420px] overflow-hidden bg-surface transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              active === null ? "scale-90 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            {projects.map((project, index) => (
              <div
                key={project.slug}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  index === active ? "opacity-100" : "opacity-0"
                }`}
              >
                <CyclingImages images={project.images} run={index === active} sizes="420px" />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
