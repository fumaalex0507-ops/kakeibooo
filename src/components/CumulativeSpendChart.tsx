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

// Round tick step (¥5,000 / ¥10,000 / ¥20,000 / ...) picked so the axis ends
// up with roughly 5-6 ticks, instead of whatever odd interval Recharts'
// default "nice" algorithm derives from an arbitrary domain max.
const TICK_STEPS = [1000, 2000, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 500000, 1000000];

function pickTickStep(maxValue: number): number {
  for (const step of TICK_STEPS) {
    if (maxValue / step <= 6) return step;
  }
  return TICK_STEPS[TICK_STEPS.length - 1];
}

interface Props {
  data: CumulativeSpendByCategoryPoint[];
  categories: Category[];
  allCategories: Category[];
  /** Budget amount per category id — each gets its own dashed reference line in its own color. */
  budgetAmounts: Record<string, number>;
}

export function CumulativeSpendChart({ data, categories, allCategories, budgetAmounts }: Props) {
  // Keep the highest budget line near the top of the chart (rather than
  // wherever Recharts' default auto-domain happens to land it) by scaling
  // the axis to whichever is larger — the max budget or the actual max —
  // plus a little headroom, so overshooting a budget is still visible.
  const maxCumulative = data.reduce((max, point) => {
    const pointMax = categories.reduce((m, c) => Math.max(m, point[c.id] ?? 0), 0);
    return Math.max(max, pointMax);
  }, 0);
  const maxBudget = Math.max(0, ...categories.map((c) => budgetAmounts[c.id] ?? 0));
  const rawMax = Math.max(maxBudget, maxCumulative) * 1.1 || 1000;
  const tickStep = pickTickStep(rawMax);
  const axisMax = Math.ceil(rawMax / tickStep) * tickStep;
  const ticks = Array.from({ length: axisMax / tickStep + 1 }, (_, i) => i * tickStep);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} tickFormatter={(d) => `${d}日`} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `¥${Number(v).toLocaleString("ja-JP")}`}
          domain={[0, axisMax]}
          ticks={ticks}
        />
        <Tooltip
          labelFormatter={(d) => `${d}日`}
          formatter={(value) => `¥${Number(value).toLocaleString("ja-JP")}`}
        />
        <Legend />
        {categories.map((c) => {
          const color = colorForCategory(c.id, allCategories);
          const budget = budgetAmounts[c.id] ?? 0;
          return (
            <ReferenceLine
              key={`budget-${c.id}`}
              y={budget}
              stroke={color}
              strokeDasharray="4 4"
              label={{
                value: `${c.name} ¥${budget.toLocaleString("ja-JP")}`,
                position: "insideTopRight",
                fontSize: 11,
                fill: color,
              }}
            />
          );
        })}
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
