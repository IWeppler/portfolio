import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const trackPayloadSchema = z.object({
  path: z.string().trim().min(1).max(2048),
  referrer: z.string().trim().max(2048).optional().default(""),
  // page_views.project_id es una FK a projects.id (uuid), no el slug.
  projectId: z.string().uuid().optional(),
  kind: z.enum(["view", "click"]).optional().default("view"),
});

type TrackPayload = z.infer<typeof trackPayloadSchema>;

const LOCAL_IPS = new Set(["127.0.0.1", "::1", "localhost", "0.0.0.0"]);

function normalizeIp(ip: string) {
  return ip.trim().replace(/^::ffff:/, "");
}

function getIgnoredIps() {
  const envIps = process.env.ANALYTICS_IGNORED_IPS?.split(",") ?? [];

  return new Set([...LOCAL_IPS, ...envIps.map(normalizeIp).filter(Boolean)]);
}

async function getClientIp() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0];

  return normalizeIp(
    firstForwardedIp ||
      requestHeaders.get("x-real-ip") ||
      requestHeaders.get("cf-connecting-ip") ||
      "",
  );
}

async function shouldIgnoreVisit() {
  const cookieStore = await cookies();

  if (cookieStore.has("admin_session")) {
    return true;
  }

  const clientIp = await getClientIp();

  return clientIp !== "" && getIgnoredIps().has(clientIp);
}

/**
 * Identificador estable y anonimo de visitante, para poder contar visitantes
 * unicos sin guardar la IP. Sin salt no se guarda nada: un sha256 de una IP
 * pelada se revierte por fuerza bruta en minutos.
 */
function hashIp(ip: string) {
  const salt = process.env.ANALYTICS_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!ip || !salt) return null;

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

async function insertPageView(payload: TrackPayload, ipHash: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase analytics environment variables");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/page_views`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      path: payload.path,
      referrer: payload.referrer,
      project_id: payload.projectId,
      kind: payload.kind,
      ip_hash: ipHash,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Supabase page_views insert failed: ${response.status} ${message}`,
    );
  }
}

export async function POST(request: NextRequest) {
  if (await shouldIgnoreVisit()) {
    return NextResponse.json({ tracked: false, reason: "ignored" });
  }

  const body = await request.json().catch(() => null);
  const parsed = trackPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { tracked: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  try {
    await insertPageView(parsed.data, hashIp(await getClientIp()));

    return NextResponse.json({ tracked: true });
  } catch (error) {
    console.error("track: failed to store page view", error);

    return NextResponse.json(
      { tracked: false, error: "store_failed" },
      { status: 500 },
    );
  }
}
