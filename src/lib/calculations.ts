import type { MonthlyTotalRow, PayerId, Transaction } from "./types";

export interface SettlementResult {
  /** Total amount each person fronted (sum of total_amount), for display context */
  frontedTotal: Record<PayerId, number>;
  /** Who pays whom, and how much. amount is always >= 0. */
  from: PayerId | null;
  to: PayerId | null;
  amount: number;
}

/**
 * For a transaction paid by payer P: the other person owes P
 * `other_share + split_amount / 2` (their own exclusive share, plus half
 * the shared pool). Accumulated per payer across all transactions, then
 * netted. Rounding happens only once, on the final net figure, so per-row
 * rounding never compounds drift across many transactions.
 */
export function computeSettlement(transactions: Transaction[]): SettlementResult {
  const owedTo: Record<PayerId, number> = { 風馬: 0, ちか子: 0 };
  const frontedTotal: Record<PayerId, number> = { 風馬: 0, ちか子: 0 };

  for (const t of transactions) {
    owedTo[t.payer_id] += t.other_share + t.split_amount / 2;
    frontedTotal[t.payer_id] += t.total_amount;
  }

  const net = owedTo["風馬"] - owedTo["ちか子"]; // positive => ちか子 owes 風馬

  if (net === 0) {
    return { frontedTotal, from: null, to: null, amount: 0 };
  }

  return net > 0
    ? { frontedTotal, from: "ちか子", to: "風馬", amount: Math.round(net) }
    : { frontedTotal, from: "風馬", to: "ちか子", amount: Math.round(-net) };
}

export function utilityStatus(transactions: Transaction[]) {
  const present = new Set(transactions.map((t) => t.category_id));
  return {
    electricity: present.has("electricity"),
    gas: present.has("gas"),
    water: present.has("water"),
  };
}

export interface MonthlyTrendPoint {
  year_month: string;
  total: number;
}

/** One point per month: combined total_amount across both payers, for the trend chart. */
export function aggregateMonthlyTrend(rows: MonthlyTotalRow[]): MonthlyTrendPoint[] {
  const byMonth = new Map<string, number>();
  for (const r of rows) {
    byMonth.set(r.year_month, (byMonth.get(r.year_month) ?? 0) + r.total_amount);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year_month, total]) => ({ year_month, total }));
}

export interface PersonBreakdownPoint {
  year_month: string;
  風馬: number;
  ちか子: number;
}

/** One point per month with each payer's total, for the grouped bar comparison. */
export function aggregatePersonBreakdown(rows: MonthlyTotalRow[]): PersonBreakdownPoint[] {
  const byMonth = new Map<string, PersonBreakdownPoint>();
  for (const r of rows) {
    const point = byMonth.get(r.year_month) ?? { year_month: r.year_month, 風馬: 0, ちか子: 0 };
    point[r.payer_id] += r.total_amount;
    byMonth.set(r.year_month, point);
  }
  return [...byMonth.values()].sort((a, b) => a.year_month.localeCompare(b.year_month));
}

/** Combined (both payers) total per category, for a single month — drives budget progress. */
export function aggregateCategoryTotalsForMonth(
  rows: MonthlyTotalRow[],
  yearMonth: string
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const r of rows) {
    if (r.year_month !== yearMonth) continue;
    totals[r.category_id] = (totals[r.category_id] ?? 0) + r.total_amount;
  }
  return totals;
}
