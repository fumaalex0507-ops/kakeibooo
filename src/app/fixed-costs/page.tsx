import { createServerClient } from "@/lib/supabase/server";
import { FixedCostManager } from "@/components/FixedCostManager";
import type { Category, FixedCost } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FixedCostsPage() {
  const supabase = createServerClient();

  const [{ data: fixedCosts, error: fcError }, { data: categories, error: catError }] =
    await Promise.all([
      supabase.from("fixed_costs").select("*").order("created_at"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);

  if (fcError || catError) {
    return (
      <p className="text-red-600 dark:text-red-400">
        データの取得に失敗しました: {fcError?.message ?? catError?.message}
      </p>
    );
  }

  return (
    <div>
      <FixedCostManager
        categories={(categories ?? []) as Category[]}
        initialFixedCosts={(fixedCosts ?? []) as FixedCost[]}
      />
    </div>
  );
}
