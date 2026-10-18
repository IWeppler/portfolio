import { supabaseRest } from "@/lib/supabase/rest";
import type { PostFormat } from "./formats";
import { getKit, type BrandId } from "./kits";
import { lintDesigns, type LintIssue } from "./lint";
import { designedFormats, postLabel } from "./post-utils";
import {
  EMPTY_CONTENT,
  type Content,
  type CreatePostInput,
  type Designs,
  type Editor,
  type PostStatus,
  type UpdatePostInput,
} from "./schema";

// Acceso a content_posts y su historial. Lo usan tanto las rutas del panel
// como el MCP; cada uno valida su propia autenticacion antes de llamar aca.

export type ContentPost = {
  id: string;
  brand: BrandId;
  idea: string;
  format: PostFormat;
  status: PostStatus;
  reviewNote: string;
  content: Content;
  designs: Designs;
  scheduledAt: string | null;
  editedBy: Editor;
  createdAt: string;
  updatedAt: string;
  issues: LintIssue[];
};

export type PostVersion = {
  id: string;
  content: Content;
  designs: Designs;
  format: PostFormat;
  status: PostStatus;
  editedBy: Editor;
  createdAt: string;
};

type PostRow = {
  id: string;
  brand: BrandId;
  idea: string;
  format: PostFormat;
  status: PostStatus;
  review_note: string;
  content: Partial<Content> | null;
  designs: Designs | null;
  scheduled_at: string | null;
  edited_by: Editor;
  created_at: string;
  updated_at: string;
};

type VersionRow = {
  id: string;
  content: Partial<Content> | null;
  designs: Designs | null;
  format: PostFormat;
  status: PostStatus;
  edited_by: Editor;
  created_at: string;
};

const SELECT =
  "id,brand,idea,format,status,review_note,content,designs,scheduled_at,edited_by,created_at,updated_at";

function toPost(row: PostRow): ContentPost {
  const content = { ...EMPTY_CONTENT, ...row.content };
  const designs = row.designs ?? {};

  return {
    id: row.id,
    brand: row.brand,
    idea: row.idea,
    format: row.format,
    status: row.status,
    reviewNote: row.review_note,
    content,
    designs,
    scheduledAt: row.scheduled_at,
    editedBy: row.edited_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    issues: lintDesigns(getKit(row.brand), designs, content),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPostId(id: string) {
  return UUID.test(id);
}

export async function listPosts(filter: { brand?: BrandId; status?: PostStatus } = {}) {
  const params = [
    filter.brand ? `&brand=eq.${filter.brand}` : "",
    filter.status ? `&status=eq.${filter.status}` : "",
  ].join("");
  const response = await supabaseRest(
    `content_posts?select=${SELECT}${params}&order=created_at.desc`,
    { method: "GET", cache: "no-store" },
  );

  return ((await response.json()) as PostRow[]).map(toPost);
}

export async function getPost(id: string) {
  if (!isPostId(id)) return null;

  const response = await supabaseRest(`content_posts?id=eq.${id}&select=${SELECT}`, {
    method: "GET",
    cache: "no-store",
  });
  const [row] = (await response.json()) as PostRow[];

  return row ? toPost(row) : null;
}

export async function createPost(input: CreatePostInput, editor: Editor) {
  const hasSlides = Object.values(input.designs).some((design) => (design?.slides.length ?? 0) > 0);
  const response = await supabaseRest(`content_posts?select=${SELECT}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      brand: input.brand,
      idea: input.idea,
      format: input.format,
      content: input.content,
      designs: input.designs,
      scheduled_at: input.scheduledAt ?? null,
      // Sin slides es una idea esperando diseño; con slides ya es borrador.
      status: input.status ?? (hasSlides ? "borrador" : "idea"),
      edited_by: editor,
    }),
  });
  const [row] = (await response.json()) as PostRow[];

  return toPost(row);
}

async function writePost(id: string, body: Record<string, unknown>) {
  const response = await supabaseRest(`content_posts?id=eq.${id}&select=${SELECT}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const [row] = (await response.json()) as PostRow[];

  return row ? toPost(row) : null;
}

export async function updatePost(id: string, patch: UpdatePostInput, editor: Editor) {
  const current = await getPost(id);
  if (!current) return null;

  const body: Record<string, unknown> = { edited_by: editor };
  if (patch.brand !== undefined) body.brand = patch.brand;
  if (patch.idea !== undefined) body.idea = patch.idea;
  if (patch.format !== undefined) body.format = patch.format;
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.reviewNote !== undefined) body.review_note = patch.reviewNote;
  if (patch.scheduledAt !== undefined) body.scheduled_at = patch.scheduledAt;
  if (patch.content) body.content = { ...current.content, ...patch.content };
  if (patch.designs) {
    const designs: Designs = { ...current.designs };
    for (const [format, design] of Object.entries(patch.designs) as [PostFormat, Designs[PostFormat] | null][]) {
      if (design === null) delete designs[format];
      else designs[format] = design;
    }
    body.designs = designs;
  }

  return writePost(id, body);
}

export async function deletePost(id: string) {
  if (!isPostId(id)) return false;

  const response = await supabaseRest(`content_posts?id=eq.${id}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" },
  });
  const rows = (await response.json()) as PostRow[];

  return rows.length > 0;
}

export async function listVersions(postId: string): Promise<PostVersion[]> {
  if (!isPostId(postId)) return [];

  const response = await supabaseRest(
    `content_post_versions?post_id=eq.${postId}&select=id,content,designs,format,status,edited_by,created_at&order=created_at.desc&limit=50`,
    { method: "GET", cache: "no-store" },
  );

  return ((await response.json()) as VersionRow[]).map((row) => ({
    id: row.id,
    content: { ...EMPTY_CONTENT, ...row.content },
    designs: row.designs ?? {},
    format: row.format,
    status: row.status,
    editedBy: row.edited_by,
    createdAt: row.created_at,
  }));
}

/** Vuelve a una version. El estado actual queda guardado como otra version, asi que se puede deshacer. */
export async function restoreVersion(postId: string, versionId: string, editor: Editor) {
  if (!isPostId(postId) || !isPostId(versionId)) return null;

  const response = await supabaseRest(
    `content_post_versions?id=eq.${versionId}&post_id=eq.${postId}&select=content,designs,format`,
    { method: "GET", cache: "no-store" },
  );
  const [version] = (await response.json()) as Pick<VersionRow, "content" | "designs" | "format">[];
  if (!version) return null;

  return writePost(postId, {
    content: version.content ?? {},
    designs: version.designs ?? {},
    format: version.format,
    edited_by: editor,
  });
}

/** Piezas revisadas de una marca, para que Claude aprenda que gusta y que no. */
export async function listReviewedExamples(brand: BrandId) {
  const response = await supabaseRest(
    `content_posts?brand=eq.${brand}&status=in.(listo,rechazado)&select=${SELECT}&order=updated_at.desc&limit=12`,
    { method: "GET", cache: "no-store" },
  );

  return ((await response.json()) as PostRow[]).map(toPost).map((post) => ({
    id: post.id,
    title: postLabel(post),
    status: post.status,
    reviewNote: post.reviewNote,
    formats: designedFormats(post),
  }));
}
