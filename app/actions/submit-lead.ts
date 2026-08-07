"use server";

import { Resend } from "resend";
import { z } from "zod";
import { supabaseRest } from "@/lib/supabase/rest";

const TIPO_PROYECTO_VALUES = [
  "web_inmobiliaria",
  "app_gestion",
  "web_corporativa",
  "agencia",
  "otro",
] as const;

const PRESUPUESTO_VALUES = [
  "200_400",
  "400_1000",
  "1000_3000",
  "3000_plus",
  "a_conversar",
] as const;

const TIPO_TERCERIZADO_VALUES = [
  "landings",
  "webs_completas",
  "sistemas",
  "varios",
] as const;

const IDIOMA_VALUES = ["es", "pt", "en"] as const;

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const submitLeadSchema = z
  .object({
    tipo_proyecto: z.enum(TIPO_PROYECTO_VALUES),
    estado_idea: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
    frecuencia_proyectos: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
    presupuesto: z.preprocess(emptyStringToUndefined, z.enum(PRESUPUESTO_VALUES).optional()),
    tipo_tercerizado: z.preprocess(
      emptyStringToUndefined,
      z.enum(TIPO_TERCERIZADO_VALUES).optional()
    ),
    nombre: z.string().trim().min(1).max(200),
    email: z.email().trim(),
    whatsapp: z.preprocess(emptyStringToUndefined, z.string().max(50).optional()),
    mensaje: z.preprocess(emptyStringToUndefined, z.string().max(5000).optional()),
    link_referencia: z.preprocess(emptyStringToUndefined, z.url().max(500).optional()),
    prefiere_whatsapp: z.boolean(),
    idioma: z.enum(IDIOMA_VALUES),
    honeypot: z.string().optional(),
    // Atribucion: de donde llego la visita que termino en este lead.
    referrer: z.preprocess(emptyStringToUndefined, z.string().max(500).optional()),
    utm_source: z.preprocess(emptyStringToUndefined, z.string().max(80).optional()),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_proyecto === "agencia") {
      if (!data.tipo_tercerizado) {
        ctx.addIssue({
          code: "custom",
          message: "tipo_tercerizado is required when tipo_proyecto is agencia",
          path: ["tipo_tercerizado"],
        });
      }
      if (!data.frecuencia_proyectos) {
        ctx.addIssue({
          code: "custom",
          message: "frecuencia_proyectos is required when tipo_proyecto is agencia",
          path: ["frecuencia_proyectos"],
        });
      }
      if (data.presupuesto) {
        ctx.addIssue({
          code: "custom",
          message: "presupuesto must be empty when tipo_proyecto is agencia",
          path: ["presupuesto"],
        });
      }
    } else {
      if (!data.presupuesto) {
        ctx.addIssue({
          code: "custom",
          message: "presupuesto is required when tipo_proyecto is not agencia",
          path: ["presupuesto"],
        });
      }
      if (!data.estado_idea) {
        ctx.addIssue({
          code: "custom",
          message: "estado_idea is required when tipo_proyecto is not agencia",
          path: ["estado_idea"],
        });
      }
      if (data.tipo_tercerizado) {
        ctx.addIssue({
          code: "custom",
          message: "tipo_tercerizado must be empty when tipo_proyecto is not agencia",
          path: ["tipo_tercerizado"],
        });
      }
      if (data.frecuencia_proyectos) {
        ctx.addIssue({
          code: "custom",
          message: "frecuencia_proyectos must be empty when tipo_proyecto is not agencia",
          path: ["frecuencia_proyectos"],
        });
      }
    }
  });

const TIPO_PROYECTO_LABELS: Record<(typeof TIPO_PROYECTO_VALUES)[number], string> = {
  web_inmobiliaria: "Web Inmobiliaria",
  app_gestion: "App de Gestión",
  web_corporativa: "Web Corporativa",
  agencia: "Agencia (tercerizado)",
  otro: "Otro",
};

const BUDGET_ESTIMATES: Record<(typeof PRESUPUESTO_VALUES)[number], number | undefined> = {
  "200_400": 300,
  "400_1000": 700,
  "1000_3000": 2000,
  "3000_plus": 3500,
  a_conversar: undefined,
};

// Hosts conocidos a nombre de canal. El resto se guarda con su dominio, que ya
// es mas util que meter todo en "Web Inbound".
const REFERRER_CHANNELS: Record<string, string> = {
  "google.": "Google",
  "bing.": "Bing",
  "duckduckgo.": "DuckDuckGo",
  "linkedin.": "LinkedIn",
  "lnkd.in": "LinkedIn",
  "instagram.": "Instagram",
  "facebook.": "Facebook",
  "fb.": "Facebook",
  "twitter.": "X / Twitter",
  "x.com": "X / Twitter",
  "youtube.": "YouTube",
  "youtu.be": "YouTube",
  "github.": "GitHub",
  "reddit.": "Reddit",
  "whatsapp.": "WhatsApp",
  "wa.me": "WhatsApp",
  "t.co": "X / Twitter",
  "upwork.": "Upwork",
};

