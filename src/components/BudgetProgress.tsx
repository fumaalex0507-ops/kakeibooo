import clsx from "clsx";
import type { Budget, Category } from "@/lib/types";

interface Props {
  categories: Category[];
  budgets: Budget[];
  categoryTotals: Record<string, number>;
}

function statusFor(ratio: number) {
  if (ratio > 1) return { label: "予算超過", classes: "bg-red-500", text: "text-red-700 dark:text-red-400" };
  if (ratio >= 0.7) return { label: "注意", classes: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" };
  return { label: "順調", classes: "bg-teal-600", text: "text-teal-700 dark:text-teal-400" };
}

export function BudgetProgress({ categories, budgets, categoryTotals }: Props) {
  const rows = budgets
    .map((b) => {
      const category = categories.find((c) => c.id === b.category_id);
      const used = categoryTotals[b.category_id] ?? 0;
      const ratio = b.monthly_amount > 0 ? used / b.monthly_amount : 0;
      return { category, budget: b, used, ratio };
    })
    .filter((r) => r.category);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        予算が設定されている費目はありません。下の「予算を編集」から設定できます。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ category, budget, used, ratio }) => {
        const status = statusFor(ratio);
        const remaining = budget.monthly_amount - used;
        return (
          <div key={budget.category_id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{category!.name}</span>
              <span className={clsx("font-medium", status.text)}>{status.label}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className={clsx("h-full rounded-full", status.classes)}
                style={{ width: `${Math.min(ratio, 1) * 100}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              ¥{used.toLocaleString("ja-JP")} / ¥{budget.monthly_amount.toLocaleString("ja-JP")}
              {" "}
              (残り¥{remaining.toLocaleString("ja-JP")})
            </div>
          </div>
        );
      })}
    </div>
  );
}
