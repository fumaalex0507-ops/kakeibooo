"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  year: number;
  month: number; // 1-12
  basePath: string;
  yearParam?: string;
  monthParam?: string;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function YearMonthPicker({
  year,
  month,
  basePath,
  yearParam = "year",
  monthParam = "month",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i);

  function navigate(nextYear: number, nextMonth: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(yearParam, String(nextYear));
    params.set(monthParam, String(nextMonth).padStart(2, "0"));
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={year}
        onChange={(e) => navigate(Number(e.target.value), month)}
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}年
          </option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => navigate(year, Number(e.target.value))}
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}月
          </option>
        ))}
      </select>
    </div>
  );
}
