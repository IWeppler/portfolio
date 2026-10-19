import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { FONTS, type FontKey } from "./fonts";
import { POST_FORMATS, type PostFormat } from "./formats";
import { resolveColor, type BrandKit } from "./kits";
import { resolveText, type ResolvedText } from "./layers";
import { measureText } from "./metrics";
import {
  clipOverlay,
  deviceGeometry,
  frameDevice,
  glassBackdrop,
  prepareBackdrop,
  prepareGraphic,
  prepareImage,
  prepareRect,
  prepareShadow,
  shadowOffset,
  shapeRaster,
  transformRaster,
  type Light,
  type Overlay,
} from "./raster";
import type { Content, ImageLayer, Layer, RectLayer, Slide, TextLayer } from "./schema";

// Render de un slide a PNG. Es la unica fuente de verdad: la vista previa del
// panel, la descarga 2K y el render_preview del MCP salen de aca, asi que lo
// que se ve es exactamente lo que se baja.
//
// Es un compositor: Satori (next/og) dibuja solo lo vectorial (texto y
// rectangulos lisos) sobre transparente, y sharp apila todo en el orden de
// las capas. Una imagen grande le cuesta a Satori mas de un segundo y a sharp
// milisegundos; asi un slide con fondo, fotos y sombras entra en la ruta 2K.

const read = (...segments: string[]) => readFile(path.join(process.cwd(), ...segments));

type SatoriFont = { name: string; data: Buffer; weight: 300 | 400 | 500 | 600; style: "normal" };

const fontCache = new Map<FontKey, Promise<SatoriFont[]>>();

function loadFont(key: FontKey) {
  let cached = fontCache.get(key);
  if (!cached) {
    const { family, files } = FONTS[key];
    cached = Promise.all(
      Object.entries(files).map(async ([weight, file]) => ({
        name: family,
        data: await read("assets", "fonts", "content", file),
        weight: Number(weight) as SatoriFont["weight"],
        style: "normal" as const,
      })),
    );
    cached.catch(() => fontCache.delete(key));
    fontCache.set(key, cached);
  }
  return cached;
}

// Solo las fuentes del kit (mas las que pida alguna capa): Satori parsea
// todas las que recibe en cada render.
async function fontsFor(kit: BrandKit, slide: Slide | undefined) {
  const keys = new Set<FontKey>(Object.values(kit.type).map((role) => role.font));
  for (const layer of slide?.layers ?? []) {
    if (layer.type === "text" && layer.font) keys.add(layer.font);
  }
  return (await Promise.all([...keys].map(loadFont))).flat();
}

type RenderContext = {
  kit: BrandKit;
  content: Content;
  scale: number;
  light: Light;
  /** Color del fondo del slide: el relleno del texto calado. */
  paper: string;
};

function common(layer: Layer, scale: number) {
  // Satori rechaza claves con undefined, asi que transform solo va si hay giro.
  return {
    position: "absolute" as const,
    left: layer.x * scale,
    top: layer.y * scale,
    opacity: layer.opacity ?? 1,
    ...(layer.rotate ? { transform: `rotate(${layer.rotate}deg)` } : {}),
  };
}

// --- Texto (Satori)

type Mark = "highlight" | "outline" | "box" | "blur";
type Part = { text: string; mark?: Mark };
const MARKS = new Set<string>(["outline", "box", "blur"]);

/**
 * Palabras de una linea con marcas [[...]]. Cada palabra es una lista de
 * partes, asi "comercio[[*]]" queda pegado y solo el asterisco cambia. Una
 * marca box es una sola unidad aunque tenga espacios: la caja no se parte.
 */
