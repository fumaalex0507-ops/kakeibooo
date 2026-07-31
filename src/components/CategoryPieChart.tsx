"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { colorForCategory } from "@/lib/colors";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  categoryTotals: Record<string, number>;
}

export function CategoryPieChart({ categories, categoryTotals }: Props) {
  const data = categories
    .map((c) => ({ id: c.id, name: c.name, value: categoryTotals[c.id] ?? 0 }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">この月の支出データはまだありません。</p>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      {/* Legend rendered outside the chart (not as a Recharts <Legend>) so its
          height never affects the Pie's own plotting area — otherwise the
          center overlay below, anchored to this block only, would drift out
          of sync with wherever Recharts actually centers the donut. */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={1}
              animationDuration={900}
            >
              {data.map((d) => (
                <Cell key={d.id} fill={colorForCategory(d.id, categories)} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `¥${Number(value).toLocaleString("ja-JP")}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">合計</span>
          <span className="text-lg font-semibold">¥{total.toLocaleString("ja-JP")}</span>
        </div>
      </div>
      <ul
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "4px 16px",
          paddingTop: 8,
          fontSize: 12,
          listStyle: "none",
        }}
      >
        {data.map((d) => (
          <li key={d.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-block",
                flexShrink: 0,
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: colorForCategory(d.id, categories),
              }}
            />
            {d.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
