import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { deleteStorageObject, uploadStorageObject } from "@/lib/supabase/project-storage";
import { supabaseRest } from "@/lib/supabase/rest";
import type { BrandId } from "./kits";
import { brandSchema } from "./schema";

// Biblioteca del modulo Content: referencias (inspiracion, con una nota de que
// tomar) y recursos (imagenes que van dentro de las piezas). Cada recurso es
// de una marca o global (texturas, objetos, iconos, marcos de dispositivo que
// sirven para todas). Las capturas, logos e identidad quedan en su marca.

export const libraryKindSchema = z.enum(["referencia", "recurso"]);

export const ASSET_CATEGORIES = [
  "capture",
  "mockup",
  "device-frame",
  "logo",
  "icon",
  "illustration",
  "object3d",
  "texture",
  "background",
  "photo",
  "other",
] as const;
export const assetCategorySchema = z
  .enum(ASSET_CATEGORIES)
  .describe(
    "capture: interfaz real cruda (sin mockup). mockup: presentacion en un dispositivo o escena. object3d: render recortado. texture/background: fondos. photo: foto real.",
  );

export const assetOriginSchema = z
  .enum(["real", "own", "procedural", "stock", "ai"])
  .describe("real: captura o foto de algo que existe. own: diseño propio. procedural: generado por codigo. stock / ai: de un banco o generado.");

export const viewportSchema = z.enum(["mobile", "tablet", "desktop"]);

/** global = todas las marcas; si no, la marca dueña del recurso. */
export const scopeSchema = z.union([z.literal("global"), brandSchema]);

const tags = z.array(z.string().trim().min(1).max(40)).max(12);
const sourceUrl = z.union([z.literal(""), z.string().trim().url().max(600)]);

export const libraryFieldsSchema = z.object({
  scope: scopeSchema,
  kind: libraryKindSchema,
  title: z.string().trim().max(160).default(""),
  note: z
    .string()
    .trim()
    .max(1500)
    .default("")
    .describe("Referencia: que tomar de ella. Recurso: que se ve, para elegirlo bien."),
  sourceUrl: sourceUrl.default(""),
  tags: tags.default([]),
  category: assetCategorySchema.default("other"),
  origin: assetOriginSchema.default("own"),
  viewport: viewportSchema.nullable().default(null),
  projectSlug: z.string().trim().max(120).default("").describe("Proyecto del portfolio al que pertenece (capturas y mockups)."),
  demoData: z.boolean().default(false).describe("Muestra cifras, precios o testimonios inventados de una demo: usar como interfaz, nunca como dato."),
  aiPrompt: z.string().trim().max(2000).default(""),
});

export const libraryPatchSchema = z.object({
  scope: scopeSchema.optional(),
  kind: libraryKindSchema.optional(),
  title: z.string().trim().max(160).optional(),
  note: z.string().trim().max(1500).optional(),
  sourceUrl: sourceUrl.optional(),
  tags: tags.optional(),
  category: assetCategorySchema.optional(),
  origin: assetOriginSchema.optional(),
  viewport: viewportSchema.nullable().optional(),
  projectSlug: z.string().trim().max(120).optional(),
  demoData: z.boolean().optional(),
  aiPrompt: z.string().trim().max(2000).optional(),
});

export type LibraryKind = z.infer<typeof libraryKindSchema>;
export type AssetCategory = z.infer<typeof assetCategorySchema>;
export type AssetOrigin = z.infer<typeof assetOriginSchema>;
export type Viewport = z.infer<typeof viewportSchema>;
export type Scope = z.infer<typeof scopeSchema>;
export type LibraryFields = z.infer<typeof libraryFieldsSchema>;
export type LibraryPatch = z.infer<typeof libraryPatchSchema>;

export type LibraryItem = {
  id: string;
  scope: Scope;
  kind: LibraryKind;
  url: string;
  width: number;
  height: number;
  title: string;
  note: string;
  sourceUrl: string;
  tags: string[];
  category: AssetCategory;
  origin: AssetOrigin;
  viewport: Viewport | null;
  projectSlug: string;
  hasAlpha: boolean;
  dominantColor: string;
  demoData: boolean;
  aiPrompt: string;
  /** false si describe un archivo que vive en otro lado (una imagen de proyecto). */
  stored: boolean;
  createdAt: string;
};

type LibraryRow = {
  id: string;
  brand: BrandId | null;
  kind: LibraryKind;
  url: string;
  storage_path: string | null;
  width: number;
  height: number;
  title: string;
  note: string;
  source_url: string;
  tags: string[] | null;
  category: AssetCategory;
  origin: AssetOrigin;
  viewport: Viewport | null;
  project_slug: string | null;
  has_alpha: boolean;
  dominant_color: string;
  demo_data: boolean;
  ai_prompt: string;
  created_at: string;
};

