"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyTrendPoint } from "@/lib/calculations";

export function MonthlyTrendChart({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="year_month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => `¥${Number(value).toLocaleString("ja-JP")}`} />
        <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} name="支出合計" />
      </BarChart>
    </ResponsiveContainer>
  );
}
