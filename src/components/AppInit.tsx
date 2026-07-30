"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/client";

// Idempotency is guaranteed by the DB-level unique index on
// (fixed_cost_id, year_month) in generate_fixed_cost_transactions, so this
// runs unconditionally on every mount — a fixed cost added mid-month must
// still get this month's transaction generated on the next page load.
export function AppInit() {
  useEffect(() => {
    const yearMonth = format(new Date(), "yyyy-MM");
    supabase.rpc("generate_fixed_cost_transactions", { p_year_month: yearMonth });
  }, []);

  return null;
}
