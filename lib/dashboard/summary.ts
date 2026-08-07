import { supabaseRest } from "@/lib/supabase/rest";
import { getPublishedProjects } from "@/lib/projects/published";

const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type LeadRow = {
  status: string;
  budget_estimate: number | null;
  created_at: string;
  last_contact_at: string | null;
};

type PageViewRow = {
  project_id: string | null;
  kind: "view" | "click";
  created_at: string;
};

export type DashboardKpi = {
  key: string;
  label: string;
  value: string;
  hint: string;
  /** Variacion contra los 30 dias anteriores. null cuando no hay base de comparacion. */
  trend: { percent: number; direction: "up" | "down" | "flat" } | null;
  series: number[];
};

export type DashboardProjectStat = {
  slug: string;
  name: string;
  views: number;
  clicks: number;
  ctr: number;
};

export type DashboardSummary = {
  kpis: DashboardKpi[];
  projects: DashboardProjectStat[];
  /** false cuando Supabase no respondio: la UI avisa en vez de mostrar ceros. */
  ok: boolean;
};

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormat = new Intl.NumberFormat("es-AR");

const OPEN_STATUSES = ["contactado", "propuesta_enviada"];

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

/** Serie de 30 puntos, uno por dia, para el sparkline. */
function dailySeries(dates: string[], since: Date) {
  const buckets = new Map<string, number>();

  for (let index = 0; index < WINDOW_DAYS; index += 1) {
    buckets.set(new Date(since.getTime() + index * DAY_MS).toISOString().slice(0, 10), 0);
  }

  for (const date of dates) {
    const key = dayKey(date);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.values());
}

function trendBetween(current: number, previous: number): DashboardKpi["trend"] {
  if (previous === 0) return null;

  const percent = ((current - previous) / previous) * 100;

  return {
    percent,
    direction: percent > 0.5 ? "up" : percent < -0.5 ? "down" : "flat",
  };
}

function sumBudget(leads: LeadRow[]) {
  return leads.reduce((total, lead) => total + (lead.budget_estimate ?? 0), 0);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = Date.now();
  const windowStart = new Date(now - WINDOW_DAYS * DAY_MS);
  const previousStart = new Date(now - 2 * WINDOW_DAYS * DAY_MS);

  try {
    const [leadsResponse, viewsResponse] = await Promise.all([
      supabaseRest("leads?select=status,budget_estimate,created_at,last_contact_at"),
      supabaseRest(
        `page_views?select=project_id,kind,created_at&created_at=gte.${encodeURIComponent(
          windowStart.toISOString()
        )}`
      ),
    ]);

    const leads = (await leadsResponse.json()) as LeadRow[];
    const pageViews = (await viewsResponse.json()) as PageViewRow[];

    const inWindow = leads.filter((lead) => new Date(lead.created_at) >= windowStart);
    const inPreviousWindow = leads.filter((lead) => {
      const created = new Date(lead.created_at);
      return created >= previousStart && created < windowStart;
    });

    // 1. Leads sin contactar: la cola de trabajo pendiente de hoy.
    const uncontacted = leads.filter((lead) => lead.status === "nuevo");

    // 2. Pipeline abierto: plata en juego en leads ya contactados.
    const openLeads = leads.filter((lead) => OPEN_STATUSES.includes(lead.status));

    // 3. Cerrado ganado en la ventana, por fecha de ultimo contacto (cuando se
    // movio la tarjeta a "ganado" en el tablero).
    const wonAt = (lead: LeadRow) => new Date(lead.last_contact_at ?? lead.created_at);
    const won = leads.filter((lead) => lead.status === "ganado");
    const wonInWindow = won.filter((lead) => wonAt(lead) >= windowStart);
    const wonInPreviousWindow = won.filter(
      (lead) => wonAt(lead) >= previousStart && wonAt(lead) < windowStart
    );
    const lostInWindow = leads.filter(
      (lead) => lead.status === "perdido" && wonAt(lead) >= windowStart
    );
    const closedInWindow = wonInWindow.length + lostInWindow.length;
    const winRate = closedInWindow > 0 ? (wonInWindow.length / closedInWindow) * 100 : null;

    const kpis: DashboardKpi[] = [
      {
        key: "uncontacted",
        label: "Leads sin contactar",
        value: numberFormat.format(uncontacted.length),
        hint:
          uncontacted.length === 0
            ? "Bandeja al día"
            : `${numberFormat.format(inWindow.length)} entraron en 30 días`,
        trend: trendBetween(inWindow.length, inPreviousWindow.length),
        series: dailySeries(
          inWindow.map((lead) => lead.created_at),
          windowStart
        ),
      },
      {
        key: "pipeline",
        label: "Pipeline abierto",
        value: currency.format(sumBudget(openLeads)),
        hint: `${numberFormat.format(openLeads.length)} leads en negociación`,
        trend: null,
        series: dailySeries(
          openLeads
            .map((lead) => lead.created_at)
            .filter((date) => new Date(date) >= windowStart),
          windowStart
        ),
      },
      {
        key: "won",
        label: "Ganado · 30 días",
        value: currency.format(sumBudget(wonInWindow)),
        hint:
          winRate === null
            ? "Sin cierres en el período"
            : `${Math.round(winRate)}% de cierre sobre ${closedInWindow}`,
        trend: trendBetween(sumBudget(wonInWindow), sumBudget(wonInPreviousWindow)),
        series: dailySeries(
          wonInWindow.map((lead) => (lead.last_contact_at ?? lead.created_at)),
          windowStart
        ),
      },
    ];

    // Nombres de los proyectos publicados; si el slug ya no existe, queda el slug.
    const published = await getPublishedProjects("es");
    const names = new Map(published.map((project) => [project.slug, project.name]));

    const buckets = new Map<string, { views: number; clicks: number }>();
    for (const row of pageViews) {
      if (!row.project_id) continue;
      const bucket = buckets.get(row.project_id) ?? { views: 0, clicks: 0 };
      if (row.kind === "click") bucket.clicks += 1;
      else bucket.views += 1;
      buckets.set(row.project_id, bucket);
    }

    const projects = Array.from(buckets.entries())
      .map(([slug, bucket]) => ({
        slug,
        name: names.get(slug) ?? slug,
        views: bucket.views,
        clicks: bucket.clicks,
        ctr: bucket.views > 0 ? (bucket.clicks / bucket.views) * 100 : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return { kpis, projects, ok: true };
  } catch (error) {
    console.error("dashboard: failed to load summary", error);

    return { kpis: [], projects: [], ok: false };
  }
}
