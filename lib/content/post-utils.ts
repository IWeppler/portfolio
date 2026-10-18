import type { PostFormat } from "./formats";
import type { Content, Designs } from "./schema";

// Helpers sin dependencias de servidor: los usan el panel y el MCP.

/** Nombre para listas: el titulo si ya hay, si no el comienzo de la idea. */
export function postLabel(post: { content: Content; idea: string }) {
  return post.content.title.trim() || post.idea.split("\n")[0].slice(0, 80) || "Sin titulo";
}

/** Formatos con al menos un slide, el principal primero. */
export function designedFormats(post: { designs: Designs; format: PostFormat }) {
  const formats = (Object.keys(post.designs) as PostFormat[]).filter(
    (format) => (post.designs[format]?.slides.length ?? 0) > 0,
  );
  return formats.sort((a, b) => Number(b === post.format) - Number(a === post.format));
}

/**
 * Formatos pedidos que todavia no tienen slides: el principal y cualquiera
 * que el panel haya agregado vacio. Son los pendientes para Claude.
 */
export function missingFormats(post: { designs: Designs; format: PostFormat }) {
  const requested = new Set<PostFormat>([post.format, ...(Object.keys(post.designs) as PostFormat[])]);
  return [...requested].filter((format) => (post.designs[format]?.slides.length ?? 0) === 0);
}
