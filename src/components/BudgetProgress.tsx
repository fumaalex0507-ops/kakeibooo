import clsx from "clsx";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  budgetAmounts: Record<string, number>;
  categoryTotals: Record<string, number>;
  showEditorHint?: boolean;
}

function statusFor(ratio: number) {
  if (ratio > 1) return { label: "予算超過", classes: "bg-red-500", text: "text-red-700 dark:text-red-400" };
  if (ratio >= 0.7) return { label: "注意", classes: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" };
  return { label: "順調", classes: "bg-teal-600", text: "text-teal-700 dark:text-teal-400" };
}

export function BudgetProgress({ categories, budgetAmounts, categoryTotals, showEditorHint = true }: Props) {
  const rows = categories
    .filter((c) => (budgetAmounts[c.id] ?? 0) > 0)
    .map((category) => {
      const monthlyAmount = budgetAmounts[category.id];
      const used = categoryTotals[category.id] ?? 0;
      const ratio = used / monthlyAmount;
      return { category, monthlyAmount, used, ratio };
    });

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        予算が設定されている費目はありません。
        {showEditorHint && "下の「予算を編集」から設定できます。"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ category, monthlyAmount, used, ratio }) => {
        const status = statusFor(ratio);
        const remaining = monthlyAmount - used;
        return (
          <div key={category.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{category.name}</span>
              <span className={clsx("font-medium", status.text)}>{status.label}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className={clsx("h-full rounded-full", status.classes)}
                style={{ width: `${Math.min(ratio, 1) * 100}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              ¥{used.toLocaleString("ja-JP")} / ¥{monthlyAmount.toLocaleString("ja-JP")} (残り¥
              {remaining.toLocaleString("ja-JP")})
            </div>
          </div>
        );
      })}
    </div>
  );
}
