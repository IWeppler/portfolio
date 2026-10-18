import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { FONTS, type FontKey } from "./fonts";
import { POST_FORMATS, type PostFormat } from "./formats";
import { resolveColor, type BrandKit } from "./kits";
import { resolveText } from "./layers";
import type { Content, Layer, Slide } from "./schema";

// Render de un slide a PNG con Satori (next/og). Es la unica fuente de verdad:
// la vista previa del panel, la descarga 2K y el render_preview del MCP salen
// de aca, asi que lo que se ve es exactamente lo que se baja.

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

// Hosts de los que se aceptan imagenes remotas: el Storage del propio Supabase.
function allowedRemote(url: URL) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url.protocol === "https:" && !!supabase && url.host === new URL(supabase).host;
}

async function readSource(src: string) {
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

// Satori no lee webp y con PNG de varios MB se arrastra: sharp recorta cada
// imagen al tamaño exacto de su capa y la pasa a jpeg (o png si tiene alfa).
const imageCache = new Map<string, Promise<string>>();
const IMAGE_CACHE_LIMIT = 60;

function prepareImage(src: string, width: number, height: number, fit: "cover" | "contain", position: string) {
  const key = `${src}|${width}x${height}|${fit}|${position}`;
  const cached = imageCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const input = sharp(await readSource(src)).rotate();
    const { hasAlpha } = await input.metadata();
    const transparent = hasAlpha || fit === "contain";
    const resized = input.resize(width, height, {
      fit,
      position: position === "center" ? "centre" : position,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    const buffer = transparent
      ? await resized.png().toBuffer()
      : await resized.jpeg({ quality: 90, mozjpeg: true }).toBuffer();

    return `data:image/${transparent ? "png" : "jpeg"};base64,${buffer.toString("base64")}`;
  })();

  promise.catch(() => imageCache.delete(key));
  if (imageCache.size >= IMAGE_CACHE_LIMIT) {
    imageCache.delete(imageCache.keys().next().value!);
  }
  imageCache.set(key, promise);

  return promise;
}

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

type Part = { text: string; color?: string };

/**
 * Palabras de una linea con [[resaltado]]. Cada palabra es una lista de
 * partes, asi "comercio[[*]]" queda pegado y solo el asterisco cambia de color.
 */
function highlightedWords(line: string, accent: string): Part[][] {
  const words: Part[][] = [[]];
  for (const piece of line.split(/(\[\[[^\]]*\]\])/)) {
    const marked = piece.startsWith("[[") && piece.endsWith("]]");
    const body = marked ? piece.slice(2, -2) : piece;
    body.split(" ").forEach((chunk, index) => {
      if (index > 0) words.push([]);
      if (chunk) words[words.length - 1].push({ text: chunk, color: marked ? accent : undefined });
    });
  }
  return words.filter((word) => word.length > 0);
}

type RenderContext = { kit: BrandKit; content: Content; scale: number };

async function renderLayer(layer: Layer, index: number, { kit, content, scale }: RenderContext) {
  if (layer.type === "rect") {
    return (
      <div
        key={index}
        style={{
          ...common(layer, scale),
          width: layer.w * scale,
          height: layer.h * scale,
          background: resolveColor(kit, layer.color, "$surface"),
          borderRadius: layer.radius * scale,
          ...(layer.stroke && layer.strokeWidth
            ? { border: `${layer.strokeWidth * scale}px solid ${resolveColor(kit, layer.stroke, kit.ink)}` }
            : {}),
        }}
      />
    );
  }

  if (layer.type === "image") {
    const width = Math.round(layer.w * scale);
    const height = Math.round(layer.h * scale);

    try {
      const src = await prepareImage(layer.src, width, height, layer.fit, layer.position);
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={src}
          alt=""
          width={width}
          height={height}
          style={{ ...common(layer, scale), width, height, borderRadius: layer.radius * scale }}
        />
      );
    } catch (error) {
      // Una imagen rota no tumba la pieza: queda un hueco marcado.
      console.error("content/render: image failed", layer.src, error);
      return (
        <div
          key={index}
          style={{
            ...common(layer, scale),
            width,
            height,
            background: "#80808033",
            borderRadius: layer.radius * scale,
          }}
        />
      );
    }
  }

  const text = resolveText(layer, kit, content);
  const accent = resolveColor(kit, layer.highlight, kit.highlight);

  return (
    <div
      key={index}
      style={{
        ...common(layer, scale),
        display: "flex",
        flexDirection: "column",
        alignItems: text.align === "center" ? "center" : text.align === "right" ? "flex-end" : "flex-start",
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
            justifyContent: text.align === "center" ? "center" : text.align === "right" ? "flex-end" : "flex-start",
            // Con resaltados las palabras van separadas: el hueco es el espacio de la fuente.
            columnGap: (FONTS[text.font].space + text.tracking) * text.size * scale,
            minHeight: text.size * scale * text.lineHeight,
          }}
        >
          {line.includes("[[")
            ? highlightedWords(line, accent).map((word, wordIndex) => (
                <div key={wordIndex} style={{ display: "flex" }}>
                  {word.map((part, partIndex) => (
                    <span key={partIndex} style={part.color ? { color: part.color } : undefined}>
                      {part.text}
                    </span>
                  ))}
                </div>
              ))
            : line}
        </div>
      ))}
    </div>
  );
}

export type RenderInput = {
  kit: BrandKit;
  content: Content;
  slide: Slide | undefined;
  format: PostFormat;
  scale: number;
};

export async function renderSlide({ kit, content, slide, format, scale }: RenderInput) {
  const { width, height } = POST_FORMATS[format];
  const context = { kit, content, scale };
  const [layers, fonts] = await Promise.all([
    Promise.all((slide?.layers ?? []).map((layer, index) => renderLayer(layer, index, context))),
    fontsFor(kit, slide),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: resolveColor(kit, slide?.background, kit.background),
        }}
      >
        {layers}
      </div>
    ),
    {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      fonts,
    },
  );
}

export async function renderSlidePng(input: RenderInput) {
  const response = await renderSlide(input);
  return Buffer.from(await response.arrayBuffer());
}
