import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { DashboardKpi } from "@/lib/dashboard/summary";

/** Sparkline en SVG plano: no necesita JS en el cliente. */
function Sparkline({ series }: { series: number[] }) {
  if (series.length < 2) return null;

  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = max - min || 1;
  const width = 100;
  const height = 28;

  const points = series.map((value, index) => {
    const x = (index / (series.length - 1)) * width;
    const y = height - ((value - min) / span) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
      aria-hidden="true"
    >
      <polygon
        points={`0,${height} ${points.join(" ")} ${width},${height}`}
        className="fill-orange/10"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        className="text-orange"
      />
    </svg>
  );
}

function TrendBadge({ trend }: { trend: DashboardKpi["trend"] }) {
  if (!trend) return null;

  const styles =
    trend.direction === "up"
      ? "bg-emerald-400/10 text-emerald-300"
      : trend.direction === "down"
        ? "bg-red-400/10 text-red-300"
        : "bg-white/[0.05] text-paragraph";

  const Icon =
    trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}
      title="Contra los 30 días anteriores"
    >
      <Icon className="h-3.5 w-3.5" />
      {trend.percent > 0 ? "+" : ""}
      {Math.round(trend.percent)}%
    </span>
  );
}

export function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.16em] text-paragraph">{kpi.label}</p>
        <TrendBadge trend={kpi.trend} />
      </div>

      <div>
        <p className="text-3xl font-medium tracking-tight text-foreground">{kpi.value}</p>
        <p className="mt-1 text-sm text-paragraph">{kpi.hint}</p>
      </div>

      <Sparkline series={kpi.series} />
    </div>
  );
}
