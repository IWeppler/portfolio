import { z } from "zod";
import { FONT_KEYS } from "./fonts";
import { POST_FORMAT_NAMES } from "./formats";
import { BRAND_IDS } from "./kits";

// Una pieza tiene dos partes independientes:
// - content: lo que dice (titulo, bajada, CTA, caption...). Se edita sin tocar el diseño.
// - designs: como se ve, uno por formato. Cada diseño es una lista de slides
//   (1 = posteo, 2+ = carrusel) y cada slide una pila de capas en px sobre el
//   lienzo de 1080 de ancho; la primera capa queda abajo.
// Las capas de texto pueden tomar su texto de un campo de content (`field`),
// asi cambiar el titulo lo cambia en todos los formatos.

const text = (max: number) => z.string().max(max);

// Todos opcionales y sin defaults (un `.default()` sobreviviria a `.partial()`
// y un PATCH borraria los campos que no manda); los vacios se completan aparte.
export const contentPatchSchema = z
  .object({
    objective: text(500).describe("Para que existe la pieza."),
    audience: text(300).describe("A quien le habla."),
    title: text(200),
    subtitle: text(400),
    body: text(1500),
    cta: text(120),
    points: z.array(text(400)).max(10).describe("Puntos de un carrusel o lista; se vinculan como points.0, points.1..."),
    caption: text(2200).describe("Texto del posteo en Instagram."),
  })
  .partial();

export const EMPTY_CONTENT = {
  objective: "",
  audience: "",
  title: "",
  subtitle: "",
  body: "",
  cta: "",
  points: [] as string[],
  caption: "",
};

export const contentSchema = contentPatchSchema.transform((content) => ({ ...EMPTY_CONTENT, ...content }));

export const CONTENT_FIELDS = ["title", "subtitle", "body", "cta"] as const;
const FIELD = /^(title|subtitle|body|cta|points\.\d)$/;

const color = z
  .string()
  .trim()
  .max(40)
  .describe('Token del kit ("$foreground", "$accent", ...), con alfa en % ("$accent/20") o hex.');

const box = {
  x: z.number().min(-2000).max(4000).describe("Izquierda en px del lienzo de 1080."),
  y: z.number().min(-2000).max(4000).describe("Arriba en px."),
  opacity: z.number().min(0).max(1).optional(),
  rotate: z.number().min(-180).max(180).optional().describe("Grados."),
  id: z.string().max(40).optional().describe("Nombre estable de la capa, para referirse a ella."),
  purpose: z
    .string()
    .max(160)
    .optional()
    .describe("Para que esta la capa (sostiene el titular, separa, da profundidad). Lo decorativo sin funcion sobra."),
};

// Efectos. Los caros para el render (sombras, desenfoques) se preparan con
// sharp antes de dibujar, asi un slide con varias sombras no tarda minutos.

const shadow = z
  .union([
    z.enum(["soft", "float", "deep"]),
    z.object({
      distance: z.number().min(0).max(200).default(24),
      blur: z.number().min(0).max(200).default(48),
      opacity: z.number().min(0).max(1).default(0.5),
    }),
  ])
  .describe("Sombra proyectada; cae del lado contrario a slide.light.");

const gradient = z.object({
  type: z.enum(["linear", "radial"]).default("linear"),
  angle: z.number().min(0).max(360).default(180).describe("Linear: direccion en grados (180 = de arriba hacia abajo)."),
  center: z
    .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
    .optional()
    .describe("Radial: centro en fraccion de la caja."),
  stops: z
    .array(z.object({ color, at: z.number().min(0).max(1) }))
    .min(2)
    .max(6),
});

const fade = z
  .enum(["top", "bottom", "left", "right", "radial"])
  .describe("Funde la capa a transparente hacia ese borde (radial: hacia afuera).");