const SELECT =
  "id,brand,kind,url,storage_path,width,height,title,note,source_url,tags,category,origin,viewport,project_slug,has_alpha,dominant_color,demo_data,ai_prompt,created_at";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
// Lado mayor con el que se guarda: alcanza para usarla a pantalla completa en 2K.
// Las capturas de celular a 3x miden 2532 de alto: entran casi enteras.
const STORED_MAX_SIDE = 2600;

function toItem(row: LibraryRow): LibraryItem {
  return {
    id: row.id,
    scope: row.brand ?? "global",
    kind: row.kind,
    url: row.url,
    width: row.width,
    height: row.height,
    title: row.title,
    note: row.note,
    sourceUrl: row.source_url,
    tags: row.tags ?? [],
    category: row.category,
    origin: row.origin,
    viewport: row.viewport,
    projectSlug: row.project_slug ?? "",
    hasAlpha: row.has_alpha,
    dominantColor: row.dominant_color,
    demoData: row.demo_data,
    aiPrompt: row.ai_prompt,
    stored: Boolean(row.storage_path),
    createdAt: row.created_at,
  };
}

/** Un pedido bien formado que rompe una regla del catalogo: las rutas lo devuelven como 400. */
export class LibraryRuleError extends Error {}

/** Reglas que no son de forma sino de criterio; las mismas en el panel y en el MCP. */
export function checkFields(fields: Partial<Pick<LibraryFields, "scope" | "category" | "origin" | "kind">>) {
  if (fields.category === "capture" && fields.origin && fields.origin !== "real") {
    throw new LibraryRuleError("Una captura es interfaz real: origin tiene que ser real.");
  }
  if (fields.kind === "recurso" && fields.scope === "global" && fields.category === "logo") {
    throw new LibraryRuleError("Un logo es identidad de una marca: no puede ser global.");
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listLibrary(
  filter: { brand?: BrandId; kind?: LibraryKind; category?: AssetCategory; ids?: string[]; urls?: string[]; includeGlobal?: boolean } = {},
) {
  const ids = filter.ids?.filter((id) => UUID.test(id));
  if (ids && ids.length === 0) return [];

  const brand = filter.brand
    ? filter.includeGlobal === false
      ? `&brand=eq.${filter.brand}`
      : `&or=(brand.eq.${filter.brand},brand.is.null)`
    : "";
  const urls = filter.urls?.length ? `&url=in.(${filter.urls.map((url) => `"${url.replace(/"/g, "")}"`).join(",")})` : "";
  const params = [
    brand,
    filter.kind ? `&kind=eq.${filter.kind}` : "",
    filter.category ? `&category=eq.${filter.category}` : "",
    ids ? `&id=in.(${ids.join(",")})` : "",
    urls,
  ].join("");

  const response = await supabaseRest(`content_library?select=${SELECT}${params}&order=created_at.desc`, {
    method: "GET",
    cache: "no-store",
  });

  return ((await response.json()) as LibraryRow[]).map(toItem);
}

/** Medidas, transparencia y color dominante, para buscar sin abrir la imagen. */
async function describeImage(image: Buffer) {
  const [{ width = 0, height = 0 }, stats] = await Promise.all([sharp(image).metadata(), sharp(image).stats()]);
  const { r, g, b } = stats.dominant;
  return {
    width,
    height,
    hasAlpha: !stats.isOpaque,
    dominantColor: `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`,
  };
}

function rowFields(fields: LibraryFields) {
  return {
    brand: fields.scope === "global" ? null : fields.scope,
    kind: fields.kind,
    title: fields.title,
    note: fields.note,
    source_url: fields.sourceUrl,
    tags: fields.tags,
    category: fields.category,
    origin: fields.origin,
    viewport: fields.viewport,
    project_slug: fields.projectSlug || null,
    demo_data: fields.demoData,
    ai_prompt: fields.aiPrompt,
  };
}

/**
 * Normaliza la imagen (orientacion, lado mayor de 2600, webp) y la guarda.
 * Las capturas de pantalla suelen venir en PNG de varios MB.
 */
export async function addLibraryItem(image: Buffer, fields: LibraryFields) {
  checkFields(fields);
  const { data } = await sharp(image)
    .rotate()
    .resize(STORED_MAX_SIDE, STORED_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    // Las capturas tienen texto chico: calidad alta para que no se ensucie.
    .webp({ quality: fields.category === "capture" ? 92 : 86 })
    .toBuffer({ resolveWithObject: true });
  const described = await describeImage(data);

  const folder = fields.scope === "global" ? "global" : fields.scope;
  const storagePath = `content/${folder}/${crypto.randomUUID()}.webp`;
  const url = await uploadStorageObject(storagePath, data, "image/webp");

  try {
    const response = await supabaseRest(`content_library?select=${SELECT}`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        ...rowFields(fields),
        url,
        storage_path: storagePath,
        width: described.width,
        height: described.height,
        has_alpha: described.hasAlpha,
        dominant_color: described.dominantColor,
      }),
    });
    const [row] = (await response.json()) as LibraryRow[];
    return toItem(row);
  } catch (error) {
    // Sin fila no tiene sentido dejar el archivo huerfano.
    await deleteStorageObject(storagePath).catch(() => {});
    throw error;
  }
}

