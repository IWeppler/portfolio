import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { getPost } from "@/lib/content/posts";
import { postLabel } from "@/lib/content/post-utils";
import { renderSlide } from "@/lib/content/render";
import { EXPORT_SCALE, POST_FORMATS } from "@/lib/content/formats";
import { getKit } from "@/lib/content/kits";
import { postFormatSchema } from "@/lib/content/schema";

// Node: sharp y la lectura de fuentes desde /assets.
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

// ?format=portrait&slide=0&scale=0.5|1|2&download=1. Sin scale sale en 2K
// (2160 de ancho); sin format, el principal.
export async function GET(request: NextRequest, { params }: Context) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams;
  const slideIndex = Math.max(0, Number.parseInt(search.get("slide") ?? "0", 10) || 0);
  const scale = [0.5, 1, EXPORT_SCALE].includes(Number(search.get("scale")))
    ? Number(search.get("scale"))
    : EXPORT_SCALE;

  try {
    const post = await getPost((await params).id);
    if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const parsedFormat = postFormatSchema.safeParse(search.get("format"));
    const format = parsedFormat.success ? parsedFormat.data : post.format;

    const image = await renderSlide({
      kit: getKit(post.brand),
      content: post.content,
      slide: post.designs[format]?.slides[slideIndex],
      format,
      scale,
    });
    const headers = new Headers(image.headers);
    // La URL del panel lleva ?v=updated_at, asi que cada version es inmutable.
    headers.set("Cache-Control", "private, max-age=31536000, immutable");

    if (search.get("download")) {
      const { width, height } = POST_FORMATS[format];
      const name =
        postLabel(post)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase()
          .slice(0, 60) || "post";
      headers.set(
        "Content-Disposition",
        `attachment; filename="${post.brand}-${name}-${format}-${slideIndex + 1}-${width * scale}x${height * scale}.png"`,
      );
    }

    return new Response(image.body, { status: 200, headers });
  } catch (error) {
    console.error("content: failed to render post", error);

    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }
}