function markedWords(line: string): Part[][] {
  const words: Part[][] = [[]];
  for (const piece of line.split(/(\[\[[^\]]*\]\])/)) {
    const marked = piece.startsWith("[[") && piece.endsWith("]]");
    let body = marked ? piece.slice(2, -2) : piece;
    let mark: Mark | undefined = marked ? "highlight" : undefined;
    const bar = body.lastIndexOf("|");
    if (marked && bar >= 0 && MARKS.has(body.slice(bar + 1))) {
      mark = body.slice(bar + 1) as Mark;
      body = body.slice(0, bar);
    }
    const chunks = mark === "box" ? [body.replace(/ /g, " ")] : body.split(" ");
    chunks.forEach((chunk, index) => {
      if (index > 0) words.push([]);
      if (chunk) words[words.length - 1].push({ text: chunk, mark });
    });
  }
  return words.filter((word) => word.length > 0);
}

function renderPart(part: Part, key: number, text: ResolvedText, accent: string, { kit, scale, paper }: RenderContext) {
  const style = { font: text.font, weight: text.weight, size: text.size, tracking: text.tracking };
  const shown = text.uppercase ? part.text.toUpperCase() : part.text;

  switch (part.mark) {
    case "highlight":
      return (
        <span key={key} style={{ color: accent }}>
          {part.text}
        </span>
      );
    case "outline":
      // Satori no dibuja el trazo con relleno transparente: se rellena con el fondo.
      return (
        <span key={key} style={{ color: paper, WebkitTextStroke: `${Math.max(1, text.size * 0.016) * scale}px ${text.color}` }}>
          {part.text}
        </span>
      );
    case "blur": {
      const width = measureText(shown, style) * scale;
      const lens = text.size * 1.15 * scale;
      const lineHeight = text.size * text.lineHeight * scale;
      return (
        <div key={key} style={{ display: "flex", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: (width - lens) / 2,
              top: (lineHeight - lens) / 2,
              width: lens,
              height: lens,
              borderRadius: lens,
              backgroundImage: `radial-gradient(circle, ${text.color}30 0%, ${text.color}12 55%, transparent 72%)`,
            }}
          />
          <span style={{ filter: `blur(${text.size * 0.035 * scale}px)` }}>{part.text}</span>
        </div>
      );
    }
    case "box": {
      const padding = text.size * 0.1;
      const border = Math.max(1, text.size * 0.016) * scale;
      const handle = text.size * 0.11 * scale;
      // La medida que muestra la etiqueta es la real de la caja, en px del lienzo.
      const label = `${Math.round(measureText(shown, style) + padding * 2)} × ${Math.round(text.size * text.lineHeight)}`;
      const labelFont = Object.values(kit.type).find((role) => role.font === "geist-mono")?.font ?? text.font;
      const corner = (side: "left" | "right", edge: "top" | "bottom") => ({
        position: "absolute" as const,
        [side]: -handle / 2 - border / 2,
        [edge]: -handle / 2 - border / 2,
        width: handle,
        height: handle,
        background: paper,
        border: `${border}px solid ${text.color}`,
      });
      return (
        <div key={key} style={{ display: "flex", position: "relative", padding: `0 ${padding * scale}px`, border: `${border}px solid ${text.color}` }}>
          {part.text}
          <div style={corner("left", "top")} />
          <div style={corner("right", "top")} />
          <div style={corner("left", "bottom")} />
          <div style={corner("right", "bottom")} />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -text.size * 0.42 * scale,
              display: "flex",
              padding: `${2 * scale}px ${8 * scale}px`,
              borderRadius: 6 * scale,
              background: resolveColor(kit, "$assets", "#2a2b2e"),
              fontFamily: FONTS[labelFont].family,
              fontSize: Math.max(12, text.size * 0.17) * scale,
              letterSpacing: 0,
              lineHeight: 1.2,
              textTransform: "none",
              fontWeight: 400,
            }}
          >
            {label}
          </div>
        </div>
      );
    }
    default:
      return <span key={key}>{part.text}</span>;
  }
}

