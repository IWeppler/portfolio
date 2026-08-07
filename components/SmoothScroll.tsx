"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Réplica exacta de la configuración de Lenis 1.3.17 usada por
 * https://jorge-template.framer.website/ (leída de `window.lenis.options`
 * en la página original, no inferida).
 *
 * Notas sobre por qué cada valor es el que es:
 * - Sin `duration` ni `easing`: la página corre en modo lerp puro. Esas dos
 *   opciones solo afectarían a llamadas `scrollTo()` programáticas.
 * - `autoToggle: true`: en reposo el scroll es nativo y solo se activa el
 *   smooth al detectar wheel. Es lo que le da la sensación característica.
 * - `syncTouch: false`: en touch no interviene, deja el momentum del sistema.
 *   `syncTouchLerp` y `touchInertiaExponent` quedan inertes, pero se declaran
 *   para que coincidan con el original si alguna vez se activa `syncTouch`.
 * - `autoRaf: true`: Lenis maneja su propio requestAnimationFrame.
 * - No hay Lenis Snap: el original reserva `window.lenisSnap` pero nunca lo
 *   instancia (queda `undefined`), y no carga `lenis-snap.mjs`.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,

      smoothWheel: true,
      wheelMultiplier: 1,

      syncTouch: false,
      syncTouchLerp: 0.075,
      touchMultiplier: 1,
      touchInertiaExponent: 1.7,

      orientation: "vertical",
      gestureOrientation: "vertical",
      infinite: false,
      overscroll: true,
      autoResize: true,
      autoRaf: true,
      anchors: true,
      autoToggle: true,
      allowNestedScroll: true,
      naiveDimensions: false,
      stopInertiaOnNavigate: false,
    });

    return () => lenis.destroy();
  }, []);

  return null;
}
