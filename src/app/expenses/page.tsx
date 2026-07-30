import { format, subMonths } from "date-fns";
import { createServerClient } from "@/lib/supabase/server";
import {
  aggregateCategoryTotalsForMonth,
  aggregateMonthlyTrend,
  aggregatePersonBreakdown,
} from "@/lib/calculations";
import { PeriodPicker } from "@/components/PeriodPicker";
import { MonthlyTrendChart } from "@/components/MonthlyTrendChart";
import { PersonBreakdownChart } from "@/components/PersonBreakdownChart";
import { BudgetProgress } from "@/components/BudgetProgress";
import { BudgetEditor } from "@/components/BudgetEditor";
import { BUDGET_HIDDEN_CATEGORY_IDS, type Budget, type Category, type MonthlyTotalRow } from "@/lib/types";

interface Props {
  searchParams: Promise<{ months?: string }>;
}

export default async function ExpensesPage({ searchParams }: Props) {
  const params = await searchParams;
  const months = Number(params.months) || 6;

  const now = new Date();
  const currentYearMonth = format(now, "yyyy-MM");
  const cutoffYearMonth = format(subMonths(now, months - 1), "yyyy-MM");

  const supabase = createServerClient();

  const [
    { data: monthlyTotals, error: totalsError },
    { data: categories, error: catError },
    { data: budgets, error: budgetError },
  ] = await Promise.all([
    supabase
      .from("v_monthly_totals")
      .select("*")
      .gte("year_month", cutoffYearMonth)
      .lte("year_month", currentYearMonth),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("budgets").select("*"),
  ]);

  if (totalsError || catError || budgetError) {
    return (
      <p className="text-red-600 dark:text-red-400">
        データの取得に失敗しました: {totalsError?.message ?? catError?.message ?? budgetError?.message}
      </p>
    );
  }

  const rows = (monthlyTotals ?? []) as MonthlyTotalRow[];
  const trend = aggregateMonthlyTrend(rows);
  const breakdown = aggregatePersonBreakdown(rows);
  const categoryTotals = aggregateCategoryTotalsForMonth(rows, currentYearMonth);

  const budgetCategories = ((categories ?? []) as Category[]).filter(
    (c) => !BUDGET_HIDDEN_CATEGORY_IDS.includes(c.id as (typeof BUDGET_HIDDEN_CATEGORY_IDS)[number])
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">支出分析</h1>
        <PeriodPicker months={months} basePath="/expenses" />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">月次推移</h2>
        <MonthlyTrendChart data={trend} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          個人別の支出比較
        </h2>
        <PersonBreakdownChart data={breakdown} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          今月の費目別予算消化率
        </h2>
        <BudgetProgress
          categories={budgetCategories}
          budgets={(budgets ?? []) as Budget[]}
          categoryTotals={categoryTotals}
        />
        <div className="mt-3">
          <BudgetEditor categories={budgetCategories} initialBudgets={(budgets ?? []) as Budget[]} />
        </div>
      </section>
    </div>
  );
}
