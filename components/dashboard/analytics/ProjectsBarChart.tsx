"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProjectStat } from "./types";

type ProjectsBarChartProps = {
  data: ProjectStat[];
};

export function ProjectsBarChart({ data }: ProjectsBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
        Sin visitas a proyectos en este rango.
      </div>
    );
  }

  const chartData = [...data].slice(0, 8).reverse();
  const height = Math.max(240, chartData.length * 44);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
        <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#a1a1aa"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          contentStyle={{
            background: "#09090b",
            border: "1px solid #27272a",
            borderRadius: 8,
            fontSize: 12,
            color: "#e4e4e7",
          }}
          cursor={{ fill: "#27272a55" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
        <Bar dataKey="views" name="Visitas" fill="#22c55e" radius={[0, 4, 4, 0]} />
        <Bar dataKey="clicks" name="Clicks de conversión" fill="#a3e635" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
