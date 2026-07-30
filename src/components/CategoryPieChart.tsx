"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Category } from "@/lib/types";

// Fixed categorical palette, assigned in a stable order (by category
// sort_order) so a given category always gets the same color across
// renders, independent of which categories have nonzero spending.
const COLORS = [
  "#0d9488", // teal
  "#f59e0b", // amber
  "#6366f1", // indigo
  "#ec4899", // pink
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#f97316", // orange
  "#8b5cf6", // violet
  "#14b8a6", // teal-light
  "#ef4444", // red
  "#a3a3a3", // neutral
  "#3b82f6", // blue
];

// Shared anchor so the absolutely-positioned total-amount overlay lines up
// exactly with the donut's actual center, regardless of how much vertical
// space the legend below it consumes.
const CENTER_X = "50%";
const CENTER_Y = "42%";

interface Props {
  categories: Category[];
  categoryTotals: Record<string, number>;
}

export function CategoryPieChart({ categories, categoryTotals }: Props) {
  const data = categories
    .map((c) => ({ name: c.name, value: categoryTotals[c.id] ?? 0 }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">この月の支出データはまだありません。</p>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx={CENTER_X}
            cy={CENTER_Y}
            innerRadius={60}
            outerRadius={100}
            paddingAngle={1}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `¥${Number(value).toLocaleString("ja-JP")}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: CENTER_X, top: CENTER_Y }}
      >
        <span className="text-xs text-neutral-500 dark:text-neutral-400">合計</span>
        <span className="text-lg font-semibold">¥{total.toLocaleString("ja-JP")}</span>
      </div>
    </div>
  );
}
