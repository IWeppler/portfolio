"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// Opacidad de una palabra todavia no leida: se ve, pero apagada.
const DIM = 0.16;
// El recorrido va de cuando el bloque asoma (su borde de arriba al 85% del alto
// de la pantalla) a cuando su borde de abajo llega al 45%.
const START = 0.85;
const END = 0.45;

/**
 * Frase que se "lee" sola al scrollear: las palabras arrancan apagadas y se
 * encienden de a una mientras el bloque cruza la pantalla. La ultima parte
 * (`accent`) va en el color de acento. Con movimiento reducido, se ve entera.
 *
 * El progreso es una sola variable CSS (`--p`) en el parrafo; cada palabra
 * calcula su opacidad en CSS segun su posicion. Sin framer-motion ni un
 * componente animado por palabra.
 */
export function ScrollRevealText({
  text,
  accent,
  className,
}: {
  text: string;
  accent?: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.style.setProperty("--p", "1");
      return;
    }

    let frame = 0;
    const apply = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (START * vh - rect.top) / (rect.height + (START - END) * vh);
      element.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const words = text.split(" ").map((word) => ({ word, accent: false }));
  if (accent) words.push(...accent.split(" ").map((word) => ({ word, accent: true })));
  const n = words.length;

  // Las palabras van separadas por espacios reales, asi que el texto se lee
  // igual de corrido (lectores de pantalla y buscadores) sin una copia aparte.
  return (
    <p ref={ref} className={className}>
      {words.map(({ word, accent: isAccent }, i) => (
        <span key={i}>
          <span
            className={isAccent ? "text-orange" : undefined}
            // Tramo i de n: de apagada a encendida mientras --p pasa de i/n a (i+1)/n.
            style={{ opacity: `calc(${DIM} + ${1 - DIM} * clamp(0, var(--p, 0) * ${n} - ${i}, 1))` } as CSSProperties}
          >
            {word}
          </span>{" "}
        </span>
      ))}
    </p>
  );
}
