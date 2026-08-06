"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";
import { RefreshIcon } from "@/components/icons/RefreshIcon";
import { NAV_LINKS } from "@/lib/navLinks";

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
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-950">
      <nav className="flex gap-1">
        {NAV_LINKS.map((link) => (
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
        aria-label="更新"
        title="更新"
        className="ml-auto rounded-md p-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <RefreshIcon className={clsx("h-5 w-5", refreshing && "animate-spin")} />
      </button>
    </header>
  );
}
