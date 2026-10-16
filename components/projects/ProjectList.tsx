"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "../ui/Reveal";
import { coverTransition } from "@/lib/transitions";

export type ProjectRow = {
  slug: string;
  name: string;
  excerpt: string;
  cover: string;
  /** Portada primero, luego el resto de la galeria. */
  images: string[];
  /** Que muestra la portada; sin el, se usa el nombre. */
  coverAlt?: string;
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
    if (!run || list.length < 2) return;
    const id = window.setInterval(() => setCurrent((value) => (value + 1) % list.length), CYCLE_MS);
    // Al dejar de rotar vuelve a la portada.
    return () => {
      window.clearInterval(id);
      setCurrent(0);
    };
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
 * La vista previa persigue al puntero con un resorte (mismos parametros que
 * tenia con framer-motion). Integra en cada cuadro solo mientras se mueve y se
 * detiene al llegar, asi no queda un loop corriendo.
 */
function usePointerSpring(ref: React.RefObject<HTMLDivElement | null>) {
  const state = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, frame: 0, last: 0, placed: false });

  useEffect(() => {
    const s = state.current;
    return () => cancelAnimationFrame(s.frame);
  }, []);

  return (x: number, y: number) => {
    const s = state.current;
    s.tx = x;
    s.ty = y;
    // La primera vez aparece donde esta el puntero, sin viajar desde la esquina.
    if (!s.placed) {
      Object.assign(s, { x, y, placed: true });
    }
    if (s.frame) return;
    s.last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      const ax = (SPRING.stiffness * (s.tx - s.x) - SPRING.damping * s.vx) / SPRING.mass;
      const ay = (SPRING.stiffness * (s.ty - s.y) - SPRING.damping * s.vy) / SPRING.mass;
      s.vx += ax * dt;
      s.vy += ay * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (ref.current) ref.current.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
      const settled = Math.abs(s.tx - s.x) < 0.3 && Math.abs(s.ty - s.y) < 0.3 && Math.abs(s.vx) + Math.abs(s.vy) < 0.3;
      s.frame = settled ? 0 : requestAnimationFrame(step);
    };
    s.frame = requestAnimationFrame(step);
  };
}

/**
 * Lista de proyectos en filas grandes de texto. Con mouse, la portada del
 * proyecto aparece flotando junto al cursor y las demas filas se apagan; en
 * pantallas tactiles cada fila muestra su propia imagen.
 */
export function ProjectList({ lang, projects }: { lang: string; projects: ProjectRow[] }) {
  const [active, setActive] = useState<number | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const follow = usePointerSpring(preview);

  return (
    <div
      className="relative"
      onPointerMove={(event) => {
        if (event.pointerType === "mouse") follow(event.clientX, event.clientY);
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
              // Solo con teclado: el click tambien enfoca el link, y apagar la
              // vista previa ahi le sacaria el nombre a la portada que tiene
              // que viajar hasta la ficha.
              onFocus={(event) => {
                if (event.currentTarget.matches(":focus-visible")) setActive(null);
              }}
              className="grid grid-cols-1 gap-3 py-6 transition-opacity duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange md:grid-cols-12 md:items-baseline md:gap-8 md:py-7"
            >
              <div
                style={coverTransition(project.slug)}
                className="relative mb-2 aspect-[4/5] w-full overflow-hidden bg-surface [@media(hover:hover)_and_(pointer:fine)]:hidden"
              >
                <CyclingImages images={project.images} run={false} cycle={false} sizes="100vw" alt={project.coverAlt ?? project.name} />
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
          visible, asi el cambio entre filas es un fundido y no un salto. Con
          movimiento reducido no se muestra (motion-reduce). */}
      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-30 hidden will-change-transform motion-reduce:!hidden [@media(hover:hover)_and_(pointer:fine)]:block"
      >
        <div
          className={`relative -ml-[210px] -mt-[158px] aspect-[4/3] w-[420px] overflow-hidden bg-surface transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            active === null ? "scale-90 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          {projects.map((project, index) => (
            <div
              key={project.slug}
              // Solo la vista previa activa lleva el nombre: al hacer click,
              // esa imagen es la que viaja hasta el hero de la ficha.
              style={coverTransition(project.slug, index === active)}
              className={`absolute inset-0 transition-opacity duration-300 ${
                index === active ? "opacity-100" : "opacity-0"
              }`}
            >
              <CyclingImages images={project.images} run={index === active} sizes="420px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
