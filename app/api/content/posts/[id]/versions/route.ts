import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import { listVersions, restoreVersion } from "@/lib/content/posts";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ versions: await listVersions((await params).id) });
  } catch (error) {
    console.error("content: failed to load versions", error);

    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

const restoreSchema = z.object({ versionId: z.string().uuid() });

// Vuelve a una version anterior; el estado actual queda en el historial.
export async function POST(request: NextRequest, { params }: Context) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { versionId } = restoreSchema.parse(await request.json());
    const post = await restoreVersion((await params).id, versionId, "panel");
    if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_payload", issues: error.issues }, { status: 400 });
    }
    console.error("content: failed to restore version", error);

    return NextResponse.json({ error: "restore_failed" }, { status: 500 });
  }
}