function renderText(layer: TextLayer, index: number, context: RenderContext) {
  const { kit, content, scale } = context;
  const text = resolveText(layer, kit, content);
  const accent = resolveColor(kit, layer.highlight, kit.highlight);
  const justify = text.align === "center" ? "center" : text.align === "right" ? "flex-end" : "flex-start";

  return (
    <div
      key={index}
      style={{
        ...common(layer, scale),
        display: "flex",
        flexDirection: "column",
        alignItems: justify,
        width: layer.w * scale,
        fontFamily: FONTS[text.font].family,
        fontSize: text.size * scale,
        fontWeight: text.weight,
        color: text.color,
        textAlign: text.align,
        lineHeight: text.lineHeight,
        letterSpacing: text.tracking * text.size * scale,
        textTransform: text.uppercase ? "uppercase" : "none",
      }}
    >
      {/* Una fila por linea (respeta los \n). */}
      {text.text.split("\n").map((line, lineIndex) => (
        <div
          key={lineIndex}
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: justify,
            alignItems: "center",
            // Con marcas las palabras van separadas: el hueco es el espacio de la fuente.
            columnGap: (FONTS[text.font].space + text.tracking) * text.size * scale,
            minHeight: text.size * scale * text.lineHeight,
          }}
        >
          {line.includes("[[")
            ? markedWords(line).map((word, wordIndex) => (
                <div key={wordIndex} style={{ display: "flex", alignItems: "center" }}>
                  {word.map((part, partIndex) => renderPart(part, partIndex, text, accent, context))}
                </div>
              ))
            : line}
        </div>
      ))}
    </div>
  );
}

/** Un rectangulo sin borde, degradado, vidrio ni sombra: lo dibuja Satori. */
const isPlainRect = (layer: RectLayer) => !layer.gradient && !(layer.stroke && layer.strokeWidth) && !layer.glass && !layer.shadow;

function renderPlainRect(layer: RectLayer, index: number, { kit, scale }: RenderContext) {
  return (
    <div
      key={index}
      style={{
        ...common(layer, scale),
        width: layer.w * scale,
        height: layer.h * scale,
        background: resolveColor(kit, layer.color, "$surface"),
        borderRadius: layer.radius * scale,
      }}
    />
  );
}

// --- Capas raster (sharp)

type Box = { x: number; y: number; w: number; h: number; opacity?: number; rotate?: number };

/** Ubica un raster con el tamaño de su caja: giro sobre el centro, opacidad, recorte al lienzo. */
async function place(buffer: Buffer, box: Box, scale: number, canvas: { width: number; height: number }, offset = { dx: 0, dy: 0, pad: 0 }) {
  const result = await transformRaster(buffer, box.opacity ?? 1, box.rotate ?? 0);
  const centerX = (box.x + offset.dx + box.w / 2) * scale;
  const centerY = (box.y + offset.dy + box.h / 2) * scale;
  return clipOverlay(result.buffer, result.width, result.height, centerX - result.width / 2, centerY - result.height / 2, canvas);
}

function imageRaster(layer: ImageLayer, scale: number) {
  return prepareImage(layer.src, Math.round(layer.w * scale), Math.round(layer.h * scale), {
    fit: layer.fit,
    position: layer.position,
    crop: layer.crop,
    blur: layer.blur && layer.blur * scale,
    motionBlur: layer.motionBlur && layer.motionBlur * scale,
    brightness: layer.brightness,
    saturation: layer.saturation,
  });
}

type Canvas = { width: number; height: number };

/**
 * Lo que aporta cada capa raster. Las que no dependen de lo de abajo se
 * preparan todas a la vez; el vidrio recibe el lienzo hasta ese punto.
 */
