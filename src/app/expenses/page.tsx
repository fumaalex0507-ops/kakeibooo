import { format, subMonths } from "date-fns";
import { createServerClient } from "@/lib/supabase/server";
import { aggregateCategoryTotalsForMonth, aggregateMonthlyTrend } from "@/lib/calculations";
import { PeriodPicker } from "@/components/PeriodPicker";
import { PersonTabs } from "@/components/PersonTabs";
import { MonthlyTrendChart } from "@/components/MonthlyTrendChart";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { BudgetProgress } from "@/components/BudgetProgress";
import { BudgetEditor } from "@/components/BudgetEditor";
import {
  BUDGET_HIDDEN_CATEGORY_IDS,
  PAYERS,
  type Budget,
  type Category,
  type MonthlyTotalRow,
  type PayerId,
} from "@/lib/types";

interface Props {
  searchParams: Promise<{ months?: string; payer?: string }>;
}

export default async function ExpensesPage({ searchParams }: Props) {
  const params = await searchParams;
  const months = Number(params.months) || 6;
  const payerId: PayerId = params.payer === "ちか子" ? "ちか子" : PAYERS[0];

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
    supabase.from("budgets").select("*").eq("payer_id", payerId),
  ]);

  if (totalsError || catError || budgetError) {
    return (
      <p className="text-red-600 dark:text-red-400">
        データの取得に失敗しました: {totalsError?.message ?? catError?.message ?? budgetError?.message}
      </p>
    );
  }

  const rows = (monthlyTotals ?? []) as MonthlyTotalRow[];
  const trend = aggregateMonthlyTrend(rows, payerId);
  const categoryTotals = aggregateCategoryTotalsForMonth(rows, currentYearMonth, payerId);

  const allCategories = (categories ?? []) as Category[];
  const budgetCategories = allCategories.filter(
    (c) => !BUDGET_HIDDEN_CATEGORY_IDS.includes(c.id as (typeof BUDGET_HIDDEN_CATEGORY_IDS)[number])
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">支出分析</h1>
        <div className="flex items-center gap-3">
          <PersonTabs current={payerId} basePath="/expenses" />
          <PeriodPicker months={months} basePath="/expenses" />
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {payerId}の今月の分類構成比
        </h2>
        <CategoryPieChart categories={allCategories} categoryTotals={categoryTotals} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {payerId}の月次推移
        </h2>
        <MonthlyTrendChart data={trend} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {payerId}の今月の費目別予算消化率
        </h2>
        <BudgetProgress
          categories={budgetCategories}
          budgets={(budgets ?? []) as Budget[]}
          categoryTotals={categoryTotals}
        />
        <div className="mt-3">
          <BudgetEditor
            categories={budgetCategories}
            payerId={payerId}
            initialBudgets={(budgets ?? []) as Budget[]}
          />
        </div>
      </section>
    </div>
  );
}
