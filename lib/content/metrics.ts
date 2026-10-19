import { closestWeight, type FontKey } from "./fonts";
import FONT_METRICS from "./font-metrics.json";

// Medidas reales de texto con los anchos de cada caracter de los ttf (los
// genera scripts/content-font-metrics.mjs). Las fuentes no tienen kerning, asi
// que sumar anchos da lo mismo que dibuja el render. Lo usan el lint (cuantas
// lineas ocupa un texto) y el render (la medida de una marca box).

type FontMetrics = { fallback: number; widths: Record<string, number> };

const metricsFor = (font: FontKey, weight: number) =>
  (FONT_METRICS as Record<string, FontMetrics>)[`${font}-${closestWeight(font, weight)}`];

export type TextStyle = { font: FontKey; weight: number; size: number; tracking: number };

/** Ancho en px de un texto en una linea. tracking en em, como en las capas. */
export function measureText(text: string, { font, weight, size, tracking }: TextStyle) {
  const { widths, fallback } = metricsFor(font, weight);
  let em = 0;
  for (const char of text) em += (widths[char] ?? fallback) + tracking;
  return em * size;
}

/**
 * Corta un texto en lineas como el render: respeta los \n y parte por
 * palabras al llegar al ancho. Una palabra mas larga que el ancho queda sola
 * y se informa en overflow.
 */
export function wrapText(text: string, width: number, style: TextStyle) {
  const lines: string[] = [];
  let overflow = 0;

  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ").filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || measureText(candidate, style) <= width) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
      overflow = Math.max(overflow, measureText(word, style) - width);
    }
    lines.push(line);
  }

  return { lines, overflow: Math.max(0, overflow), width: Math.max(0, ...lines.map((line) => measureText(line, style))) };
}