const textLayer = z
  .object({
    type: z.literal("text"),
    ...box,
    w: z.number().min(1).max(4000).describe("Ancho de la caja; el texto corta linea ahi."),
    role: z.string().max(40).optional().describe("Rol tipografico del kit; completa los valores que no se pasen."),
    field: z.string().regex(FIELD).optional().describe("Toma el texto de content: title, subtitle, body, cta o points.N."),
    text: text(2000)
      .optional()
      .describe(
        "Texto fijo si no hay field. Saltos de linea con \\n; [[asi]] va en el color de resaltado. Marcas: [[asi|outline]] calado, [[asi|box]] caja de seleccion con su medida, [[asi|blur]] lupa desenfocada.",
      ),
    size: z.number().min(8).max(600).optional(),
    weight: z.union([z.literal(300), z.literal(400), z.literal(500), z.literal(600)]).optional(),
    font: z.enum(FONT_KEYS).optional(),
    color: color.optional(),
    align: z.enum(["left", "center", "right"]).optional(),
    lineHeight: z.number().min(0.6).max(3).optional(),
    tracking: z.number().min(-0.2).max(0.5).optional().describe("Letter spacing en em."),
    uppercase: z.boolean().optional(),
    highlight: color.optional().describe("Color de lo marcado con [[...]] en el texto. Por defecto, el resaltado del kit."),
  })
  .refine((layer) => layer.field !== undefined || layer.text !== undefined, {
    message: "Una capa de texto necesita field o text.",
  });

const imageLayer = z.object({
  type: z.literal("image"),
  ...box,
  w: z.number().min(1).max(4000),
  h: z.number().min(1).max(4000),
  src: z
    .string()
    .trim()
    .max(600)
    .describe("URL publica de list_assets o ruta de /public (logos y capturas del kit)."),
  fit: z.enum(["cover", "contain"]).default("cover"),
  position: z
    .enum(["center", "top", "bottom", "left", "right"])
    .default("center")
    .describe("Que parte de la imagen se conserva al recortar con cover."),
  radius: z.number().min(0).max(2000).default(0),
  bleed: z.boolean().optional().describe("Sale a proposito por el borde; el lint no le exige margen."),
  crop: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      w: z.number().min(0.01).max(1),
      h: z.number().min(0.01).max(1),
    })
    .optional()
    .describe("Recorta un pedazo de la imagen original (en fraccion) antes de encajarla: un fragmento de interfaz."),
  shadow: shadow.optional(),
  blur: z.number().min(0).max(40).optional().describe("Desenfoque en px: profundidad de campo para lo que queda atras."),
  motionBlur: z.number().min(0).max(120).optional().describe("Desenfoque de movimiento horizontal en px."),
  brightness: z.number().min(0).max(2).optional().describe("1 = original. Solo luz y color: nunca cambia el contenido."),
  saturation: z.number().min(0).max(2).optional(),
  fade: fade.optional(),
  device: z
    .enum(["browser", "phone"])
    .optional()
    .describe("Monta una captura cruda en un navegador o un telefono dibujados; w/h son los del marco y la captura llena la pantalla."),
});

const rectLayer = z.object({
  type: z.literal("rect"),
  ...box,
  w: z.number().min(1).max(4000),
  h: z.number().min(1).max(4000),
  color: color.default("$surface"),
  gradient: gradient.optional().describe("Relleno degradado; reemplaza a color."),
  radius: z.number().min(0).max(2000).default(0),
  stroke: color.optional(),
  strokeWidth: z.number().min(0).max(40).optional(),
  shadow: shadow.optional(),
  glass: z
    .boolean()
    .optional()
    .describe("Vidrio: desenfoca lo que tiene atras (fondo e imagenes) y lo tiñe con color o gradient. Sin rotacion."),
});

const GRAPHIC_KINDS = ["rings", "sparkles", "cells", "bars", "dots", "lines", "grid", "glow"] as const;

const graphicLayer = z
  .object({
    type: z.literal("graphic"),
    ...box,
    w: z.number().min(1).max(4000),
    h: z.number().min(1).max(4000),
    kind: z
      .enum(GRAPHIC_KINDS)
      .describe(
        "rings: circulos concentricos. sparkles: destellos. cells: grilla de celdas (lit las enciende). bars: barras (values 0-1). dots: nube de puntos por columnas. lines: lineas verticales. grid: grilla de puntos. glow: halo de luz.",
      ),
    color: color.default("$foreground").describe("Color base (las celdas y barras apagadas usan $assets si no hay muted)."),
    accent: color.optional().describe("Color de lo encendido (celdas lit, barras altas, puntos destacados)."),
    muted: color.optional(),
    count: z.number().int().min(1).max(400).optional().describe("rings, sparkles, lines: cuantos. dots: columnas."),
    cols: z.number().int().min(1).max(40).optional(),
    rows: z.number().int().min(1).max(200).optional().describe("cells: filas. dots: puntos por columna."),
    lit: z.array(z.number().int().min(0).max(1600)).max(200).optional().describe("cells: indices encendidos (fila por fila)."),
    values: z.array(z.number().min(0).max(1)).max(80).optional().describe("bars: alto de cada barra, sin escala ni numeros."),
    spacing: z.number().min(4).max(400).optional(),
    size: z.number().min(1).max(200).optional(),
    seed: z.number().int().min(0).max(100000).optional().describe("Cambia la distribucion de dots y sparkles."),
    strength: z.number().min(0).max(1).optional().describe("Opacidad general del grafico."),
  })
  .describe("Grafico generado por codigo: metaforas visuales sin datos inventados, texturas y luz.");

