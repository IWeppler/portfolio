import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import { supabaseRest } from "@/lib/supabase/rest";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const LEAD_STATUSES = [
  "nuevo",
  "contactado",
  "propuesta_enviada",
  "ganado",
  "perdido",
] as const;

const leadFields = {
  name: z.string().trim().min(1).max(200),
  company: z.preprocess(emptyStringToUndefined, z.string().trim().max(200).optional()),
  email: z.preprocess(emptyStringToUndefined, z.email().trim().max(200).optional()),
  whatsapp: z.preprocess(emptyStringToUndefined, z.string().trim().max(50).optional()),
  budgetEstimate: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().nonnegative().optional()
  ),
  source: z.string().trim().min(1).max(80).default("Otro"),
  industry: z.preprocess(emptyStringToUndefined, z.string().trim().max(80).optional()),
  status: z.enum(LEAD_STATUSES).default("nuevo"),
  notes: z.preprocess(emptyStringToUndefined, z.string().trim().max(4000).optional()),
};

const createLeadSchema = z.object(leadFields);

// `.partial()` no elimina los `.default()`: con el schema completo, un PATCH de
// solo `status` reescribiria tambien `source` a 'Otro'. Por eso cada campo se
// declara optional a mano.
const updateLeadSchema = z.object({
  name: leadFields.name.optional(),
  company: leadFields.company,
  email: leadFields.email,
  whatsapp: leadFields.whatsapp,
  budgetEstimate: leadFields.budgetEstimate,
  source: z.string().trim().min(1).max(80).optional(),
  industry: leadFields.industry,
  status: z.enum(LEAD_STATUSES).optional(),
  notes: leadFields.notes,
});

// La columna del nombre en la DB es "nombre" (viene del formulario publico).
// La API expone "name" y traduce en los dos sentidos.
const LEAD_SELECT =
  "id,name:nombre,company,email,whatsapp,budget_estimate,source,industry,status,notes,last_contact_at,created_at";

function toDbPayload(payload: Record<string, unknown>, provided: Set<string>) {
  const body: Record<string, unknown> = {};

  if (provided.has("name")) body.nombre = payload.name;
  if (provided.has("company")) body.company = payload.company ?? null;
  if (provided.has("email")) body.email = payload.email ?? null;
  if (provided.has("whatsapp")) body.whatsapp = payload.whatsapp ?? null;
  if (provided.has("budgetEstimate")) body.budget_estimate = payload.budgetEstimate ?? null;
  if (provided.has("source")) body.source = payload.source;
  if (provided.has("industry")) body.industry = payload.industry ?? null;
  if (provided.has("status")) body.status = payload.status;
  if (provided.has("notes")) body.notes = payload.notes ?? null;

  return body;
}

const LEAD_FIELD_NAMES = Object.keys(leadFields);

async function createLead(payload: z.infer<typeof createLeadSchema>) {
  const response = await supabaseRest(`leads?select=${LEAD_SELECT}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(toDbPayload(payload, new Set(LEAD_FIELD_NAMES))),
  });

  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

async function updateLead(
  id: string,
  payload: z.infer<typeof updateLeadSchema>,
  provided: Set<string>
) {
  const body = toDbPayload(payload, provided);

  if (provided.has("status")) {
    body.last_contact_at = new Date().toISOString();
  }

  const response = await supabaseRest(
    `leads?id=eq.${encodeURIComponent(id)}&select=${LEAD_SELECT}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const response = await supabaseRest(`leads?select=${LEAD_SELECT}&order=created_at.desc`);
    const leads = await response.json();

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("leads: failed to load leads", error);

    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = createLeadSchema.parse(body);
    const lead = await createLead(payload);

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_payload", issues: error.issues }, { status: 400 });
    }

    console.error("leads: failed to create lead", error);

    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...rest } = body as { id?: string };

    if (typeof id !== "string" || id.trim() === "") {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    const payload = updateLeadSchema.parse(rest);
    const provided = new Set(Object.keys(rest as Record<string, unknown>));
    const lead = await updateLead(id, payload, provided);

    return NextResponse.json({ lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_payload", issues: error.issues }, { status: 400 });
    }

    console.error("leads: failed to update lead", error);

    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    await supabaseRest(`leads?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("leads: failed to delete lead", error);

    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
