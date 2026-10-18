import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import { createPost, listPosts } from "@/lib/content/posts";
import { brandSchema, createPostSchema } from "@/lib/content/schema";

// ?brand=portfolio filtra por marca.
export async function GET(request: NextRequest) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const brand = brandSchema.safeParse(request.nextUrl.searchParams.get("brand"));

  try {
    return NextResponse.json({ posts: await listPosts({ brand: brand.success ? brand.data : undefined }) });
  } catch (error) {
    console.error("content: failed to load posts", error);

    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const input = createPostSchema.parse(await request.json());

    return NextResponse.json({ post: await createPost(input, "panel") }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_payload", issues: error.issues }, { status: 400 });
    }
    console.error("content: failed to create post", error);

    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