/** Canal comercial del lead: utm_source si vino, si no el referrer. */
function resolveLeadSource(referrer?: string, utmSource?: string) {
  if (utmSource) return utmSource;
  if (!referrer) return "Directo";

  let hostname: string;

  try {
    hostname = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "Web Inbound";
  }

  if (hostname === "ignacioweppler.com") return "Directo";

  for (const [needle, channel] of Object.entries(REFERRER_CHANNELS)) {
    if (hostname.includes(needle)) return channel;
  }

  return hostname;
}

function buildLeadNotes(data: z.infer<typeof submitLeadSchema>) {
  const lines: string[] = [];

  if (data.tipo_proyecto === "agencia") {
    if (data.tipo_tercerizado) lines.push(`Tercerizado: ${data.tipo_tercerizado}`);
    if (data.frecuencia_proyectos) lines.push(`Frecuencia: ${data.frecuencia_proyectos}`);
  } else if (data.estado_idea) {
    lines.push(`Estado de la idea: ${data.estado_idea}`);
  }

  if (data.mensaje) lines.push(data.mensaje);
  if (data.link_referencia) lines.push(`Referencia: ${data.link_referencia}`);

  return lines.join("\n\n") || undefined;
}

async function insertLead(data: z.infer<typeof submitLeadSchema>) {
  await supabaseRest("leads", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      // Columnas propias del formulario publico.
      nombre: data.nombre,
      email: data.email,
      whatsapp: data.whatsapp ?? null,
      prefiere_whatsapp: data.prefiere_whatsapp,
      tipo_proyecto: data.tipo_proyecto,
      estado_idea: data.estado_idea ?? null,
      presupuesto: data.presupuesto ?? null,
      mensaje: data.mensaje ?? null,
      link_referencia: data.link_referencia ?? null,
      idioma: data.idioma,
      // Columnas del CRM, para que el lead entre al tablero del panel.
      company: TIPO_PROYECTO_LABELS[data.tipo_proyecto],
      budget_estimate: data.presupuesto ? BUDGET_ESTIMATES[data.presupuesto] : null,
      source: resolveLeadSource(data.referrer, data.utm_source),
      status: "nuevo",
      notes: buildLeadNotes(data) ?? null,
    }),
  });
}

export type SubmitLeadInput = z.input<typeof submitLeadSchema>;

type SubmitLeadResult = {
  success: boolean;
  error?: string;
};

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function buildEmailHtml(data: z.infer<typeof submitLeadSchema>): string {
  const isAgencia = data.tipo_proyecto === "agencia";

  const lines: Array<[string, string]> = [
    ["nombre", data.nombre],
    ["email", data.email],
    ["whatsapp", data.whatsapp ?? "-"],
    ["prefiere_whatsapp", data.prefiere_whatsapp ? "si" : "no"],
    ["tipo_proyecto", data.tipo_proyecto],
  ];

  if (isAgencia) {
    lines.push(["tipo_tercerizado", data.tipo_tercerizado ?? "-"]);
    lines.push(["frecuencia_proyectos", data.frecuencia_proyectos ?? "-"]);
  } else {
    lines.push(["estado_idea", data.estado_idea ?? "-"]);
    lines.push(["presupuesto", data.presupuesto ?? "-"]);
  }

  lines.push(["mensaje", data.mensaje ?? "-"]);
  lines.push(["link_referencia", data.link_referencia ?? "-"]);
  lines.push(["idioma", data.idioma]);

  const rows = lines
    .map(([label, value]) => `${escapeHtml(label)}: ${escapeHtml(value)}`)
    .join("<br/>\n");

  return `<div style="font-family: monospace, sans-serif; font-size: 14px; line-height: 1.6;">${rows}</div>`;
}

export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResult> {
  if (typeof input?.honeypot === "string" && input.honeypot.trim() !== "") {
    return { success: true };
  }

  const parsed = submitLeadSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "invalid_data" };
  }

  const data = parsed.data;

  try {
    await insertLead(data);
  } catch (err) {
    console.error("submitLead: failed to insert lead into CRM", err);
  }

  const contactEmailTo = process.env.CONTACT_EMAIL_TO;

  if (!contactEmailTo) {
    console.error("submitLead: CONTACT_EMAIL_TO env var is not set");
    return { success: false, error: "send_failed" };
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: contactEmailTo,
      subject: `Nuevo lead ${data.tipo_proyecto} — ${data.nombre}`,
      html: buildEmailHtml(data),
      replyTo: data.email,
    });

    if (error) {
      console.error("submitLead: resend returned an error", error);
      return { success: false, error: "send_failed" };
    }

    return { success: true };
  } catch (err) {
    console.error("submitLead: unexpected error sending email", err);
    return { success: false, error: "send_failed" };
  }
}
