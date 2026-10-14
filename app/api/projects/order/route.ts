import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import { supabaseRest } from "@/lib/supabase/rest";

const itemSchema = z.object({
  id: z.string().uuid(),
  isPublished: z.boolean(),
});
const boardSchema = z
  .object({
    projects: z.array(itemSchema).max(1000),
    expected: z
      .array(itemSchema.extend({ order: z.number().int().nullable() }))
      .max(1000),
  })
  .superRefine((value, ctx) => {
    const ids = new Set(value.projects.map((project) => project.id));
    const expectedIds = new Set(value.expected.map((project) => project.id));
    if (
      ids.size !== value.projects.length ||
      expectedIds.size !== value.expected.length ||
      ids.size !== expectedIds.size ||
      [...ids].some((id) => !expectedIds.has(id))
    ) {
      ctx.addIssue({
        code: "custom",
        message: "El tablero debe incluir cada proyecto una sola vez.",
      });
    }
  });

export async function PATCH(request: NextRequest) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = boardSchema.parse(await request.json());
    await supabaseRest("rpc/save_projects_board", {
      method: "POST",
      body: JSON.stringify({
        board: payload.projects,
        expected: payload.expected,
      }),
    });
    revalidateTag("projects", { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("board_conflict")) {
      return NextResponse.json({ error: "board_conflict" }, { status: 409 });
    }
    console.error("projects: failed to save board", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
