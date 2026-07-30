export type PayerId = "風馬" | "ちか子";

export const PAYERS: readonly PayerId[] = ["風馬", "ちか子"] as const;

export const UTILITY_CATEGORY_IDS = ["electricity", "gas", "water"] as const;

// These recur via fixed_costs and are auto-generated into transactions each
// month, so they're excluded from the manual /input entry form's category
// list (but still selectable on /fixed-costs).
export const FIXED_COST_ONLY_CATEGORY_IDS = ["rent", "investment", "subscription"] as const;

// Fixed/utility costs (and the catch-all "other") aren't meaningful to set a
// discretionary monthly budget against, so they're excluded from the budget
// editor and progress display on /expenses.
export const BUDGET_HIDDEN_CATEGORY_IDS = [
  "rent",
  "electricity",
  "water",
  "gas",
  "investment",
  "subscription",
  "other",
] as const;

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Transaction {
  id: string;
  date: string;
  year_month: string;
  payer_id: PayerId;
  category_id: string;
  total_amount: number;
  own_share: number;
  other_share: number;
  split_amount: number;
  fixed_cost_id: string | null;
  created_at: string;
}

export interface FixedCost {
  id: string;
  title: string;
  category_id: string;
  payer_id: PayerId;
  total_amount: number;
  own_share: number;
  other_share: number;
  day_of_month: number;
  active: boolean;
  created_at: string;
}

export interface Budget {
  category_id: string;
  payer_id: PayerId;
  monthly_amount: number;
  updated_at: string;
}

export interface MonthlyTotalRow {
  year_month: string;
  payer_id: PayerId;
  category_id: string;
  total_amount: number;
  own_share: number;
  other_share: number;
  split_amount: number;
  tx_count: number;
}
