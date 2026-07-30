"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Props {
  yearMonth: string;
  initialCompleted: boolean;
  initialCompletedAt: string | null;
}

export function SettlementCompletionToggle({ yearMonth, initialCompleted, initialCompletedAt }: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [completedAt, setCompletedAt] = useState(initialCompletedAt);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !completed;
    setSaving(true);
    const nowIso = next ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("settlement_status")
      .upsert({ year_month: yearMonth, completed: next, completed_at: nowIso });

    setSaving(false);
    if (!error) {
      setCompleted(next);
      setCompletedAt(nowIso);
    }
  }

  return (
    <label className="flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
      <input
        type="checkbox"
        checked={completed}
        onChange={toggle}
        disabled={saving}
        className="h-4 w-4 rounded border-neutral-300 text-teal-600 focus:ring-teal-600 dark:border-neutral-700"
      />
      精算完了
      {completed && completedAt && (
        <span className="text-xs text-neutral-400">
          （{new Date(completedAt).toLocaleDateString("ja-JP")}）
        </span>
      )}
    </label>
  );
}
