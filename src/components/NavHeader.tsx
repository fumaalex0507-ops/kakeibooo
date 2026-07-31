"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";

const LINKS = [
  { href: "/input", label: "入力" },
  { href: "/settlement", label: "精算" },
  { href: "/expenses", label: "分析" },
  { href: "/fixed-costs", label: "固定費" },
];

export function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await supabase.rpc("generate_fixed_cost_transactions", {
      p_year_month: format(new Date(), "yyyy-MM"),
    });
    router.refresh();
    setRefreshing(false);
  }

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <nav className="flex gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname?.startsWith(link.href)
                ? "bg-teal-600 text-white"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="ml-auto rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {refreshing ? "更新中..." : "更新"}
      </button>
    </header>
  );
}
