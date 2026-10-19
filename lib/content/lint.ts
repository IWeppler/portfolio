import { POST_FORMATS, type PostFormat } from "./formats";
import { resolveText } from "./layers";
import { parseToken, type BrandKit } from "./kits";
import { wrapText } from "./metrics";
import type { Content, Designs, Gradient, Layer, Slide } from "./schema";

// Revisa un diseño contra las reglas del kit. No bloquea el guardado: devuelve
// avisos que Claude recibe al guardar (y corrige) y que el panel muestra.

export type LintIssue = {
  format: PostFormat;
  slide: number;
  layer?: number;
  message: string;
};

/** El texto como se lee: sin los corchetes ni el nombre de las marcas. */
const plainText = (text: string) => text.replace(/\[\[([^\]|]*)(?:\|[a-z]+)?\]\]/g, "$1");

function colorIssue(kit: BrandKit, color: string | undefined) {
  if (!color) return null;
  if (color.startsWith("$")) {
    const token = parseToken(color);
    return token && kit.colors[token.name]
      ? null
      : `color ${color} no existe en el kit (${Object.keys(kit.colors).map((name) => `$${name}`).join(", ")}; con alfa: $token/20)`;
  }
  const palette = Object.values(kit.colors).map((token) => token.value.toLowerCase());
  return palette.includes(color.toLowerCase()) ? null : `color ${color} esta fuera de la paleta; usar un token del kit`;
}

const gradientColors = (gradient: Gradient | undefined) => gradient?.stops.map((stop) => stop.color) ?? [];

function lintSlide(kit: BrandKit, format: PostFormat, slide: Slide, index: number, content: Content) {
  const issues: LintIssue[] = [];
  const { width, height } = POST_FORMATS[format];
  const margin = kit.layout.safeMargin;
  const logoSources = new Set(kit.logos.map((logo) => logo.src));
  const kitFonts = new Set(Object.values(kit.type).map((role) => role.font));
  let imageArea = 0;

  const add = (message: string, layer?: number) => issues.push({ format, slide: index, layer, message });
  const checkColors = (colors: (string | undefined)[], layer?: number, where = "") => {
    for (const color of colors) {
      const problem = colorIssue(kit, color);
      if (problem) add(`${where}${problem}`, layer);
    }
  };

  checkColors([slide.background], undefined, "fondo: ");
  if (slide.backdrop) {
    checkColors([...gradientColors(slide.backdrop.gradient), ...(slide.backdrop.glows ?? []).map((glow) => glow.color)], undefined, "fondo: ");
  }

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
      checkColors([layer.color, layer.highlight], layerIndex);

      const shown = plainText(resolved.uppercase ? resolved.text.toUpperCase() : resolved.text);
      const wrapped = wrapText(shown, layer.w, resolved);
      const textHeight = wrapped.lines.length * resolved.size * resolved.lineHeight;
      if (wrapped.overflow > 0) {
        add(`una palabra no entra en el ancho de ${layer.w}px (sobran ${Math.ceil(wrapped.overflow)}px)`, layerIndex);
      }
      if (outside(layer.x, layer.y, Math.min(layer.w, wrapped.width), textHeight)) {
        add(
          `el texto pisa el margen de seguridad de ${margin}px (ocupa ${wrapped.lines.length} linea${wrapped.lines.length > 1 ? "s" : ""}, ${Math.round(textHeight)}px de alto)`,
          layerIndex,
        );
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

    if (layer.type === "graphic") {
      // Los graficos son textura, luz o metafora: pueden sangrar sin aviso.
      checkColors([layer.color, layer.accent, layer.muted], layerIndex);
      return;
    }

    checkColors([layer.color, layer.stroke, ...gradientColors(layer.gradient)], layerIndex);
    if (layer.glass && layer.rotate) add("el vidrio no admite giro: lo de atras se toma derecho", layerIndex);
    if (layer.radius && !kit.layout.radii.includes(layer.radius)) {
      add(`radio ${layer.radius} fuera de los del kit (${kit.layout.radii.join(", ")})`, layerIndex);
    }
  });

  const share = Math.min(1, imageArea / (width * height));
  const { max } = kit.layout.imageShare;
  if (share > max) {
    add(`las imagenes ocupan ${Math.round(share * 100)}% del slide; el kit pide como mucho ${Math.round(max * 100)}% (un fondo con backdrop no cuenta)`);
  }

  return { issues, share };
}

export function lintDesigns(kit: BrandKit, designs: Designs, content: Content) {
  return (Object.entries(designs) as [PostFormat, Designs[PostFormat]][]).flatMap(([format, design]) => {
    const slides = (design?.slides ?? []).map((slide, index) => lintSlide(kit, format, slide, index, content));
    // El minimo de imagen es de la pieza: un carrusel puede tener slides solo tipograficos.
    const { min } = kit.layout.imageShare;
    const best = Math.max(0, ...slides.map((slide) => slide.share));
    const missing: LintIssue[] =
      slides.length > 0 && best < min
        ? [{ format, slide: 0, message: `ningun slide llega al ${Math.round(min * 100)}% de imagen que pide el kit; sumar una captura o, si la idea es solo tipografica, ignorar este aviso` }]
        : [];
    return [...slides.flatMap((slide) => slide.issues), ...missing];
  });
}
