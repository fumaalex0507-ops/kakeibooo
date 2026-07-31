import type { Budget, MonthlyTotalRow, PayerId, Transaction } from "./types";

export interface SettlementResult {
  /**
   * How much each person substantially bore of the OTHER person's portion
   * this month: for transactions they paid, their other_share (the other
   * person's exclusive share fronted for them) plus half of split_amount
   * (the other person's half of the shared pool). Equivalently, how much
   * the other person owes them.
   */
  burdenForOther: Record<PayerId, number>;
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
  const burdenForOther: Record<PayerId, number> = { 風馬: 0, ちか子: 0 };

  for (const t of transactions) {
    burdenForOther[t.payer_id] += t.other_share + t.split_amount / 2;
  }

  const net = burdenForOther["風馬"] - burdenForOther["ちか子"]; // positive => ちか子 owes 風馬

  if (net === 0) {
    return { burdenForOther, from: null, to: null, amount: 0 };
  }

  return net > 0
    ? { burdenForOther, from: "ちか子", to: "風馬", amount: Math.round(net) }
    : { burdenForOther, from: "風馬", to: "ちか子", amount: Math.round(-net) };
}

export function utilityStatus(transactions: Transaction[]) {
  const present = new Set(transactions.map((t) => t.category_id));
  return {
    electricity: present.has("electricity"),
    gas: present.has("gas"),
    water: present.has("water"),
  };
}

export type MonthlyCategoryPoint = { year_month: string } & Record<string, number>;

/**
 * A row only carries one payer_id (whoever paid), but a split (折半) cost is
 * meant to count as half for each person. A row's contribution to a given
 * person's true spend is: their own exclusive share, plus half of whatever
 * was split — regardless of which of the two people the row's payer_id is —
 * mirroring computeSettlement's halving of split_amount.
 */
function payerShare(
  row: { payer_id: PayerId; own_share: number; other_share: number; split_amount: number },
  payerId: PayerId
): number {
  return row.payer_id === payerId
    ? row.own_share + row.split_amount / 2
    : row.other_share + row.split_amount / 2;
}

/**
 * One point per month, with each category's total_amount as its own key —
 * drives the stacked monthly trend bar chart (one Bar per category) so the
 * composition within each month is visible, not just the combined total.
 */
export function aggregateMonthlyTrendByCategory(
  rows: MonthlyTotalRow[],
  payerId: PayerId
): MonthlyCategoryPoint[] {
  const byMonth = new Map<string, MonthlyCategoryPoint>();
  for (const r of rows) {
    const point = byMonth.get(r.year_month) ?? ({ year_month: r.year_month } as MonthlyCategoryPoint);
    point[r.category_id] = (point[r.category_id] ?? 0) + payerShare(r, payerId);
    byMonth.set(r.year_month, point);
  }
  return [...byMonth.values()].sort((a, b) => a.year_month.localeCompare(b.year_month));
}

/** Total per category for a single month, scoped to one payer — drives per-person budget progress. */
export function aggregateCategoryTotalsForMonth(
  rows: MonthlyTotalRow[],
  yearMonth: string,
  payerId: PayerId
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const r of rows) {
    if (r.year_month !== yearMonth) continue;
    totals[r.category_id] = (totals[r.category_id] ?? 0) + payerShare(r, payerId);
  }
  return totals;
}

/**
 * Budgets are set per (category, payer, month), but a month with no
 * explicit row should carry forward the most recent prior month's amount
 * rather than showing zero — so for each category, pick the row with the
 * latest year_month that is <= targetYearMonth out of all of that payer's
 * budget rows (caller is expected to have already filtered to one payer).
 */
export function resolveEffectiveBudgets(rows: Budget[], targetYearMonth: string): Record<string, number> {
  const best: Record<string, { year_month: string; amount: number }> = {};
  for (const r of rows) {
    if (r.year_month > targetYearMonth) continue;
    const current = best[r.category_id];
    if (!current || r.year_month > current.year_month) {
      best[r.category_id] = { year_month: r.year_month, amount: r.monthly_amount };
    }
  }
  const result: Record<string, number> = {};
  for (const [categoryId, v] of Object.entries(best)) result[categoryId] = v.amount;
  return result;
}

export type CumulativeSpendByCategoryPoint = { day: number } & Record<string, number>;

/**
 * Running daily total per category across the given month's transactions,
 * for the budget burn-up chart — one series per category so each can be
 * color-coded and shown in a legend, rather than one combined line.
 */
export function aggregateCumulativeDailySpendByCategory(
  transactions: {
    date: string;
    category_id: string;
    payer_id: PayerId;
    own_share: number;
    other_share: number;
    split_amount: number;
  }[],
  yearMonth: string,
  categoryIds: string[],
  payerId: PayerId
): CumulativeSpendByCategoryPoint[] {
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();

  const dailyByCategory: Record<string, number[]> = {};
  for (const id of categoryIds) dailyByCategory[id] = new Array(lastDay + 1).fill(0);

  for (const t of transactions) {
    if (!dailyByCategory[t.category_id]) continue;
    const day = Number(t.date.split("-")[2]);
    if (day >= 1 && day <= lastDay) dailyByCategory[t.category_id][day] += payerShare(t, payerId);
  }

  const running: Record<string, number> = {};
  for (const id of categoryIds) running[id] = 0;

  const points: CumulativeSpendByCategoryPoint[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const point = { day } as CumulativeSpendByCategoryPoint;
    for (const id of categoryIds) {
      running[id] += dailyByCategory[id][day];
      point[id] = running[id];
    }
    points.push(point);
  }
  return points;
}
