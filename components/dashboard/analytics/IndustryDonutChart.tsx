"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { IndustrySlice } from "./types";
import { currencyFormatter } from "./types";

type IndustryDonutChartProps = {
  data: IndustrySlice[];
};

const COLORS = ["#22c55e", "#a3e635", "#4ade80", "#84cc16", "#16a34a", "#65a30d", "#3f6212"];

export function IndustryDonutChart({ data }: IndustryDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
        Sin ingresos por rubro registrados en este rango.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="#09090b" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => currencyFormatter.format(Number(value))}
          contentStyle={{
            background: "#09090b",
            border: "1px solid #27272a",
            borderRadius: 8,
            fontSize: 12,
            color: "#e4e4e7",
          }}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
