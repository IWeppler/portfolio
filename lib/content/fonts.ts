// Fuentes que sabe dibujar el render. Cada kit de marca elige cuales usa.
// Viven en /assets/fonts/content, en ttf y sin kerning: las genera
// scripts/content-fonts.mjs (ahi esta el por que).
// space: ancho del espacio en em, medido en el render (para separar palabras
// cuando una linea tiene resaltados, ver render.tsx).

export const FONTS = {
  geist: {
    family: "Geist",
    space: 0.27,
    files: {
      300: "geist-300.ttf",
      400: "geist-400.ttf",
      500: "geist-500.ttf",
      600: "geist-600.ttf",
    },
  },
  "geist-mono": {
    family: "Geist Mono",
    space: 0.6,
    files: { 400: "geist-mono-400.ttf", 500: "geist-mono-500.ttf" },
  },
  "inter-tight": {
    family: "Inter Tight",
    space: 0.21,
    files: { 400: "inter-tight-400.ttf", 500: "inter-tight-500.ttf", 600: "inter-tight-600.ttf" },
  },
  "bebas-neue": {
    family: "Bebas Neue",
    space: 0.16,
    files: { 400: "bebas-neue-400.ttf" },
  },
} as const satisfies Record<string, { family: string; space: number; files: Partial<Record<FontWeight, string>> }>;

export type FontWeight = 300 | 400 | 500 | 600;
export type FontKey = keyof typeof FONTS;

export const FONT_KEYS = Object.keys(FONTS) as [FontKey, ...FontKey[]];

export function fontWeights(key: FontKey) {
  return Object.keys(FONTS[key].files).map(Number) as FontWeight[];
}

/** El peso pedido si existe; si no, el mas cercano que tenga la fuente. */
export function closestWeight(key: FontKey, weight: number): FontWeight {
  const weights = fontWeights(key);
  return weights.reduce((best, candidate) =>
    Math.abs(candidate - weight) < Math.abs(best - weight) ? candidate : best,
  );
}
