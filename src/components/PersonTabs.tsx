"use client";

import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { colorForPayer } from "@/lib/colors";
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
    <div className="flex gap-2 text-sm">
      {PAYERS.map((payer) => {
        const isSelected = current === payer;
        return (
          <button
            key={payer}
            type="button"
            onClick={() => navigate(payer)}
            className={clsx(
              "rounded-full px-3 py-1 transition-colors",
              isSelected
                ? "text-white"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            )}
            style={isSelected ? { backgroundColor: colorForPayer(payer) } : undefined}
          >
            {payer}
          </button>
        );
      })}
    </div>
  );
}