async function rasterLayer(layer: Exclude<Layer, TextLayer>, context: RenderContext, canvas: Canvas, below: () => Promise<Buffer>): Promise<Overlay[]> {
  const { kit, scale, light } = context;
  const width = Math.round(layer.w * scale);
  const height = Math.round(layer.h * scale);
  const overlays: (Overlay | null)[] = [];

  const shadowOf = async (radius: number, silhouette?: Buffer) => {
    if (!("shadow" in layer) || !layer.shadow) return;
    const shadow = await prepareShadow(width, height, Math.round(radius * scale), layer.shadow, silhouette);
    const { dx, dy } = shadowOffset(layer.shadow, light);
    overlays.push(
      await place(shadow.buffer, { ...layer, w: layer.w + (shadow.pad * 2) / scale, h: layer.h + (shadow.pad * 2) / scale, x: layer.x - shadow.pad / scale, y: layer.y - shadow.pad / scale }, scale, canvas, { dx, dy, pad: 0 }),
    );
  };

  if (layer.type === "graphic") {
    const graphic = await prepareGraphic(kit, layer, width, height, scale);
    overlays.push(await place(graphic.buffer, { ...layer, opacity: (layer.strength ?? 1) * (layer.opacity ?? 1) }, scale, canvas));
    return overlays.filter((overlay) => overlay !== null);
  }

  if (layer.type === "rect") {
    await shadowOf(layer.radius);
    if (layer.glass) {
      const behind = await glassBackdrop(await below(), canvas, { left: layer.x * scale, top: layer.y * scale, width, height }, 24 * scale);
      // Un tinte opaco taparia el vidrio: sin alfa propio queda al 72%.
      const fill = resolveColor(kit, layer.color, "$surface");
      const tint = await prepareRect(
        kit,
        {
          color: fill.length === 7 ? `${fill}b8` : fill,
          gradient: layer.gradient,
          stroke: layer.stroke ?? "$foreground/16",
          strokeWidth: layer.strokeWidth ?? 1,
          radius: layer.radius,
        },
        width,
        height,
        scale,
      );
      const highlight = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="${layer.radius * scale}" y="0" width="${Math.max(0, width - layer.radius * scale * 2)}" height="${scale}" fill="${resolveColor(kit, "$foreground", "#ffffff").slice(0, 7)}" fill-opacity="0.24"/></svg>`,
      );
      const glass = await sharp(behind).composite([{ input: tint.buffer }, { input: highlight }]).png().toBuffer();
      overlays.push(await place(await shapeRaster(glass, width, height, layer.radius * scale), layer, scale, canvas));
    } else {
      const rect = await prepareRect(kit, layer, width, height, scale);
      overlays.push(await place(rect.buffer, layer, scale, canvas));
    }
    return overlays.filter((overlay) => overlay !== null);
  }

  try {
    if (layer.device) {
      // La captura llena la pantalla del marco; el radio y la sombra son los del marco.
      const { screen } = deviceGeometry(layer.device, width, height, scale);
      const capture = await prepareImage(layer.src, screen.width, screen.height, {
        fit: layer.fit,
        position: layer.position,
        crop: layer.crop,
        blur: layer.blur && layer.blur * scale,
        brightness: layer.brightness,
        saturation: layer.saturation,
      });
      const framed = await frameDevice(kit, layer.device, capture.buffer, width, height, scale);
      await shadowOf(framed.radius / scale);
      overlays.push(await place(await shapeRaster(framed.buffer, width, height, 0, layer.fade), layer, scale, canvas));
      return overlays.filter((overlay) => overlay !== null);
    }

    const image = await imageRaster(layer, scale);
    await shadowOf(layer.radius, image.transparent ? image.buffer : undefined);
    const shaped = await shapeRaster(image.buffer, width, height, layer.radius * scale, layer.fade);
    overlays.push(await place(shaped, layer, scale, canvas));
  } catch (error) {
    // Una imagen rota no tumba la pieza: queda un hueco marcado.
    console.error("content/render: image failed", layer.src, error);
    const hole = await prepareRect(kit, { color: "#80808033", radius: layer.radius }, width, height, scale);
    overlays.push(await place(hole.buffer, layer, scale, canvas));
  }
  return overlays.filter((overlay) => overlay !== null);
}

