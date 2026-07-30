"use client";

import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { PAYERS, type PayerId } from "@/lib/types";

export function PersonTabs({ current, basePath }: { current: PayerId; basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(payer: PayerId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("payer", payer);
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="inline-flex rounded-full border border-neutral-300 p-1 text-sm dark:border-neutral-700">
      {PAYERS.map((payer) => (
        <button
          key={payer}
          type="button"
          onClick={() => navigate(payer)}
          className={clsx(
            "rounded-full px-3 py-1 transition-colors",
            current === payer
              ? "bg-teal-600 text-white"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          )}
        >
          {payer}
        </button>
      ))}
    </div>
  );
}
