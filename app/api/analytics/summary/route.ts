import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { supabaseRest } from "@/lib/supabase/rest";
import { getPublishedProjects } from "@/lib/projects/published";

type PageViewRow = {
  path: string;
  referrer: string | null;
  project_id: string | null;
  ip_hash: string | null;
  kind: "view" | "click";
  created_at: string;
};

type LeadRow = {
  budget_estimate: number | null;
  source: string;
  industry: string | null;
  company: string | null;
  status: string;
  created_at: string;
};

type Range = "7d" | "30d" | "year";

function startDateFor(range: Range) {
  const now = new Date();

  if (range === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (range === "year") {
    return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  }

  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rangeParam = request.nextUrl.searchParams.get("range");
  const range: Range = rangeParam === "7d" || rangeParam === "year" ? rangeParam : "30d";
  const startIso = startDateFor(range).toISOString();

  try {
    const [pageViewsRes, leadsRes] = await Promise.all([
      supabaseRest(
        `page_views?select=path,referrer,project_id,ip_hash,kind,created_at&created_at=gte.${encodeURIComponent(startIso)}&order=created_at.asc`
      ),
      supabaseRest(
        `leads?select=budget_estimate,source,industry,company,status,created_at&created_at=gte.${encodeURIComponent(startIso)}&order=created_at.asc`
      ),
    ]);

    const pageViews = (await pageViewsRes.json()) as PageViewRow[];
    const leads = (await leadsRes.json()) as LeadRow[];

    const views = pageViews.filter((row) => row.kind !== "click");
    const clicks = pageViews.filter((row) => row.kind === "click");

    const totalVisits = views.length;
    const totalLeads = leads.length;

    // La conversion se mide sobre visitantes unicos (ip_hash), no sobre page
    // views: una sola persona que recorre 6 paginas no son 6 oportunidades.
    // Si el tracker todavia no guardaba ip_hash, se cae a las visitas totales.
    const uniqueHashes = new Set(views.map((row) => row.ip_hash).filter(Boolean));
    const uniqueVisitors = uniqueHashes.size > 0 ? uniqueHashes.size : totalVisits;
    const conversionRate = uniqueVisitors > 0 ? (totalLeads / uniqueVisitors) * 100 : 0;

    // Serie diaria: visitas vs leads generados.
    const dayBuckets = new Map<string, { visits: number; leads: number }>();
    for (const row of views) {
      const key = dayKey(row.created_at);
      const bucket = dayBuckets.get(key) ?? { visits: 0, leads: 0 };
      bucket.visits += 1;
      dayBuckets.set(key, bucket);
    }
    for (const row of leads) {
      const key = dayKey(row.created_at);
      const bucket = dayBuckets.get(key) ?? { visits: 0, leads: 0 };
      bucket.leads += 1;
      dayBuckets.set(key, bucket);
    }
    const trafficSeries = Array.from(dayBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => ({ date, ...bucket }));

    // Proyectos: visitas + clicks de conversion por slug. Los nombres salen de
    // los proyectos publicados; si el slug ya no existe, se muestra el slug.
    const published = await getPublishedProjects("es");
    const publishedNames = new Map(published.map((project) => [project.slug, project.name]));

    const projectBuckets = new Map<string, { views: number; clicks: number }>();
    for (const row of views) {
      if (!row.project_id) continue;
      const bucket = projectBuckets.get(row.project_id) ?? { views: 0, clicks: 0 };
      bucket.views += 1;
      projectBuckets.set(row.project_id, bucket);
    }
    for (const row of clicks) {
      if (!row.project_id) continue;
      const bucket = projectBuckets.get(row.project_id) ?? { views: 0, clicks: 0 };
      bucket.clicks += 1;
      projectBuckets.set(row.project_id, bucket);
    }

    const projectStats = Array.from(projectBuckets.entries())
      .map(([slug, bucket]) => ({
        slug,
        name: publishedNames.get(slug) ?? slug,
        views: bucket.views,
        clicks: bucket.clicks,
      }))
      .sort((a, b) => b.views - a.views);

    const mostViewedProject = projectStats[0] ?? null;

    // Canal de mayor ingreso: suma de presupuesto de leads ganados por origen.
    const wonLeads = leads.filter((lead) => lead.status === "ganado");
    const revenueByChannel = new Map<string, number>();
    for (const lead of wonLeads) {
      revenueByChannel.set(
        lead.source,
        (revenueByChannel.get(lead.source) ?? 0) + (lead.budget_estimate ?? 0)
      );
    }

    let topChannel: { source: string; value: number; byVolume: boolean } | null = null;
    if (revenueByChannel.size > 0) {
      const [source, value] = Array.from(revenueByChannel.entries()).sort((a, b) => b[1] - a[1])[0];
      topChannel = { source, value, byVolume: false };
    } else if (leads.length > 0) {
      const volumeByChannel = new Map<string, number>();
      for (const lead of leads) {
        volumeByChannel.set(lead.source, (volumeByChannel.get(lead.source) ?? 0) + 1);
      }
      const [source, value] = Array.from(volumeByChannel.entries()).sort((a, b) => b[1] - a[1])[0];
      topChannel = { source, value, byVolume: true };
    }

    // Distribucion de ingresos por rubro/industria. Los leads del formulario
    // publico no traen "industry", pero si "company" con el tipo de proyecto
    // elegido en el modal, que sirve igual para agrupar.
    const industryBuckets = new Map<string, number>();
    for (const lead of leads) {
      const key = lead.industry?.trim() || lead.company?.trim() || "Sin especificar";
      industryBuckets.set(key, (industryBuckets.get(key) ?? 0) + (lead.budget_estimate ?? 0));
    }
    const industryDistribution = Array.from(industryBuckets.entries())
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      range,
      totalVisits,
      uniqueVisitors,
      totalLeads,
      conversionRate,
      mostViewedProject,
      topChannel,
      trafficSeries,
      projectStats,
      industryDistribution,
    });
  } catch (error) {
    console.error("analytics/summary: failed to load metrics", error);

    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}
