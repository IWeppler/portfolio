"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Deja el hero pegado arriba mientras la seccion siguiente sube y lo tapa. El
 * hero ademas se desplaza hacia abajo y se desvanece, asi que se lee como
 * parallax en vez de como un scroll comun.
 *
 * El hero es el elemento `sticky`: envolverlo en un contenedor de su misma
 * altura no funciona, porque `sticky` solo se despega si el contenedor es mas
 * alto que el. Aca el contenedor es el flex de la pagina entera.
 *
 * La seccion que viene despues tiene que ser opaca y quedar por encima
 * (`relative z-10` + fondo), si no el hero se ve a traves.
 */
export function ParallaxHero({ children }: { children: ReactNode }) {
  const hero = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [height, setHeight] = useState(0);

  // El recorrido del efecto es el alto del hero: cuando la siguiente seccion
  // lo tapo del todo, ya termino. `offsetHeight` ignora el transform, asi que
  // no se realimenta con la animacion.
  useLayoutEffect(() => {
    const element = hero.current;

    if (!element) return;

    const measure = () => setHeight(element.offsetHeight);

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const range = height || 1;
  const y = useTransform(scrollY, [0, range], [0, range * 0.18]);
  const scale = useTransform(scrollY, [0, range], [1, 0.94]);
  const opacity = useTransform(scrollY, [0, range * 0.75], [1, 0]);

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      ref={hero}
      style={{ y, scale, opacity }}
      className="sticky top-0 w-full"
    >
      {children}
    </motion.div>
  );
}
