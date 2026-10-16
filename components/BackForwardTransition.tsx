"use client";

import { useEffect } from "react";

const REPLAY = "__vtReplay";

/**
 * View Transition tambien para atras/adelante del navegador.
 *
 * Next anima los clicks en links (experimental.viewTransition), pero React
 * renderiza los popstate de forma sincronica y sin View Transition. Aca se
 * escucha el popstate en captura (antes que el router de Next), se frena, y se
 * vuelve a disparar el mismo evento dentro de document.startViewTransition:
 * Next hace su render de siempre, pero dentro de la transicion.
 *
 * No corre en pantallas tactiles: iOS y Android ya animan el gesto de volver y
 * se verian dos animaciones encimadas. Tampoco con movimiento reducido.
 */
export function BackForwardTransition() {
  useEffect(() => {
    if (!("startViewTransition" in document)) return;
    const coarse = window.matchMedia("(pointer: coarse)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onPopState = (event: PopStateEvent) => {
      if ((event as PopStateEvent & { [REPLAY]?: boolean })[REPLAY]) return;
      if (coarse.matches || reduce.matches) return;

      event.stopImmediatePropagation();
      const replay = new PopStateEvent("popstate", { state: event.state });
      Object.defineProperty(replay, REPLAY, { value: true });

      document.startViewTransition(async () => {
        window.dispatchEvent(replay);
        // React termina el render del popstate en microtareas: esperar a que
        // el DOM nuevo este listo antes de que se capture el estado final.
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    };

    window.addEventListener("popstate", onPopState, { capture: true });
    return () => window.removeEventListener("popstate", onPopState, { capture: true });
  }, []);

  return null;
}
