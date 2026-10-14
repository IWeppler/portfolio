"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

/**
 * Adaptacion de TextPressure (React Bits, basado en el CodePen de Juan
 * Fuentes: https://codepen.io/JuanFuentes/full/rgXKGQ). Cada letra mide su
 * distancia al cursor y esa distancia mueve los ejes de la fuente variable:
 * cerca del cursor la letra se ensancha, engorda y se inclina; lejos se
 * afina. Usa Roboto Flex, que tiene eje de ancho (wdth), cosa que Geist no.
 *
 * Diferencias con el original: admite varias lineas (cada una ocupa su caja
 * y reparte las letras de punta a punta), en pantallas tactiles el "cursor"
 * recorre el nombre solo, y con movimiento reducido queda quieto.
 */

type Line = { text: string; align?: "start" | "end" };

// Rangos de los ejes de Roboto Flex que usa el efecto.
const WDTH: [number, number] = [25, 151];
const WGHT: [number, number] = [100, 900];
const SLNT: [number, number] = [0, 10];
// Cuanto ocupa una letra (en em) en promedio; define el tamano. Deja margen
// para que las letras cercanas al cursor se ensanchen sin salirse.
const EM_PER_CHAR = 0.78;
// Suavizado del seguimiento: mas alto, mas lento llega al cursor.
const EASE = 15;

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(b.x - a.x, b.y - a.y);

// Igual que el original: lineal con la distancia, con piso en `min`.
const axis = (d: number, maxDist: number, [min, max]: [number, number]) =>
  Math.min(max, Math.max(min, max - Math.abs((max * d) / maxDist) + min));

export function TextPressure({
  lines,
  label,
  as: Tag = "h1",
  entrance = true,
  className = "",
  lineClassName = "",
}: {
  lines: Line[];
  /**
   * Texto accesible (las letras sueltas son solo visuales). Sin `label`, el
   * nombre accesible lo pone quien lo contiene, por ejemplo un link.
   */
  label?: string;
  /** Etiqueta del contenedor: `h1` en el hero, `div` dentro de un link. */
  as?: ElementType;
  /** Si las lineas suben al cargar (solo tiene sentido arriba de todo). */
  entrance?: boolean;
  className?: string;
  /** Ancho de cada linea; las letras se reparten dentro. */
  lineClassName?: string;
}) {
  const root = useRef<HTMLElement>(null);
  const firstLine = useRef<HTMLDivElement>(null);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  const [fontSize, setFontSize] = useState<number | null>(null);

  const longest = Math.max(...lines.map((line) => line.text.length));

  // Tamano de fuente: que la linea mas larga llene su caja con los ejes en
  // reposo. Se recalcula al cambiar el ancho.
  useEffect(() => {
    const line = firstLine.current;
    if (!line) return;
    const measure = () => setFontSize(line.clientWidth / (longest * EM_PER_CHAR));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(line);
    return () => observer.disconnect();
  }, [longest]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reduceMotion.matches) return;

    const rect = element.getBoundingClientRect();
    const cursor = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const mouse = { ...cursor };

    const onMove = (event: MouseEvent) => {
      cursor.x = event.clientX;
      cursor.y = event.clientY;
    };
    const onTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      cursor.x = touch.clientX;
      cursor.y = touch.clientY;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });

    // El loop solo corre mientras el titulo esta en pantalla.
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) frame = requestAnimationFrame(tick);
    });
    observer.observe(element);

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (!visible) return;
      const box = element.getBoundingClientRect();

      // Sin mouse, un cursor invisible recorre el nombre de lado a lado.
      if (!canHover.matches) {
        const t = (now - start) / 1000;
        cursor.x = box.left + box.width * (0.5 + 0.45 * Math.sin(t * 0.9));
        cursor.y = box.top + box.height * (0.5 + 0.35 * Math.sin(t * 0.6));
      }

      mouse.x += (cursor.x - mouse.x) / EASE;
      mouse.y += (cursor.y - mouse.y) / EASE;

      const maxDist = box.width / 2;
      for (const span of spans.current) {
        if (!span) continue;
        const r = span.getBoundingClientRect();
        const d = distance(mouse, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        const wdth = Math.floor(axis(d, maxDist, WDTH));
        const wght = Math.floor(axis(d, maxDist, WGHT));
        const slnt = -axis(d, maxDist, SLNT);
        span.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'slnt' ${slnt.toFixed(1)}`;
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  let index = 0;

  return (
    <Tag
      ref={root}
      aria-label={label}
      className={`font-pressure uppercase ${className}`}
      style={{ fontSize: fontSize ?? undefined, visibility: fontSize ? undefined : "hidden" }}
    >
      {lines.map((line, lineIndex) => (
        <div
          key={line.text}
          aria-hidden="true"
          className={`overflow-hidden ${lineClassName} ${line.align === "end" ? "ml-auto" : ""}`}
        >
          <div
            ref={lineIndex === 0 ? firstLine : undefined}
            className={`flex justify-between ${entrance ? "hero-name" : ""}`}
            style={entrance ? { animationDelay: `${lineIndex * 90}ms` } : undefined}
          >
            {line.text.split("").map((char) => {
              const i = index++;
              // Un espacio es una caja vacia con ancho propio: si no, las
              // palabras quedarian tan separadas como las letras.
              if (char === " ") return <span key={i} className="inline-block w-[0.35em]" />;
              return (
                <span
                  key={i}
                  ref={(node) => {
                    spans.current[i] = node;
                  }}
                  className="inline-block"
                  style={{ fontVariationSettings: "'wght' 700, 'wdth' 100, 'slnt' 0" }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </Tag>
  );
}
