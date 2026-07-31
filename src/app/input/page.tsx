import { createServerClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/TransactionForm";
import {
  BUDGET_HIDDEN_CATEGORY_IDS,
  FIXED_COST_ONLY_CATEGORY_IDS,
  type Budget,
  type Category,
  type MonthlyTotalRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InputPage() {
  const supabase = createServerClient();

  const [
    { data: categories, error: catError },
    { data: monthlyTotals, error: totalsError },
    { data: budgets, error: budgetError },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("v_monthly_totals").select("*"),
    supabase.from("budgets").select("*"),
  ]);

  if (catError || totalsError || budgetError) {
    return (
      <p className="text-red-600 dark:text-red-400">
        データの取得に失敗しました: {catError?.message ?? totalsError?.message ?? budgetError?.message}
      </p>
    );
  }

  const allCategories = (categories ?? []) as Category[];
  const inputCategories = allCategories.filter(
    (c) => !FIXED_COST_ONLY_CATEGORY_IDS.includes(c.id as (typeof FIXED_COST_ONLY_CATEGORY_IDS)[number])
  );
  const budgetCategories = allCategories.filter(
    (c) => !BUDGET_HIDDEN_CATEGORY_IDS.includes(c.id as (typeof BUDGET_HIDDEN_CATEGORY_IDS)[number])
  );

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">支出を入力</h1>
      <TransactionForm
        categories={inputCategories}
        allCategories={allCategories}
        budgetCategories={budgetCategories}
        monthlyTotals={(monthlyTotals ?? []) as MonthlyTotalRow[]}
        allBudgets={(budgets ?? []) as Budget[]}
      />
    </div>
  );
}
