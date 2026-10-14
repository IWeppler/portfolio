"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

// Opacidad de una palabra todavia no leida: se ve, pero apagada.
const DIM = 0.16;

function Word({
  children,
  progress,
  range,
  className,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  className?: string;
}) {
  const opacity = useTransform(progress, range, [DIM, 1]);
  return (
    <motion.span style={{ opacity }} className={className}>
      {children}
    </motion.span>
  );
}

/**
 * Frase que se "lee" sola al scrollear: las palabras arrancan apagadas y se
 * encienden de a una mientras el bloque cruza la pantalla. La ultima parte
 * (`accent`) va en el color de acento. Con movimiento reducido, se ve entera.
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
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });

  const words = text.split(" ").map((word) => ({ word, accent: false }));
  if (accent) words.push(...accent.split(" ").map((word) => ({ word, accent: true })));

  if (reduceMotion) {
    return (
      <p className={className}>
        {text} {accent && <span className="text-orange">{accent}</span>}
      </p>
    );
  }

  return (
    <p ref={ref} className={className}>
      {/* El texto completo para lectores de pantalla; las palabras sueltas son
          solo visuales. */}
      <span className="sr-only">
        {text} {accent}
      </span>
      <span aria-hidden="true">
        {words.map(({ word, accent: isAccent }, i) => (
          <span key={i}>
            <Word
              progress={scrollYProgress}
              range={[i / words.length, (i + 1) / words.length]}
              className={isAccent ? "text-orange" : undefined}
            >
              {word}
            </Word>{" "}
          </span>
        ))}
      </span>
    </p>
  );
}
