"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PersonBreakdownPoint } from "@/lib/calculations";

// Fixed per-person color assignment — always the same hue for the same
// person across every chart, so the mapping never repaints.
const COLORS = { 風馬: "#0d9488", ちか子: "#f59e0b" };

export function PersonBreakdownChart({ data }: { data: PersonBreakdownPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="year_month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => `¥${Number(value).toLocaleString("ja-JP")}`} />
        <Legend />
        <Bar dataKey="風馬" fill={COLORS.風馬} radius={[4, 4, 0, 0]} />
        <Bar dataKey="ちか子" fill={COLORS.ちか子} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
