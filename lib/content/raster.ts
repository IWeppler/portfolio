import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { resolveColor, type BrandKit } from "./kits";
import type { Backdrop, Gradient, GraphicLayer, Shadow } from "./schema";

// Todo lo que el render prepara con sharp antes de dibujar. Satori (resvg)
// dibuja sombras y desenfoques, pero cada uno le cuesta segundos y en 2K
// varios pasan el limite de la ruta; con sharp son milisegundos. Tambien las
// imagenes: Satori no lee webp y con PNG de varios MB se arrastra.

const read = (...segments: string[]) => readFile(path.join(process.cwd(), ...segments));

// Hosts de los que se aceptan imagenes remotas: el Storage del propio Supabase.
function allowedRemote(url: URL) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url.protocol === "https:" && !!supabase && url.host === new URL(supabase).host;
}

// El original ya girado segun su EXIF, por src: una captura que se usa en
// varios tamaños (1x, 2K, recortes) se baja una sola vez.
const sources = new Map<string, Promise<Buffer>>();
const SOURCE_LIMIT = 30;

function readSource(src: string) {
  const hit = sources.get(src);
  if (hit) return hit;

  const promise = fetchSource(src).then((buffer) => sharp(buffer).rotate().toBuffer());
  promise.catch(() => sources.delete(src));
  if (sources.size >= SOURCE_LIMIT) sources.delete(sources.keys().next().value!);
  sources.set(src, promise);
  return promise;
}

async function fetchSource(src: string) {
  if (src.startsWith("/")) {
    const relative = path.normalize(src).replace(/^[\\/]+/, "");
    if (relative.startsWith("..")) throw new Error(`Ruta invalida: ${src}`);
    return read("public", relative);
  }

  const url = new URL(src);
  if (!allowedRemote(url)) throw new Error(`Host de imagen no permitido: ${url.host}`);

  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`No se pudo bajar ${src}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export type Raster = { uri: string; buffer: Buffer; transparent: boolean };

const toRaster = (buffer: Buffer, transparent: boolean): Raster => ({
  uri: `data:image/${transparent ? "png" : "jpeg"};base64,${buffer.toString("base64")}`,
  buffer,
  transparent,
});

// Cache comun: la misma imagen en el mismo tamaño se prepara una vez.
const cache = new Map<string, Promise<Raster>>();
const CACHE_LIMIT = 80;

function cached(key: string, build: () => Promise<Raster>) {
  const hit = cache.get(key);
  if (hit) return hit;

  const promise = build();
  promise.catch(() => cache.delete(key));
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, promise);
  return promise;
}

export type ImageOptions = {
  fit: "cover" | "contain";
  position: string;
  crop?: { x: number; y: number; w: number; h: number };
  /** En px de salida (ya escalados). */
  blur?: number;
  motionBlur?: number;
  brightness?: number;
  saturation?: number;
};

// sharp pide kernels de al menos 3x3: el desenfoque horizontal es la fila del medio.
function motionKernel(length: number) {
  const width = Math.min(1001, Math.max(3, Math.round(length) | 1));
  const zeros = Array<number>(width).fill(0);
  return { width, height: 3, kernel: [...zeros, ...Array<number>(width).fill(1), ...zeros] };
}

/** Recorta, encaja y trata una imagen al tamaño exacto de su capa. */
export function prepareImage(src: string, width: number, height: number, options: ImageOptions) {
  return cached(`img|${src}|${width}x${height}|${JSON.stringify(options)}`, async () => {
    let source = await readSource(src);

    if (options.crop) {
      const { width: sourceWidth = 1, height: sourceHeight = 1 } = await sharp(source).metadata();
      const left = Math.round(options.crop.x * sourceWidth);
      const top = Math.round(options.crop.y * sourceHeight);
      source = await sharp(source)
        .extract({
          left,
          top,
          width: Math.max(1, Math.min(sourceWidth - left, Math.round(options.crop.w * sourceWidth))),
          height: Math.max(1, Math.min(sourceHeight - top, Math.round(options.crop.h * sourceHeight))),
        })
        .toBuffer();
    }

    const { hasAlpha } = await sharp(source).metadata();
    const transparent = !!hasAlpha || options.fit === "contain";
    let image = sharp(source).resize(width, height, {
      fit: options.fit,
      position: options.position === "center" ? "centre" : options.position,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    if (options.brightness !== undefined || options.saturation !== undefined) {
      image = image.modulate({ brightness: options.brightness ?? 1, saturation: options.saturation ?? 1 });
    }
    if (options.motionBlur && options.motionBlur >= 3) {
      image = sharp(await image.toBuffer()).convolve(motionKernel(options.motionBlur));
    }
    if (options.blur && options.blur > 0.3) image = image.blur(options.blur / 2);

    const buffer = transparent
      ? await image.png().toBuffer()
      : await image.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    return toRaster(buffer, transparent);
  });
}

// --- Sombras

const SHADOW_PRESETS = {
  soft: { distance: 12, blur: 32, opacity: 0.35 },
  float: { distance: 28, blur: 60, opacity: 0.5 },
  deep: { distance: 48, blur: 100, opacity: 0.65 },
};

export type Light = "top-left" | "top" | "top-right";

/** Hacia donde cae una sombra (en px de lienzo) segun de donde viene la luz. */
export function shadowOffset(shadow: Shadow, light: Light = "top") {
  const { distance } = typeof shadow === "string" ? SHADOW_PRESETS[shadow] : shadow;
  const side = light === "top-left" ? 0.6 : light === "top-right" ? -0.6 : 0;
  return { dx: distance * side, dy: distance * (side ? 0.8 : 1) };
}

/**
 * Sombra de una caja (redondeada) o, si se pasa la imagen, de su silueta: un
 * PNG recortado proyecta su forma, no un rectangulo. Mide lo mismo que la
 * capa mas `pad` de cada lado.
 */
export function prepareShadow(width: number, height: number, radius: number, shadow: Shadow, silhouette?: Buffer) {
  const { blur, opacity } = typeof shadow === "string" ? SHADOW_PRESETS[shadow] : shadow;
  const pad = Math.ceil(blur * 1.2) + 2;
  const key = `shadow|${width}x${height}|${radius}|${blur}|${opacity}|${silhouette ? silhouette.length : ""}`;

  return cached(key, async () => {
    const full = { width: width + pad * 2, height: height + pad * 2 };
    let alpha: Buffer;
    if (silhouette) {
      alpha = await sharp(silhouette)
        .resize(width, height)
        .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extractChannel("alpha")
        .linear(opacity, 0)
        .toBuffer();
    } else {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${full.width}" height="${full.height}"><rect x="${pad}" y="${pad}" width="${width}" height="${height}" rx="${radius}" fill="#fff" fill-opacity="${opacity}"/></svg>`;
      alpha = await sharp(Buffer.from(svg)).extractChannel("alpha").toBuffer();
    }
    const blurred = blur > 0.6 ? await sharp(alpha).blur(blur / 2).toBuffer() : alpha;
    const buffer = await sharp({ create: { ...full, channels: 3, background: "#000" } })
      .joinChannel(blurred)
      .png()
      .toBuffer();
    return toRaster(buffer, true);
  }).then((raster) => ({ ...raster, pad }));
}

