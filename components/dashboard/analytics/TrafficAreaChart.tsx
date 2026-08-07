"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrafficPoint } from "./types";

type TrafficAreaChartProps = {
  data: TrafficPoint[];
};

export function TrafficAreaChart({ data }: TrafficAreaChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
        Sin datos de tráfico en este rango.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a3e635" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#71717a"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: string) => value.slice(5)}
        />
        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "#09090b",
            border: "1px solid #27272a",
            borderRadius: 8,
            fontSize: 12,
            color: "#e4e4e7",
          }}
          labelStyle={{ color: "#a1a1aa" }}
        />

        <Area
          type="monotone"
          dataKey="visits"
          name="Visitas"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#visitsGradient)"
        />
        <Area
          type="monotone"
          dataKey="leads"
          name="Leads"
          stroke="#a3e635"
          strokeWidth={2}
          fill="url(#leadsGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
