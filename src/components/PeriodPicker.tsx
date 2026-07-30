"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [3, 6, 12, 24];

export function PeriodPicker({ months, basePath }: { months: number; basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(nextMonths: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("months", nextMonths);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <select
      value={months}
      onChange={(e) => navigate(e.target.value)}
      className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      {OPTIONS.map((m) => (
        <option key={m} value={m}>
          直近{m}ヶ月
        </option>
      ))}
    </select>
  );
}
