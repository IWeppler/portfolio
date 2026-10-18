import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import { deletePost, getPost, updatePost } from "@/lib/content/posts";
import { updatePostSchema } from "@/lib/content/schema";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const post = await getPost((await params).id);
    if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("content: failed to load post", error);

    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const patch = updatePostSchema.parse(await request.json());
    const post = await updatePost((await params).id, patch, "panel");
    if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_payload", issues: error.issues }, { status: 400 });
    }
    console.error("content: failed to update post", error);

    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await deletePost((await params).id);
    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("content: failed to delete post", error);

    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
