"use client";

import { useState } from "react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";

interface Props {
  status: { electricity: boolean; gas: boolean; water: boolean };
  yearMonth: string;
  initialWaterSkipped: boolean;
}

const LABELS: Record<keyof Props["status"], string> = {
  electricity: "電気",
  gas: "ガス",
  water: "水道",
};

export function UtilityStatusBadges({ status, yearMonth, initialWaterSkipped }: Props) {
  const [waterSkipped, setWaterSkipped] = useState(initialWaterSkipped);

  async function toggleWaterSkip() {
    const next = !waterSkipped;
    setWaterSkipped(next);
    const { error } = await supabase
      .from("settlement_status")
      .upsert({ year_month: yearMonth, water_skipped: next });
    if (error) setWaterSkipped(!next);
  }

  return (
    <div className="flex gap-3">
      {(Object.keys(LABELS) as (keyof Props["status"])[]).map((key) => {
        const done = status[key];
        const isSkippableWater = key === "water" && !done;
        const showAsSkip = isSkippableWater && waterSkipped;
        const green = done || showAsSkip;

        const badgeClassName = clsx(
          "rounded-full px-3 py-1 text-sm font-medium",
          green
            ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
          isSkippableWater && "cursor-pointer"
        );
        const label = `${LABELS[key]}: ${done ? "済" : showAsSkip ? "skip" : "未"}`;

        if (isSkippableWater) {
          return (
            <button key={key} type="button" onClick={toggleWaterSkip} className={badgeClassName}>
              {label}
            </button>
          );
        }

        return (
          <span key={key} className={badgeClassName}>
            {label}
          </span>
        );
      })}
    </div>
  );
}