// --- SVG

/** Hex con alfa a atributos de SVG (librsvg no garantiza #rrggbbaa). */
function paint(hex: string, attribute: "fill" | "stroke" | "stop-color" = "fill") {
  const alpha = hex.length === 9 ? Number.parseInt(hex.slice(7), 16) / 255 : 1;
  const opacity = attribute === "stop-color" ? "stop-opacity" : `${attribute}-opacity`;
  return `${attribute}="${hex.slice(0, 7)}" ${opacity}="${Math.round(alpha * 1000) / 1000}"`;
}

function gradientDef(kit: BrandKit, gradient: Gradient, id: string) {
  const stops = gradient.stops
    .map((stop) => `<stop offset="${stop.at}" ${paint(resolveColor(kit, stop.color, "#000000"), "stop-color")}/>`)
    .join("");
  if (gradient.type === "radial") {
    const center = gradient.center ?? { x: 0.5, y: 0.5 };
    return `<radialGradient id="${id}" cx="${center.x}" cy="${center.y}" r="0.75">${stops}</radialGradient>`;
  }
  // El angulo es el de CSS: 180 va de arriba hacia abajo.
  const radians = ((gradient.angle - 90) * Math.PI) / 180;
  const x = Math.cos(radians) / 2;
  const y = Math.sin(radians) / 2;
  return `<linearGradient id="${id}" x1="${0.5 - x}" y1="${0.5 - y}" x2="${0.5 + x}" y2="${0.5 + y}">${stops}</linearGradient>`;
}