export const layerSchema = z.union([textLayer, imageLayer, rectLayer, graphicLayer]);

const backdrop = z
  .object({
    image: z
      .object({
        src: z.string().trim().max(600),
        position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
        blur: z.number().min(0).max(80).optional(),
        motionBlur: z.number().min(0).max(160).optional(),
        brightness: z.number().min(0).max(2).optional(),
        saturation: z.number().min(0).max(2).optional(),
      })
      .optional()
      .describe("Foto de fondo a sangre."),
    gradient: gradient.optional().describe("Velo o degradado sobre el fondo y la foto."),
    glows: z
      .array(
        z.object({
          x: z.number(),
          y: z.number(),
          r: z.number().min(10).max(2000),
          color: color.default("$accent"),
          opacity: z.number().min(0).max(1).default(0.2),
        }),
      )
      .max(4)
      .optional()
      .describe("Focos de luz: centro y radio en px del lienzo."),
    grain: z.number().min(0).max(1).optional().describe("Grano de pelicula; 0.2-0.4 se lee como material."),
  })
  .describe("Fondo compuesto: se arma en una sola imagen debajo de las capas.");

export const slideSchema = z.object({
  background: color.optional().describe("Por defecto, el fondo del kit."),
  backdrop: backdrop.optional(),
  light: z
    .enum(["top-left", "top", "top-right"])
    .optional()
    .describe("De donde viene la luz; las sombras caen al lado contrario. Por defecto, top."),
  layers: z.array(layerSchema).max(40).default([]),
});

export const designSchema = z.object({
  slides: z.array(slideSchema).max(10).default([]),
});

export const postStatusSchema = z.enum(["idea", "borrador", "listo", "rechazado"]);
export const postFormatSchema = z.enum(POST_FORMAT_NAMES);
export const brandSchema = z.enum(BRAND_IDS);
export const editorSchema = z.enum(["panel", "claude"]);

const idea = z.string().trim().max(4000);
const reviewNote = z.string().trim().max(1000).describe("Por que se aprobo o rechazo; Claude lo lee como ejemplo.");

export const createPostSchema = z.object({
  brand: brandSchema.default("portfolio"),
  idea: idea.default(""),
  format: postFormatSchema.default("portrait").describe("Formato principal."),
  content: contentSchema.default(EMPTY_CONTENT),
  designs: z.partialRecord(postFormatSchema, designSchema).default({}),
  status: postStatusSchema.optional(),
  scheduledAt: z.iso.datetime({ offset: true }).nullable().optional(),
});

// Sin defaults: un PATCH parcial no pisa lo que no manda. content se mezcla
// campo por campo; designs se reemplaza por formato (null borra ese formato).
export const updatePostSchema = z.object({
  brand: brandSchema.optional(),
  idea: idea.optional(),
  format: postFormatSchema.optional(),
  content: contentPatchSchema.optional(),
  designs: z.partialRecord(postFormatSchema, designSchema.nullable()).optional(),
  status: postStatusSchema.optional(),
  reviewNote: reviewNote.optional(),
  scheduledAt: z.iso.datetime({ offset: true }).nullable().optional(),
});

export type Content = typeof EMPTY_CONTENT;
export type ContentField = (typeof CONTENT_FIELDS)[number];
export type Layer = z.infer<typeof layerSchema>;
export type TextLayer = Extract<Layer, { type: "text" }>;
export type ImageLayer = Extract<Layer, { type: "image" }>;
export type RectLayer = Extract<Layer, { type: "rect" }>;
export type GraphicLayer = Extract<Layer, { type: "graphic" }>;
export type Shadow = z.infer<typeof shadow>;
export type Gradient = z.infer<typeof gradient>;
export type Backdrop = z.infer<typeof backdrop>;
export type Slide = z.infer<typeof slideSchema>;
export type Design = z.infer<typeof designSchema>;
export type Designs = Partial<Record<z.infer<typeof postFormatSchema>, Design>>;
export type PostStatus = z.infer<typeof postStatusSchema>;
export type Editor = z.infer<typeof editorSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
