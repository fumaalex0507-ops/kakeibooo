"use client";

import { useRouter } from "next/navigation";

const OPTIONS = [3, 6, 12, 24];

export function PeriodPicker({ months, basePath }: { months: number; basePath: string }) {
  const router = useRouter();

  return (
    <select
      value={months}
      onChange={(e) => router.push(`${basePath}?months=${e.target.value}`)}
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
