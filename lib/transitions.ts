import type { CSSProperties } from "react";

/**
 * Estilo para la portada de un proyecto como elemento compartido de la View
 * Transition: el mismo nombre en la lista y en la ficha hace que la imagen
 * viaje de un lugar al otro al navegar (ida, vuelta y entre proyectos).
 *
 * El nombre tiene que ser unico entre los elementos visibles de la pagina:
 * donde una portada se repite (la vista previa flotante del home), pasar
 * `active` solo a la que se ve.
 */
export function coverTransition(slug: string, active = true): CSSProperties | undefined {
  if (!active) return undefined;
  return {
    viewTransitionName: `project-cover-${slug}`,
    viewTransitionClass: "project-cover",
  } as CSSProperties;
}
