"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Entrada al hacer scroll: el bloque sube unos pixeles y aparece una sola vez
 * cuando entra en pantalla. El estado oculto solo aplica con `html.js` (lo pone
 * un script inline en el layout), asi que sin JavaScript el contenido se ve
 * igual. Los estilos viven en globals.css (`[data-reveal]`).
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  /** Escalonado en ms respecto de los hermanos de la misma seccion. */
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.dataset.shown = "";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
