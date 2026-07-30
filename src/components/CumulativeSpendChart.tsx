"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colorForCategory } from "@/lib/colors";
import type { Category } from "@/lib/types";
import type { CumulativeSpendByCategoryPoint } from "@/lib/calculations";

interface Props {
  data: CumulativeSpendByCategoryPoint[];
  categories: Category[];
  allCategories: Category[];
  budgetLine: number;
}

export function CumulativeSpendChart({ data, categories, allCategories, budgetLine }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} tickFormatter={(d) => `${d}日`} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          labelFormatter={(d) => `${d}日`}
          formatter={(value) => `¥${Number(value).toLocaleString("ja-JP")}`}
        />
        <Legend />
        {budgetLine > 0 && (
          <ReferenceLine
            y={budgetLine}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: `予算合計 ¥${budgetLine.toLocaleString("ja-JP")}`,
              position: "insideTopRight",
              fontSize: 12,
              fill: "#ef4444",
            }}
          />
        )}
        {categories.map((c) => (
          <Line
            key={c.id}
            type="monotone"
            dataKey={c.id}
            name={c.name}
            stroke={colorForCategory(c.id, allCategories)}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
