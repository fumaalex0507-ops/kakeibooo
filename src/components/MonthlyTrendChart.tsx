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
  const barCategories = selectedCategoryId
    ? categories.filter((c) => c.id === selectedCategoryId)
    : categories;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="year_month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => `¥${Number(value).toLocaleString("ja-JP")}`} />
        <Legend
          content={() => (
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 text-xs">
              {barCategories.map((c) => (
                <li key={c.id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: colorForCategory(c.id, categories) }}
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