/** El mismo degradado en CSS, para rellenar una caja en el render. */
export function gradientCss(kit: BrandKit, gradient: Gradient) {
  const stops = gradient.stops
    .map((stop) => `${resolveColor(kit, stop.color, "#000000")} ${Math.round(stop.at * 100)}%`)
    .join(", ");
  if (gradient.type === "radial") {
    const center = gradient.center ?? { x: 0.5, y: 0.5 };
    return `radial-gradient(circle at ${center.x * 100}% ${center.y * 100}%, ${stops})`;
  }
  return `linear-gradient(${gradient.angle}deg, ${stops})`;
}

// Pseudoaleatorio con semilla: el mismo grafico sale igual en cada render.
function seeded(seed: number) {
  let state = (seed % 2147483646) + 1;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

function graphicSvg(kit: BrandKit, layer: GraphicLayer, width: number, height: number, scale: number) {
  const color = resolveColor(kit, layer.color, "$foreground");
  const accent = resolveColor(kit, layer.accent ?? layer.color, "$foreground");
  const muted = resolveColor(kit, layer.muted, kit.colors.assets ? "$assets" : "#2a2b2e");
  const random = seeded(layer.seed ?? 1);
  const shapes: string[] = [];

  switch (layer.kind) {
    case "rings": {
      const count = layer.count ?? 5;
      const max = Math.min(width, height) / 2 - scale;
      for (let index = 0; index < count; index++) {
        // Los anillos de afuera se apagan: la luz queda en el centro.
        const radius = max * ((index + 1) / count);
        const fade = 1 - index / (count + 1);
        shapes.push(`<circle cx="${width / 2}" cy="${height / 2}" r="${radius}" fill="none" ${paint(color, "stroke")} stroke-width="${scale}" opacity="${fade}"/>`);
      }
      break;
    }
    case "sparkles": {
      const count = layer.count ?? 4;
      const base = (layer.size ?? 14) * scale;
      for (let index = 0; index < count; index++) {
        const x = base + random() * (width - base * 2);
        const y = base + random() * (height - base * 2);
        const size = base * (0.6 + random() * 0.6);
        const waist = size * 0.18;
        shapes.push(
          `<path d="M${x} ${y - size} L${x + waist} ${y - waist} L${x + size} ${y} L${x + waist} ${y + waist} L${x} ${y + size} L${x - waist} ${y + waist} L${x - size} ${y} L${x - waist} ${y - waist} Z" ${paint(color)}/>`,
        );
      }
      break;
    }
    case "cells": {
      const cols = layer.cols ?? 8;
      const rows = layer.rows ?? 5;
      const gap = (layer.spacing ?? 10) * scale;
      const size = Math.min((width - gap * (cols - 1)) / cols, (height - gap * (rows - 1)) / rows);
      const lit = new Set(layer.lit ?? []);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const on = lit.has(row * cols + col);
          shapes.push(`<rect x="${col * (size + gap)}" y="${row * (size + gap)}" width="${size}" height="${size}" rx="${size * 0.16}" ${paint(on ? accent : muted)}/>`);
        }
      }
      break;
    }
    case "bars": {
      const values = layer.values?.length ? layer.values : [0.3, 0.5, 0.4, 0.8, 0.6];
      const gap = (layer.spacing ?? 10) * scale;
      const barWidth = (width - gap * (values.length - 1)) / values.length;
      const max = Math.max(...values);
      values.forEach((value, index) => {
        const barHeight = Math.max(scale, value * height);
        // Las barras mas altas (desde el 60% del maximo) van encendidas.
        const on = layer.accent !== undefined && value >= max * 0.6;
        shapes.push(`<rect x="${index * (barWidth + gap)}" y="${height - barHeight}" width="${barWidth}" height="${barHeight}" rx="${Math.min(barWidth / 2, 4 * scale)}" ${paint(on ? accent : layer.accent ? muted : color)}/>`);
      });
      break;
    }
    case "dots": {
      const columns = layer.count ?? 5;
      const perColumn = layer.rows ?? 40;
      const radius = (layer.size ?? 3) * scale;
      for (let column = 0; column < columns; column++) {
        const centerX = columns === 1 ? width / 2 : radius * 6 + (column * (width - radius * 12)) / (columns - 1);
        for (let index = 0; index < perColumn; index++) {
          // Dos nucleos por columna: se lee como una distribucion sin decir numeros.
          const core = random() > 0.5 ? 0.35 : 0.7;
          const y = Math.min(height - radius, Math.max(radius, (core + (random() - 0.5) * 0.5) * height));
          const x = centerX + (random() - 0.5) * radius * 10;
          const bright = random() > 0.6;
          shapes.push(`<circle cx="${x}" cy="${y}" r="${bright ? radius * 1.2 : radius}" ${paint(bright ? accent : color)} opacity="${bright ? 1 : 0.45}"/>`);
        }
      }
      break;
    }
    case "lines": {
      const spacing = (layer.spacing ?? 108) * scale;
      for (let x = spacing; x < width; x += spacing) {
        shapes.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" ${paint(color, "stroke")} stroke-width="${scale}"/>`);
      }
      break;
    }
    case "grid": {
      const spacing = (layer.spacing ?? 24) * scale;
      const radius = (layer.size ?? 1.6) * scale;
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) shapes.push(`<circle cx="${x}" cy="${y}" r="${radius}" ${paint(color)}/>`);
      }
      break;
    }
    case "glow": {
      // Gradiente radial en vez de desenfoque: mismo halo, sin costo.
      shapes.push(
        `<defs><radialGradient id="g"><stop offset="0" ${paint(color, "stop-color")}/><stop offset="1" stop-color="${color.slice(0, 7)}" stop-opacity="0"/></radialGradient></defs><ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2}" ry="${height / 2}" fill="url(#g)"/>`,
      );
      break;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${shapes.join("")}</svg>`;
}

export function prepareGraphic(kit: BrandKit, layer: GraphicLayer, width: number, height: number, scale: number) {
  return cached(`graphic|${kit.id}|${width}x${height}|${scale}|${JSON.stringify(layer)}`, async () =>
    toRaster(await sharp(Buffer.from(graphicSvg(kit, layer, width, height, scale))).png().toBuffer(), true),
  );
}

// --- Fondo compuesto

function grainTile(width: number, height: number, amount: number) {
  const random = seeded(7);
  const raw = Buffer.alloc(width * height * 4);
  const alpha = Math.round(amount * 160);
  for (let index = 0; index < raw.length; index += 4) {
    raw[index] = raw[index + 1] = raw[index + 2] = Math.round(random() * 255);
    raw[index + 3] = alpha;
  }
  return sharp(raw, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/**
 * Arma el fondo de un slide en una sola imagen: color, foto, degradado, focos
 * de luz y grano. El grano va en soft-light, que Satori no tiene: asi texturiza
 * sin levantar los negros.
 */
export function prepareBackdrop(kit: BrandKit, background: string, backdrop: Backdrop, width: number, height: number, scale: number) {
  return cached(`backdrop|${kit.id}|${background}|${width}x${height}|${JSON.stringify(backdrop)}`, async () => {
    const layers: sharp.OverlayOptions[] = [];

    if (backdrop.image) {
      const { src, position, blur, motionBlur, brightness, saturation } = backdrop.image;
      const photo = await prepareImage(src, width, height, {
        fit: "cover",
        position,
        blur: blur && blur * scale,
        motionBlur: motionBlur && motionBlur * scale,
        brightness,
        saturation,
      });
      layers.push({ input: photo.buffer });
    }

    const svgParts: string[] = [];
    if (backdrop.gradient) {
      svgParts.push(`<defs>${gradientDef(kit, backdrop.gradient, "veil")}</defs><rect width="100%" height="100%" fill="url(#veil)"/>`);
    }
    backdrop.glows?.forEach((glow, index) => {
      const hex = resolveColor(kit, glow.color, "$accent");
      svgParts.push(
        `<defs><radialGradient id="glow${index}"><stop offset="0" stop-color="${hex.slice(0, 7)}" stop-opacity="${glow.opacity}"/><stop offset="1" stop-color="${hex.slice(0, 7)}" stop-opacity="0"/></radialGradient></defs><circle cx="${glow.x * scale}" cy="${glow.y * scale}" r="${glow.r * scale}" fill="url(#glow${index})"/>`,
      );
    });
    if (svgParts.length > 0) {
      layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svgParts.join("")}</svg>`) });
    }
    if (backdrop.grain) {
      layers.push({ input: await grainTile(width, height, backdrop.grain), blend: "soft-light" });
    }

    const buffer = await sharp({ create: { width, height, channels: 3, background: resolveColor(kit, background, "#000000").slice(0, 7) } })
      .composite(layers)
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
    return toRaster(buffer, false);
  });
}

