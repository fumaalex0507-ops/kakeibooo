"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [3, 6, 12, 24];
const CUSTOM_VALUE = "custom";

interface Props {
  months: number;
  isCustom: boolean;
  basePath: string;
}

export function PeriodPicker({ months, isCustom, basePath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === CUSTOM_VALUE) {
      params.set("trendMode", CUSTOM_VALUE);
    } else {
      params.delete("trendMode");
      params.delete("trendFromYear");
      params.delete("trendFromMonth");
      params.delete("trendToYear");
      params.delete("trendToMonth");
      params.set("months", value);
    }
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  return (
    <select
      value={isCustom ? CUSTOM_VALUE : months}
      onChange={(e) => navigate(e.target.value)}
      className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      {OPTIONS.map((m) => (
        <option key={m} value={m}>
          直近{m}ヶ月
        </option>
      ))}
      <option value={CUSTOM_VALUE}>期間を指定</option>
    </select>
  );
}