// --- Slide

export type RenderInput = {
  kit: BrandKit;
  content: Content;
  slide: Slide | undefined;
  format: PostFormat;
  scale: number;
};

type Step = { kind: "vector"; nodes: React.ReactNode[] } | { kind: "raster"; layer: Exclude<Layer, TextLayer> };

export async function renderSlidePng({ kit, content, slide, format, scale }: RenderInput) {
  const { width, height } = POST_FORMATS[format];
  const canvas = { width: Math.round(width * scale), height: Math.round(height * scale) };
  const background = slide?.background ?? kit.background;
  const paper = resolveColor(kit, background, kit.background);
  const context: RenderContext = { kit, content, scale, light: slide?.light ?? "top", paper };

  // Las capas en orden, juntando las vectoriales seguidas en una pasada de Satori.
  const steps: Step[] = [];
  (slide?.layers ?? []).forEach((layer, index) => {
    const node =
      layer.type === "text"
        ? renderText(layer, index, context)
        : layer.type === "rect" && isPlainRect(layer)
          ? renderPlainRect(layer, index, context)
          : null;
    const last = steps[steps.length - 1];
    if (node && last?.kind === "vector") last.nodes.push(node);
    else if (node) steps.push({ kind: "vector", nodes: [node] });
    else steps.push({ kind: "raster", layer: layer as Exclude<Layer, TextLayer> });
  });

  const fonts = fontsFor(kit, slide);
  const satori = async (nodes: React.ReactNode[]) => {
    const response = new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden" }}>{nodes}</div>,
      { ...canvas, fonts: await fonts },
    );
    return { input: Buffer.from(await response.arrayBuffer()), left: 0, top: 0 } satisfies Overlay;
  };

  let base: Buffer = slide?.backdrop
    ? (await prepareBackdrop(kit, background, slide.backdrop, canvas.width, canvas.height, scale)).buffer
    : await sharp({ create: { ...canvas, channels: 3, background: paper.slice(0, 7) } }).png().toBuffer();
  let pending: Overlay[] = [];

  // El lienzo hasta este punto (solo lo pide el vidrio): aplica lo pendiente.
  const below = async () => {
    if (pending.length > 0) {
      base = await sharp(base).composite(pending).png().toBuffer();
      pending = [];
    }
    return base;
  };

  // Todo lo que no es vidrio se prepara en paralelo; despues se apila en orden.
  const prepared = steps.map((step) =>
    step.kind === "vector"
      ? satori(step.nodes).then((overlay) => [overlay])
      : step.layer.type === "rect" && step.layer.glass
        ? null
        : rasterLayer(step.layer, context, canvas, below),
  );

  for (const [index, step] of steps.entries()) {
    const ready = prepared[index];
    // Primero esperar y despues leer pending: el vidrio lo vacia al componer lo de abajo.
    const overlays = ready ? await ready : step.kind === "raster" ? await rasterLayer(step.layer, context, canvas, below) : [];
    pending.push(...overlays);
  }

  return sharp(base).composite(pending).png().toBuffer();
}

/** Varios slides ya renderizados en una sola imagen, en filas de a cinco. */
export async function contactSheet(pngs: Buffer[]) {
  const gap = 12;
  const { width = 1, height = 1 } = await sharp(pngs[0]).metadata();
  const columns = Math.min(5, pngs.length);
  const rows = Math.ceil(pngs.length / columns);
  return sharp({
    create: { width: columns * width + (columns + 1) * gap, height: rows * height + (rows + 1) * gap, channels: 3, background: "#000000" },
  })
    .composite(pngs.map((input, index) => ({ input, left: gap + (index % columns) * (width + gap), top: gap + Math.floor(index / columns) * (height + gap) })))
    .png()
    .toBuffer();
}

export async function renderSlide(input: RenderInput) {
  return new Response(new Uint8Array(await renderSlidePng(input)), { headers: { "Content-Type": "image/png" } });
}
