"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CumulativeSpendPoint } from "@/lib/calculations";

interface Props {
  data: CumulativeSpendPoint[];
  budgetLine: number;
}

export function CumulativeSpendChart({ data, budgetLine }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} tickFormatter={(d) => `${d}日`} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          labelFormatter={(d) => `${d}日`}
          formatter={(value) => `¥${Number(value).toLocaleString("ja-JP")}`}
        />
        {budgetLine > 0 && (
          <ReferenceLine
            y={budgetLine}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: `予算 ¥${budgetLine.toLocaleString("ja-JP")}`, position: "insideTopRight", fontSize: 12, fill: "#ef4444" }}
          />
        )}
        <Line type="monotone" dataKey="cumulative" stroke="#0d9488" strokeWidth={2} dot={false} name="累計支出" />
      </LineChart>
    </ResponsiveContainer>
  );
}
