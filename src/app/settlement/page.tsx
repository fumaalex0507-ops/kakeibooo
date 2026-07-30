import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { computeSettlement, utilityStatus } from "@/lib/calculations";
import { YearMonthPicker } from "@/components/YearMonthPicker";
import { SettlementSummary } from "@/components/SettlementSummary";
import { UtilityStatusBadges } from "@/components/UtilityStatusBadges";
import { TransactionTable } from "@/components/TransactionTable";
import type { Category, Transaction } from "@/lib/types";

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function SettlementPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  if (!params.year || !params.month) {
    redirect(`/settlement?year=${year}&month=${String(month).padStart(2, "0")}`);
  }

  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;
  const supabase = createServerClient();

  const [{ data: transactions, error: txError }, { data: categories, error: catError }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("year_month", yearMonth)
        .order("date"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);

  if (txError || catError) {
    return (
      <p className="text-red-600 dark:text-red-400">
        データの取得に失敗しました: {txError?.message ?? catError?.message}
      </p>
    );
  }

  const rows = (transactions ?? []) as Transaction[];
  const settlement = computeSettlement(rows);
  const status = utilityStatus(rows);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">精算ダッシュボード</h1>
        <YearMonthPicker year={year} month={month} basePath="/settlement" />
      </div>

      <SettlementSummary result={settlement} />

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          光熱費の入力ステータス
        </h2>
        <UtilityStatusBadges status={status} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">明細一覧</h2>
        <TransactionTable transactions={rows} categories={(categories ?? []) as Category[]} />
      </div>
    </div>
  );
}
