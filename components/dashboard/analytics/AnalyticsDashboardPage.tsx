"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2, Megaphone, Percent, Trophy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "./StatCard";
import { TrafficAreaChart } from "./TrafficAreaChart";
import { ProjectsBarChart } from "./ProjectsBarChart";
import { IndustryDonutChart } from "./IndustryDonutChart";
import { RANGE_OPTIONS, currencyFormatter, type AnalyticsRange, type AnalyticsSummary } from "./types";

export function AnalyticsDashboardPage() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(false);
      try {
        const response = await fetch(`/api/analytics/summary?range=${range}`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as AnalyticsSummary;
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-assets pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-medium uppercase leading-none tracking-tight text-foreground md:text-6xl">
            Analíticas
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-paragraph">
            Rendimiento de negocio y tráfico del portfolio.
          </p>
        </div>

        <Select value={range} onValueChange={(value) => setRange(value as AnalyticsRange)}>
          <SelectTrigger className="w-56 border-assets bg-surface text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-assets bg-surface text-foreground">
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-assets bg-surface py-16 text-sm text-paragraph">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando métricas
        </div>
      ) : error || !summary ? (
        <div className="rounded-lg border border-assets bg-surface py-16 text-center text-sm text-paragraph">
          No se pudieron cargar las métricas. Reintentá más tarde.
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Eye}
              label="Total Visitas Portfolio"
              value={String(summary.totalVisits)}
              sublabel={`${summary.uniqueVisitors} visitantes únicos`}
            />
            <StatCard
              icon={Percent}
              label="Tasa de Conversión"
              value={`${summary.conversionRate.toFixed(1)}%`}
              sublabel={`${summary.totalLeads} leads / ${summary.uniqueVisitors} visitantes únicos`}
            />
            <StatCard
              icon={Trophy}
              label="Proyecto Más Visto"
              value={summary.mostViewedProject?.name ?? "Sin datos"}
              sublabel={
                summary.mostViewedProject ? `${summary.mostViewedProject.views} visitas` : undefined
              }
            />
            <StatCard
              icon={Megaphone}
              label="Canal de Mayor Ingreso"
              value={summary.topChannel?.source ?? "Sin datos"}
              sublabel={
                summary.topChannel
                  ? summary.topChannel.byVolume
                    ? `${summary.topChannel.value} leads`
                    : currencyFormatter.format(summary.topChannel.value)
                  : undefined
              }
            />
          </section>

          <section className="rounded-lg border border-assets bg-surface p-5">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-paragraph">
              Tráfico web vs Leads generados
            </h2>
            <TrafficAreaChart data={summary.trafficSeries} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-lg border border-assets bg-surface p-5">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-paragraph">
                Proyectos por visitas y clicks de conversión
              </h2>
              <ProjectsBarChart data={summary.projectStats} />
            </div>

            <div className="rounded-lg border border-assets bg-surface p-5">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-paragraph">
                Ingresos por Rubro / Industria
              </h2>
              <IndustryDonutChart data={summary.industryDistribution} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
