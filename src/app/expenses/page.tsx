import { format, subMonths } from "date-fns";
import { createServerClient } from "@/lib/supabase/server";
import {
  aggregateCategoryTotalsForMonth,
  aggregateCumulativeDailySpendByCategory,
  aggregateMonthlyTrendByCategory,
  resolveEffectiveBudgets,
} from "@/lib/calculations";
import { PeriodPicker } from "@/components/PeriodPicker";
import { PersonTabs } from "@/components/PersonTabs";
import { TrendCategoryTabs } from "@/components/TrendCategoryTabs";
import { YearMonthPicker } from "@/components/YearMonthPicker";
import { MonthlyTrendChart } from "@/components/MonthlyTrendChart";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { CumulativeSpendChart } from "@/components/CumulativeSpendChart";
import { BudgetProgress } from "@/components/BudgetProgress";
import { BudgetEditor } from "@/components/BudgetEditor";
import {
  BUDGET_HIDDEN_CATEGORY_IDS,
  PAYERS,
  TREND_TAB_HIDDEN_CATEGORY_IDS,
  type Budget,
  type Category,
  type MonthlyTotalRow,
  type PayerId,
} from "@/lib/types";

interface Props {
  searchParams: Promise<{
    months?: string;
    payer?: string;
    pieYear?: string;
    pieMonth?: string;
    budgetYear?: string;
    budgetMonth?: string;
    trendCategory?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: Props) {
  const params = await searchParams;
  const months = Number(params.months) || 6;
  const payerId: PayerId = params.payer === "ちか子" ? "ちか子" : PAYERS[0];

  const now = new Date();
  const currentYearMonth = format(now, "yyyy-MM");
  const cutoffYearMonth = format(subMonths(now, months - 1), "yyyy-MM");

  const pieYear = Number(params.pieYear) || now.getFullYear();
  const pieMonth = Number(params.pieMonth) || now.getMonth() + 1;
  const pieYearMonth = `${pieYear}-${String(pieMonth).padStart(2, "0")}`;

  const budgetYear = Number(params.budgetYear) || now.getFullYear();
  const budgetMonth = Number(params.budgetMonth) || now.getMonth() + 1;
  const budgetYearMonth = `${budgetYear}-${String(budgetMonth).padStart(2, "0")}`;

  const trendCategory = params.trendCategory;

  const supabase = createServerClient();

  const [
    { data: monthlyTotals, error: totalsError },
    { data: pieTotals, error: pieError },
    { data: budgetMonthTotals, error: budgetTotalsError },
    { data: budgetMonthTransactions, error: txError },
    { data: categories, error: catError },
    { data: allBudgets, error: budgetError },
  ] = await Promise.all([
    supabase
      .from("v_monthly_totals")
      .select("*")
      .gte("year_month", cutoffYearMonth)
      .lte("year_month", currentYearMonth),
    supabase.from("v_monthly_totals").select("*").eq("year_month", pieYearMonth).eq("payer_id", payerId),
    supabase.from("v_monthly_totals").select("*").eq("year_month", budgetYearMonth).eq("payer_id", payerId),
    supabase
      .from("transactions")
      .select("date,total_amount,category_id")
      .eq("year_month", budgetYearMonth)
      .eq("payer_id", payerId),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("budgets").select("*").eq("payer_id", payerId),
  ]);

  if (totalsError || pieError || budgetTotalsError || txError || catError || budgetError) {
    return (
      <p className="text-red-600 dark:text-red-400">
        データの取得に失敗しました:{" "}
        {totalsError?.message ??
          pieError?.message ??
          budgetTotalsError?.message ??
          txError?.message ??
          catError?.message ??
          budgetError?.message}
      </p>
    );
  }

  const rows = (monthlyTotals ?? []) as MonthlyTotalRow[];
  const trend = aggregateMonthlyTrendByCategory(rows, payerId);
  const pieCategoryTotals = aggregateCategoryTotalsForMonth(
    (pieTotals ?? []) as MonthlyTotalRow[],
    pieYearMonth,
    payerId
  );
  const budgetCategoryTotals = aggregateCategoryTotalsForMonth(
    (budgetMonthTotals ?? []) as MonthlyTotalRow[],
    budgetYearMonth,
    payerId
  );

  const allCategories = (categories ?? []) as Category[];
  const budgetCategories = allCategories.filter(
    (c) => !BUDGET_HIDDEN_CATEGORY_IDS.includes(c.id as (typeof BUDGET_HIDDEN_CATEGORY_IDS)[number])
  );
  const trendTabCategories = allCategories.filter(
    (c) => !TREND_TAB_HIDDEN_CATEGORY_IDS.includes(c.id as (typeof TREND_TAB_HIDDEN_CATEGORY_IDS)[number])
  );

  const effectiveBudgets = resolveEffectiveBudgets((allBudgets ?? []) as Budget[], budgetYearMonth);

  // Budget management only concerns categories that actually have a budget
  // set (carried forward or explicit) — an unbudgeted discretionary category
  // shouldn't count toward the budget line or get its own line in the chart.
  const budgetedCategories = budgetCategories.filter((c) => effectiveBudgets[c.id] !== undefined);
  const budgetedCategoryIds = new Set(budgetedCategories.map((c) => c.id));

  const budgetedTransactions = (budgetMonthTransactions ?? []).filter((t) =>
    budgetedCategoryIds.has(t.category_id)
  );
  const cumulativeSpend = aggregateCumulativeDailySpendByCategory(
    budgetedTransactions,
    budgetYearMonth,
    [...budgetedCategoryIds]
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">支出分析</h1>
        <PersonTabs current={payerId} basePath="/expenses" />
      </div>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {payerId}の予算管理（{budgetYearMonth}）
          </h2>
          <YearMonthPicker
            year={budgetYear}
            month={budgetMonth}
            basePath="/expenses"
            yearParam="budgetYear"
            monthParam="budgetMonth"
          />
        </div>

        <div className="mb-4">
          <h3 className="mb-1 text-xs text-neutral-400">支出の積み上がり（費目別・予算ライン付き）</h3>
          <CumulativeSpendChart
            data={cumulativeSpend}
            categories={budgetedCategories}
            allCategories={allCategories}
            budgetAmounts={effectiveBudgets}
          />
        </div>

        <BudgetProgress
          categories={budgetCategories}
          budgetAmounts={effectiveBudgets}
          categoryTotals={budgetCategoryTotals}
        />
        <div className="mt-3">
          <BudgetEditor
            key={budgetYearMonth}
            categories={budgetCategories}
            payerId={payerId}
            yearMonth={budgetYearMonth}
            budgetAmounts={effectiveBudgets}
          />
        </div>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {payerId}の分類構成比
          </h2>
          <YearMonthPicker
            year={pieYear}
            month={pieMonth}
            basePath="/expenses"
            yearParam="pieYear"
            monthParam="pieMonth"
          />
        </div>
        <CategoryPieChart categories={allCategories} categoryTotals={pieCategoryTotals} />
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {payerId}の月次推移
          </h2>
          <PeriodPicker months={months} basePath="/expenses" />
        </div>
        <div className="mb-3">
          <TrendCategoryTabs categories={trendTabCategories} current={trendCategory} basePath="/expenses" />
        </div>
        <MonthlyTrendChart data={trend} categories={allCategories} selectedCategoryId={trendCategory} />
      </section>
    </div>
  );
}
