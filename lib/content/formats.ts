// Formatos de Instagram. Todo se diseña en un lienzo de 1080 de ancho y se
// exporta al doble (2160 de ancho, "2K").
export const POST_FORMATS = {
  square: { label: "Cuadrado 1:1", width: 1080, height: 1080 },
  portrait: { label: "Vertical 4:5", width: 1080, height: 1350 },
  grid: { label: "Grilla 3:4", width: 1080, height: 1440 },
  story: { label: "Historia / Reel 9:16", width: 1080, height: 1920 },
  landscape: { label: "Horizontal 1.91:1", width: 1080, height: 566 },
} as const;

export type PostFormat = keyof typeof POST_FORMATS;

export const POST_FORMAT_NAMES = Object.keys(POST_FORMATS) as [PostFormat, ...PostFormat[]];

export const EXPORT_SCALE = 2;
