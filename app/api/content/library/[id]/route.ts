import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import { LibraryRuleError, deleteLibraryItem, libraryPatchSchema, updateLibraryItem } from "@/lib/content/library";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const patch = libraryPatchSchema.parse(await request.json());
    const item = await updateLibraryItem((await params).id, patch);
    if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_payload", issues: error.issues }, { status: 400 });
    }
    if (error instanceof LibraryRuleError) {
      return NextResponse.json({ error: "invalid_payload", message: error.message }, { status: 400 });
    }
    console.error("content/library: failed to update", error);

    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await deleteLibraryItem((await params).id);
    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("content/library: failed to delete", error);

    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