/** Solo URLs del Storage propio: son las unicas que el render acepta. */
function isOwnStorage(url: string) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    return !!supabase && new URL(url).host === new URL(supabase).host && url.includes("/storage/v1/object/public/");
  } catch {
    return false;
  }
}

/**
 * Describe en la biblioteca una imagen que ya esta en Storage (las de los
 * proyectos del portfolio) sin copiarla. Si ya estaba descripta, la pisa.
 */
export async function registerExisting(url: string, fields: LibraryFields) {
  checkFields(fields);
  if (!isOwnStorage(url)) throw new Error("Solo se pueden describir imagenes del Storage propio; las demas se suben.");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`No se pudo leer ${url}: ${response.status}`);
  const described = await describeImage(Buffer.from(await response.arrayBuffer()));

  const saved = await supabaseRest(`content_library?on_conflict=url&select=${SELECT}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      ...rowFields(fields),
      url,
      storage_path: null,
      width: described.width,
      height: described.height,
      has_alpha: described.hasAlpha,
      dominant_color: described.dominantColor,
    }),
  });
  const [row] = (await saved.json()) as LibraryRow[];
  return toItem(row);
}

/** Baja una imagen publica (para cargar referencias desde el chat por URL). */
export async function fetchImage(source: string) {
  const url = new URL(source);
  if (url.protocol !== "https:") throw new Error("Solo URLs https.");
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/.test(url.hostname)) {
    throw new Error("Host no permitido.");
  }

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`No se pudo bajar la imagen: ${response.status}`);
  if (!response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error("La URL no devuelve una imagen (Instagram y Pinterest suelen pedir login: subir la captura).");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error("La imagen pesa mas de 15 MB.");
  return buffer;
}

export async function updateLibraryItem(id: string, patch: LibraryPatch) {
  if (!UUID.test(id)) return null;
  checkFields(patch);

  const body: Record<string, unknown> = {};
  if (patch.scope !== undefined) body.brand = patch.scope === "global" ? null : patch.scope;
  if (patch.kind !== undefined) body.kind = patch.kind;
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.note !== undefined) body.note = patch.note;
  if (patch.sourceUrl !== undefined) body.source_url = patch.sourceUrl;
  if (patch.tags !== undefined) body.tags = patch.tags;
  if (patch.category !== undefined) body.category = patch.category;
  if (patch.origin !== undefined) body.origin = patch.origin;
  if (patch.viewport !== undefined) body.viewport = patch.viewport;
  if (patch.projectSlug !== undefined) body.project_slug = patch.projectSlug || null;
  if (patch.demoData !== undefined) body.demo_data = patch.demoData;
  if (patch.aiPrompt !== undefined) body.ai_prompt = patch.aiPrompt;

  const response = await supabaseRest(`content_library?id=eq.${id}&select=${SELECT}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const [row] = (await response.json()) as LibraryRow[];

  return row ? toItem(row) : null;
}

export async function deleteLibraryItem(id: string) {
  if (!UUID.test(id)) return false;

  const response = await supabaseRest(`content_library?id=eq.${id}&select=storage_path`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" },
  });
  const [row] = (await response.json()) as Pick<LibraryRow, "storage_path">[];
  if (!row) return false;

  // Una fila que solo describe una imagen de proyecto no es dueña del archivo.
  if (row.storage_path) await deleteStorageObject(row.storage_path);
  return true;
}

/** Version liviana para mostrarsela a Claude: lado mayor de 1024, jpeg. */
export async function previewForModel(item: Pick<LibraryItem, "url">) {
  let source: Buffer;
  if (item.url.startsWith("/")) {
    // Logos y capturas del kit, en /public.
    const relative = path.normalize(item.url).replace(/^[\\/]+/, "");
    if (relative.startsWith("..")) throw new Error(`Ruta invalida: ${item.url}`);
    source = await readFile(path.join(process.cwd(), "public", relative));
  } else {
    const response = await fetch(item.url, { cache: "force-cache" });
    if (!response.ok) throw new Error(`No se pudo leer ${item.url}: ${response.status}`);
    source = Buffer.from(await response.arrayBuffer());
  }

  const buffer = await sharp(source)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 80 })
    .toBuffer();

  return buffer.toString("base64");
}
