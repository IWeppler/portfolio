"use client";

import { useEffect, useRef, type ReactNode } from "react";

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
 *
 * Sin framer-motion: un listener de scroll y un cuadro por cambio alcanzan, y
 * el home se ahorra ~110 KB de JS que en celular frenaban la carga.
 */
export function ParallaxHero({ children }: { children: ReactNode }) {
  const hero = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = hero.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // El recorrido del efecto es el alto del hero: cuando la siguiente seccion
    // lo tapo del todo, ya termino. `offsetHeight` ignora el transform, asi que
    // no se realimenta con la animacion.
    let range = element.offsetHeight || 1;
    const resize = new ResizeObserver(() => {
      range = element.offsetHeight || 1;
    });
    resize.observe(element);

    let frame = 0;
    const apply = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / range));
      element.style.transform = `translate3d(0, ${(p * range * 0.18).toFixed(1)}px, 0) scale(${(1 - p * 0.06).toFixed(4)})`;
      element.style.opacity = String(Math.max(0, 1 - p / 0.75));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={hero} className="sticky top-0 w-full will-change-transform">
      {children}
    </div>
  );
}
