import { Gauge } from "lucide-react";
import { KpiCard } from "@/components/dashboard/home/KpiCard";
import { getDashboardSummary } from "@/lib/dashboard/summary";

export const dynamic = "force-dynamic";

const formatNumber = new Intl.NumberFormat("es-AR");

export default async function DashboardPage() {
  const { kpis, projects, ok } = await getDashboardSummary();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      {!ok && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          No se pudieron leer las métricas de Supabase. Revisá que las migraciones estén aplicadas.
        </p>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} />
        ))}
      </section>

      <section>
        <div className="rounded-lg border border-white/10 bg-surface">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-medium uppercase tracking-tight">Proyectos más Vistos</h2>
              <p className="mt-1 text-sm text-paragraph">
                Registros de page_views por proyecto
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-paragraph">
              <Gauge className="h-4 w-4 text-orange" />
              Últimos 30 días
            </div>
          </div>

          {projects.length === 0 ? (
            <p className="p-5 text-sm text-paragraph">
              Todavía no hay visitas registradas en este período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-paragraph">
                    <th className="px-5 py-4 font-medium">Proyecto</th>
                    <th className="px-5 py-4 font-medium">Visitas</th>
                    <th className="px-5 py-4 font-medium">Clicks de conversión</th>
                    <th className="px-5 py-4 font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, index) => (
                    <tr
                      key={project.slug}
                      className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-sm font-medium text-paragraph">
                            {index + 1}
                          </span>
                          <span className="font-medium text-foreground">{project.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-foreground">
                        {formatNumber.format(project.views)}
                      </td>
                      <td className="px-5 py-5 text-paragraph">
                        {formatNumber.format(project.clicks)}
                      </td>
                      <td className="px-5 py-5 text-paragraph">{Math.round(project.ctr)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
