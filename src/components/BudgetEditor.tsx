"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Budget, Category } from "@/lib/types";

interface Props {
  categories: Category[];
  initialBudgets: Budget[];
}

export function BudgetEditor({ categories, initialBudgets }: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const b of initialBudgets) map[b.category_id] = String(b.monthly_amount);
    return map;
  });
  const [savingId, setSavingId] = useState<string | null>(null);

  async function save(categoryId: string) {
    const amount = Number(values[categoryId]) || 0;
    setSavingId(categoryId);
    await supabase.from("budgets").upsert({ category_id: categoryId, monthly_amount: amount });
    setSavingId(null);
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2 text-left text-sm font-medium"
      >
        {open ? "▼" : "▶"} 予算を編集
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className="w-24 text-sm">{c.name}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={values[c.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value }))}
                onBlur={() => save(c.id)}
                className="w-32 rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                placeholder="0"
              />
              {savingId === c.id && <span className="text-xs text-neutral-400">保存中...</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
