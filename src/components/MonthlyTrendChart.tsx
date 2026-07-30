"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colorForCategory } from "@/lib/colors";
import type { Category } from "@/lib/types";
import type { MonthlyCategoryPoint } from "@/lib/calculations";

interface Props {
  data: MonthlyCategoryPoint[];
  categories: Category[];
  /** Category id to isolate; omit/undefined shows every category stacked. */
  selectedCategoryId?: string;
}

export function MonthlyTrendChart({ data, categories, selectedCategoryId }: Props) {
  const tabCategories = selectedCategoryId
    ? categories.filter((c) => c.id === selectedCategoryId)
    : categories;

  // Only show categories that actually have a nonzero value somewhere in
  // the displayed period — order is unaffected since we filter, not sort.
  const barCategories = tabCategories.filter((c) => data.some((point) => (point[c.id] ?? 0) > 0));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="year_month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => `¥${Number(value).toLocaleString("ja-JP")}`} />
        <Legend
          content={() => (
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
              {barCategories.map((c) => (
                <li key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      display: "inline-block",
                      flexShrink: 0,
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: colorForCategory(c.id, categories),
                    }}
                  />
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        />
        {barCategories.map((c) => (
          <Bar key={c.id} dataKey={c.id} name={c.name} stackId="a" fill={colorForCategory(c.id, categories)} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
