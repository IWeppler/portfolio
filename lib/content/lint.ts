import { POST_FORMATS, type PostFormat } from "./formats";
import { resolveText } from "./layers";
import type { BrandKit } from "./kits";
import type { Content, Designs, Layer, Slide } from "./schema";

// Revisa un diseño contra las reglas del kit. No bloquea el guardado: devuelve
// avisos que Claude recibe al guardar (y corrige) y que el panel muestra.

export type LintIssue = {
  format: PostFormat;
  slide: number;
  layer?: number;
  message: string;
};

// Ancho medio de un caracter en em, para estimar cuantas lineas ocupa un texto.
const CHAR_WIDTH: Record<string, number> = { "bebas-neue": 0.4, "geist-mono": 0.6 };

function estimateHeight(text: string, size: number, lineHeight: number, width: number, font: string) {
  const charWidth = (CHAR_WIDTH[font] ?? 0.52) * size;
  const lines = text
    .replace(/\[\[|\]\]/g, "")
    .split("\n")
    .reduce((total, line) => total + Math.max(1, Math.ceil((line.length * charWidth) / width)), 0);
  return lines * size * lineHeight;
}

function colorIssue(kit: BrandKit, color: string | undefined) {
  if (!color) return null;
  if (color.startsWith("$")) {
    return kit.colors[color.slice(1)] ? null : `color ${color} no existe en el kit (${Object.keys(kit.colors).map((name) => `$${name}`).join(", ")})`;
  }
  const palette = Object.values(kit.colors).map((token) => token.value.toLowerCase());
  return palette.includes(color.toLowerCase()) ? null : `color ${color} esta fuera de la paleta; usar un token del kit`;
}

function lintSlide(kit: BrandKit, format: PostFormat, slide: Slide, index: number, content: Content) {
  const issues: LintIssue[] = [];
  const { width, height } = POST_FORMATS[format];
  const margin = kit.layout.safeMargin;
  const logoSources = new Set(kit.logos.map((logo) => logo.src));
  const kitFonts = new Set(Object.values(kit.type).map((role) => role.font));
  let imageArea = 0;

  const add = (message: string, layer?: number) => issues.push({ format, slide: index, layer, message });

  const bgIssue = colorIssue(kit, slide.background);
  if (bgIssue) add(`fondo: ${bgIssue}`);

  slide.layers.forEach((layer: Layer, layerIndex) => {
    const outside = (x: number, y: number, w: number, h: number) =>
      x < margin || y < margin || x + w > width - margin || y + h > height - margin;

    if (layer.type === "text") {
      const resolved = resolveText(layer, kit, content);

      if (!layer.role) add(`texto sin rol; usar uno de: ${Object.keys(kit.type).join(", ")}`, layerIndex);
      else if (!resolved.role) add(`rol "${layer.role}" no existe en el kit (${Object.keys(kit.type).join(", ")})`, layerIndex);

      if (!resolved.text.trim()) add(layer.field ? `el campo ${layer.field} esta vacio en content` : "texto vacio", layerIndex);
      if (!kitFonts.has(resolved.font)) add(`la fuente ${resolved.font} no es de este kit`, layerIndex);
      if (resolved.role && (resolved.size < resolved.role.min || resolved.size > resolved.role.max)) {
        add(`tamaño ${resolved.size}px fuera del rango de ${layer.role} (${resolved.role.min}-${resolved.role.max})`, layerIndex);
      }

      const colorProblem = colorIssue(kit, layer.color);
      if (colorProblem) add(colorProblem, layerIndex);

      const textHeight = estimateHeight(resolved.text, resolved.size, resolved.lineHeight, layer.w, resolved.font);
      if (outside(layer.x, layer.y, layer.w, textHeight)) {
        add(`el texto pisa el margen de seguridad de ${margin}px (o se estima que se pasa por abajo, ~${Math.round(textHeight)}px de alto)`, layerIndex);
      }
      return;
    }

    if (layer.type === "image") {
      const isLogo = logoSources.has(layer.src);
      if (!layer.bleed && outside(layer.x, layer.y, layer.w, layer.h)) {
        add(`${isLogo ? "el logo" : "la imagen"} pisa el margen de ${margin}px; moverla o marcarla bleed si sangra a proposito`, layerIndex);
      }
      if (layer.radius && !kit.layout.radii.includes(layer.radius)) {
        add(`radio ${layer.radius} fuera de los del kit (${kit.layout.radii.join(", ")})`, layerIndex);
      }
      if (!isLogo) {
        // Area visible dentro del lienzo.
        const visibleW = Math.max(0, Math.min(width, layer.x + layer.w) - Math.max(0, layer.x));
        const visibleH = Math.max(0, Math.min(height, layer.y + layer.h) - Math.max(0, layer.y));
        imageArea += visibleW * visibleH;
      }
      return;
    }

    const colorProblem = colorIssue(kit, layer.color) ?? colorIssue(kit, layer.stroke);
    if (colorProblem) add(colorProblem, layerIndex);
    if (layer.radius && !kit.layout.radii.includes(layer.radius)) {
      add(`radio ${layer.radius} fuera de los del kit (${kit.layout.radii.join(", ")})`, layerIndex);
    }
  });

  const share = Math.min(1, imageArea / (width * height));
  const { min, max } = kit.layout.imageShare;
  if (share < min || share > max) {
    add(`las imagenes ocupan ${Math.round(share * 100)}% del slide; el kit pide entre ${Math.round(min * 100)}% y ${Math.round(max * 100)}%`);
  }

  return issues;
}

export function lintDesigns(kit: BrandKit, designs: Designs, content: Content) {
  return (Object.entries(designs) as [PostFormat, Designs[PostFormat]][]).flatMap(([format, design]) =>
    (design?.slides ?? []).flatMap((slide, index) => lintSlide(kit, format, slide, index, content)),
  );
}