// --- Formas y acabados

/** Un rectangulo con relleno (color o degradado) y borde interior, como CSS. */
export function prepareRect(
  kit: BrandKit,
  rect: { color: string; gradient?: Gradient; stroke?: string; strokeWidth?: number; radius: number },
  width: number,
  height: number,
  scale: number,
) {
  return cached(`rect|${kit.id}|${width}x${height}|${scale}|${JSON.stringify(rect)}`, async () => {
    const strokeWidth = rect.stroke && rect.strokeWidth ? rect.strokeWidth * scale : 0;
    const radius = rect.radius * scale;
    const fill = rect.gradient ? 'fill="url(#fill)"' : paint(resolveColor(kit, rect.color, "$surface"));
    const defs = rect.gradient ? `<defs>${gradientDef(kit, rect.gradient, "fill")}</defs>` : "";
    const stroke = strokeWidth
      ? `<rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${width - strokeWidth}" height="${height - strokeWidth}" rx="${Math.max(0, radius - strokeWidth / 2)}" fill="none" ${paint(resolveColor(kit, rect.stroke, kit.ink), "stroke")} stroke-width="${strokeWidth}"/>`
      : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${defs}<rect width="${width}" height="${height}" rx="${radius}" ${fill}/>${stroke}</svg>`;
    return toRaster(await sharp(Buffer.from(svg)).png().toBuffer(), true);
  });
}

export type Fade = "top" | "bottom" | "left" | "right" | "radial";

const FADE_GRADIENTS: Record<Fade, string> = {
  bottom: `<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
  top: `<linearGradient id="f" x1="0" y1="1" x2="0" y2="0"><stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
  right: `<linearGradient id="f" x1="0" y1="0" x2="1" y2="0"><stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
  left: `<linearGradient id="f" x1="1" y1="0" x2="0" y2="0"><stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
  radial: `<radialGradient id="f" r="0.7071"><stop offset="0.4" stop-color="#fff"/><stop offset="0.75" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
};

/** Esquinas redondeadas y fundido: una mascara sobre el alfa de la imagen. */
export async function shapeRaster(buffer: Buffer, width: number, height: number, radius: number, fade?: Fade) {
  if (!radius && !fade) return buffer;
  const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${fade ? FADE_GRADIENTS[fade] : ""}</defs><rect width="${width}" height="${height}" rx="${radius}" fill="${fade ? "url(#f)" : "#fff"}"/></svg>`;
  return sharp(buffer)
    .ensureAlpha()
    .composite([{ input: Buffer.from(mask), blend: "dest-in" }])
    .png()
    .toBuffer();
}

/** Opacidad y giro (como CSS: horario, sobre el centro). Devuelve el tamaño nuevo. */
export async function transformRaster(buffer: Buffer, opacity = 1, rotate = 0) {
  let image = sharp(buffer).ensureAlpha();
  if (opacity < 1) image = image.linear([1, 1, 1, opacity], [0, 0, 0, 0]);
  if (rotate) image = sharp(await image.png().toBuffer()).rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  const { data, info } = await image.png().toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

export type Overlay = { input: Buffer; left: number; top: number };

/** composite no acepta capas que salen del lienzo: se recorta la parte visible. */
export async function clipOverlay(buffer: Buffer, width: number, height: number, left: number, top: number, canvas: { width: number; height: number }) {
  const x = Math.round(left);
  const y = Math.round(top);
  const cropLeft = Math.max(0, -x);
  const cropTop = Math.max(0, -y);
  const visibleWidth = Math.min(width - cropLeft, canvas.width - Math.max(0, x));
  const visibleHeight = Math.min(height - cropTop, canvas.height - Math.max(0, y));
  if (visibleWidth <= 0 || visibleHeight <= 0) return null;

  const whole = cropLeft === 0 && cropTop === 0 && visibleWidth === width && visibleHeight === height;
  return {
    input: whole ? buffer : await sharp(buffer).extract({ left: cropLeft, top: cropTop, width: visibleWidth, height: visibleHeight }).toBuffer(),
    left: Math.max(0, x),
    top: Math.max(0, y),
  } satisfies Overlay;
}

// --- Marcos de dispositivo

export type Device = "browser" | "phone";

/** Donde va la pantalla dentro del marco (px de salida) y el radio exterior. */
export function deviceGeometry(device: Device, width: number, height: number, scale: number) {
  if (device === "phone") {
    const bezel = Math.round(width * 0.035);
    const radius = Math.round(width * 0.15);
    // La barra de estado: la isla va ahi y no tapa la web.
    const statusBar = Math.round(bezel * 2.6);
    return {
      screen: { left: bezel, top: bezel + statusBar, width: width - bezel * 2, height: height - bezel * 2 - statusBar },
      radius,
      bezel,
      statusBar,
    };
  }
  const bar = Math.round(Math.max(22 * scale, width * 0.045));
  return { screen: { left: 0, top: bar, width, height: height - bar }, radius: Math.round(12 * scale), bezel: bar, statusBar: 0 };
}

/** El marco dibujado con la captura adentro. La captura no se toca: solo se encaja. */
export async function frameDevice(kit: BrandKit, device: Device, screen: Buffer, width: number, height: number, scale: number) {
  const { screen: area, radius, bezel, statusBar } = deviceGeometry(device, width, height, scale);
  const edge = paint(resolveColor(kit, "$foreground/14", "#ffffff24"), "stroke");
  let frame: string;
  let overlay = "";
  let screenTop = area.top;

  if (device === "phone") {
    const inner = radius - bezel;
    frame = `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="#0c0c0d" ${edge}/>`;
    // La isla: una pildora negra arriba, sobre la barra de estado.
    const island = { width: width * 0.28, height: bezel * 0.95 };
    overlay = `<rect x="${(width - island.width) / 2}" y="${bezel + (statusBar - island.height) / 2}" width="${island.width}" height="${island.height}" rx="${island.height / 2}" fill="#000"/>`;
    // La barra de estado toma el color del borde de arriba de la captura, como en el telefono.
    const { data } = await sharp(screen).extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const full = { width: area.width, height: area.height + statusBar };
    const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${full.width}" height="${full.height}"><rect width="${full.width}" height="${full.height}" rx="${inner}" fill="#fff"/></svg>`;
    screen = await sharp({ create: { ...full, channels: 4, background: { r: data[0], g: data[1], b: data[2], alpha: 1 } } })
      .composite([{ input: screen, left: 0, top: statusBar }, { input: Buffer.from(mask), blend: "dest-in" }])
      .png()
      .toBuffer();
    screenTop = area.top - statusBar;
  } else {
    const bar = resolveColor(kit, "$assets", "#2a2b2e");
    const dot = paint(resolveColor(kit, "$paragraph/55", "#a2a3a88c"));
    const dots = [0, 1, 2].map((index) => `<circle cx="${bezel * 0.6 + index * bezel * 0.45}" cy="${bezel / 2}" r="${bezel * 0.13}" ${dot}/>`).join("");
    const address = `<rect x="${width * 0.3}" y="${bezel * 0.24}" width="${width * 0.4}" height="${bezel * 0.52}" rx="${bezel * 0.26}" ${paint(resolveColor(kit, "$background/55", "#1112138c"))}/>`;
    frame = `<rect width="${width}" height="${height}" rx="${radius}" ${paint(bar)}/>${dots}${address}`;
    overlay = `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="none" ${edge}/>`;
  }

  const svg = (body: string) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`);
  const composed = await sharp(svg(frame))
    .composite([{ input: screen, left: area.left, top: screenTop }, { input: svg(overlay) }])
    .png()
    .toBuffer();
  return { buffer: await shapeRaster(composed, width, height, radius), radius };
}

// --- Vidrio

/**
 * Lo que se ve a traves de un vidrio: el lienzo tal como esta hasta esa capa,
 * recortado a la caja y desenfocado. Coordenadas en px de salida.
 */
export async function glassBackdrop(canvas: Buffer, size: { width: number; height: number }, area: { left: number; top: number; width: number; height: number }, blur: number) {
  const left = Math.max(0, Math.min(size.width - 1, Math.round(area.left)));
  const top = Math.max(0, Math.min(size.height - 1, Math.round(area.top)));
  return sharp(canvas)
    .extract({ left, top, width: Math.max(1, Math.min(area.width, size.width - left)), height: Math.max(1, Math.min(area.height, size.height - top)) })
    .resize(area.width, area.height, { fit: "fill" })
    .blur(Math.max(0.3, blur / 2))
    .png()
    .toBuffer();
}
