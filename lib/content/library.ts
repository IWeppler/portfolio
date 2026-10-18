import sharp from "sharp";
import { z } from "zod";
import { deleteStorageObject, uploadStorageObject } from "@/lib/supabase/project-storage";
import { supabaseRest } from "@/lib/supabase/rest";
import type { BrandId } from "./kits";
import { brandSchema } from "./schema";

// Biblioteca del modulo Content: referencias (inspiracion, con una nota de que
// tomar) y recursos (imagenes que van dentro de las piezas), por marca.

export const libraryKindSchema = z.enum(["referencia", "recurso"]);

const tags = z.array(z.string().trim().min(1).max(40)).max(12);

export const libraryFieldsSchema = z.object({
  brand: brandSchema,
  kind: libraryKindSchema,
  title: z.string().trim().max(160).default(""),
  note: z
    .string()
    .trim()
    .max(1500)
    .default("")
    .describe("Referencia: que tomar de ella. Recurso: que se ve, para elegirlo bien."),
  sourceUrl: z.union([z.literal(""), z.string().trim().url().max(600)]).default(""),
  tags: tags.default([]),
});

export const libraryPatchSchema = z.object({
  kind: libraryKindSchema.optional(),
  title: z.string().trim().max(160).optional(),
  note: z.string().trim().max(1500).optional(),
  sourceUrl: z.union([z.literal(""), z.string().trim().url().max(600)]).optional(),
  tags: tags.optional(),
});

export type LibraryKind = z.infer<typeof libraryKindSchema>;
export type LibraryFields = z.infer<typeof libraryFieldsSchema>;

export type LibraryItem = {
  id: string;
  brand: BrandId;
  kind: LibraryKind;
  url: string;
  width: number;
  height: number;
  title: string;
  note: string;
  sourceUrl: string;
  tags: string[];
  createdAt: string;
};

type LibraryRow = {
  id: string;
  brand: BrandId;
  kind: LibraryKind;
  url: string;
  storage_path: string;
  width: number;
  height: number;
  title: string;
  note: string;
  source_url: string;
  tags: string[] | null;
  created_at: string;
};

const SELECT = "id,brand,kind,url,storage_path,width,height,title,note,source_url,tags,created_at";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
// Lado mayor con el que se guarda: alcanza para usarla a pantalla completa en 2K.
const STORED_MAX_SIDE = 2400;

function toItem(row: LibraryRow): LibraryItem {
  return {
    id: row.id,
    brand: row.brand,
    kind: row.kind,
    url: row.url,
    width: row.width,
    height: row.height,
    title: row.title,
    note: row.note,
    sourceUrl: row.source_url,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listLibrary(filter: { brand?: BrandId; kind?: LibraryKind; ids?: string[] } = {}) {
  const ids = filter.ids?.filter((id) => UUID.test(id));
  const params = [
    filter.brand ? `&brand=eq.${filter.brand}` : "",
    filter.kind ? `&kind=eq.${filter.kind}` : "",
    ids ? `&id=in.(${ids.join(",")})` : "",
  ].join("");
  if (ids && ids.length === 0) return [];

  const response = await supabaseRest(`content_library?select=${SELECT}${params}&order=created_at.desc`, {
    method: "GET",
    cache: "no-store",
  });

  return ((await response.json()) as LibraryRow[]).map(toItem);
}

/**
 * Normaliza la imagen (orientacion, lado mayor de 2400, webp) y la guarda.
 * Las capturas de pantalla suelen venir en PNG de varios MB.
 */
export async function addLibraryItem(image: Buffer, fields: LibraryFields) {
  const { data, info } = await sharp(image)
    .rotate()
    .resize(STORED_MAX_SIDE, STORED_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer({ resolveWithObject: true });

  const storagePath = `content/${fields.brand}/${crypto.randomUUID()}.webp`;
  const url = await uploadStorageObject(storagePath, data, "image/webp");

  try {
    const response = await supabaseRest(`content_library?select=${SELECT}`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        brand: fields.brand,
        kind: fields.kind,
        url,
        storage_path: storagePath,
        width: info.width,
        height: info.height,
        title: fields.title,
        note: fields.note,
        source_url: fields.sourceUrl,
        tags: fields.tags,
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

export async function updateLibraryItem(id: string, patch: z.infer<typeof libraryPatchSchema>) {
  if (!UUID.test(id)) return null;

  const body: Record<string, unknown> = {};
  if (patch.kind !== undefined) body.kind = patch.kind;
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.note !== undefined) body.note = patch.note;
  if (patch.sourceUrl !== undefined) body.source_url = patch.sourceUrl;
  if (patch.tags !== undefined) body.tags = patch.tags;

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

  await deleteStorageObject(row.storage_path);
  return true;
}

/** Version liviana para mostrarsela a Claude: lado mayor de 1024, jpeg. */
export async function previewForModel(item: LibraryItem) {
  const response = await fetch(item.url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`No se pudo leer ${item.url}: ${response.status}`);

  const buffer = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 80 })
    .toBuffer();

  return buffer.toString("base64");
}
