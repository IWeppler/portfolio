import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import { hasMcpToken } from "@/lib/content/mcp-auth";
import {
  LibraryRuleError,
  MAX_UPLOAD_BYTES,
  addLibraryItem,
  libraryFieldsSchema,
  libraryKindSchema,
  listLibrary,
} from "@/lib/content/library";
import { brandSchema } from "@/lib/content/schema";

// Node: sharp normaliza cada imagen antes de guardarla.
export const runtime = "nodejs";

// Panel (sesion) o Claude Code (token del MCP, para subir archivos locales con curl).
async function allowed(request: NextRequest) {
  return hasMcpToken(request) || Boolean(await getSessionUser());
}

// ?brand=portfolio&kind=referencia
export async function GET(request: NextRequest) {
  if (!(await allowed(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams;
  const brand = brandSchema.safeParse(search.get("brand"));
  const kind = libraryKindSchema.safeParse(search.get("kind"));

  try {
    const items = await listLibrary({
      brand: brand.success ? brand.data : undefined,
      kind: kind.success ? kind.data : undefined,
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("content/library: failed to load", error);

    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

// multipart: file + scope (global o marca; brand tambien vale), kind, title,
// note, sourceUrl, tags (separados por coma), category, origin, viewport,
// projectSlug, demoData (true), aiPrompt.
export async function POST(request: NextRequest) {
  if (!(await allowed(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "missing_file" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }

    const text = (key: string) => String(form.get(key) ?? "");
    const optional = (key: string) => text(key) || undefined;
    const fields = libraryFieldsSchema.parse({
      scope: text("scope") || text("brand"),
      kind: text("kind"),
      title: text("title"),
      note: text("note"),
      sourceUrl: text("sourceUrl"),
      tags: text("tags")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      category: optional("category"),
      origin: optional("origin"),
      viewport: optional("viewport") ?? null,
      projectSlug: text("projectSlug"),
      demoData: text("demoData") === "true",
      aiPrompt: text("aiPrompt"),
    });

    const item = await addLibraryItem(Buffer.from(await file.arrayBuffer()), fields);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_payload", issues: error.issues }, { status: 400 });
    }
    if (error instanceof LibraryRuleError) {
      return NextResponse.json({ error: "invalid_payload", message: error.message }, { status: 400 });
    }
    console.error("content/library: failed to upload", error);

    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
