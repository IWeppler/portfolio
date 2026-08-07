export type AnalyticsRange = "7d" | "30d" | "year";

export const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "year", label: "Este Año" },
];

export type TrafficPoint = {
  date: string;
  visits: number;
  leads: number;
};

export type ProjectStat = {
  slug: string;
  name: string;
  views: number;
  clicks: number;
};

export type IndustrySlice = {
  name: string;
  value: number;
};

export type TopChannel = {
  source: string;
  value: number;
  byVolume: boolean;
} | null;

export type AnalyticsSummary = {
  range: AnalyticsRange;
  totalVisits: number;
  /** Distintos ip_hash en el período: la base real de la tasa de conversión. */
  uniqueVisitors: number;
  totalLeads: number;
  conversionRate: number;
  mostViewedProject: ProjectStat | null;
  topChannel: TopChannel;
  trafficSeries: TrafficPoint[];
  projectStats: ProjectStat[];
  industryDistribution: IndustrySlice[];
};

export const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
