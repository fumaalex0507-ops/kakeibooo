"use client";

import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  current?: string; // category id, or undefined for "全体"
  basePath: string;
}

export function TrendCategoryTabs({ categories, current, basePath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(categoryId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set("trendCategory", categoryId);
    } else {
      params.delete("trendCategory");
    }
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-1 text-sm">
      <button
        type="button"
        onClick={() => navigate(null)}
        className={clsx(
          "rounded-full px-3 py-1 transition-colors",
          !current
            ? "bg-teal-600 text-white"
            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        )}
      >
        全体
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => navigate(c.id)}
          className={clsx(
            "rounded-full px-3 py-1 transition-colors",
            current === c.id
              ? "bg-teal-600 text-white"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
