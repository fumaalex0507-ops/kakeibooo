"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/client";

const CACHE_KEY = "fixedCostsGeneratedFor";

// Idempotency is guaranteed by the DB-level unique index on
// (fixed_cost_id, year_month) in generate_fixed_cost_transactions — the
// localStorage check here is purely to skip a redundant RPC round-trip on
// every navigation within the same month, never relied on for correctness.
export function AppInit() {
  useEffect(() => {
    const yearMonth = format(new Date(), "yyyy-MM");
    if (window.localStorage.getItem(CACHE_KEY) === yearMonth) return;

    supabase
      .rpc("generate_fixed_cost_transactions", { p_year_month: yearMonth })
      .then(({ error }) => {
        if (!error) {
          window.localStorage.setItem(CACHE_KEY, yearMonth);
        }
      });
  }, []);

  return null;
}
