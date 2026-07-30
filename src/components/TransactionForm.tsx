"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PAYERS, type Category } from "@/lib/types";

interface Props {
  categories: Category[];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({ categories }: Props) {
  const { currentUser } = useCurrentUser();

  const [date, setDate] = useState(todayIso());
  const [payerId, setPayerId] = useState(currentUser);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [totalAmount, setTotalAmount] = useState("");
  const [ownShare, setOwnShare] = useState("0");
  const [otherShare, setOtherShare] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const total = Number(totalAmount) || 0;
  const own = Number(ownShare) || 0;
  const other = Number(otherShare) || 0;
  const splitAmount = total - (own + other);

  const isNegativeSplit = splitAmount < 0;
  const isTotalMissing = total <= 0;
  const canSubmit = !isNegativeSplit && !isTotalMissing && !submitting;

  const splitDisplay = useMemo(() => splitAmount.toLocaleString("ja-JP"), [splitAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);
    setJustSaved(false);

    const { error } = await supabase.from("transactions").insert({
      date,
      payer_id: payerId,
      category_id: categoryId,
      total_amount: total,
      own_share: own,
      other_share: other,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setJustSaved(true);
    setTotalAmount("");
    setOwnShare("0");
    setOtherShare("0");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">支払い者</label>
        <div className="inline-flex rounded-full border border-neutral-300 p-1 text-sm dark:border-neutral-700">
          {PAYERS.map((payer) => (
            <button
              key={payer}
              type="button"
              onClick={() => setPayerId(payer)}
              className={clsx(
                "rounded-full px-3 py-1 transition-colors",
                payerId === payer
                  ? "bg-teal-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              )}
            >
              {payer}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">分類</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          required
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">支払い総額</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          placeholder="0"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">自己負担</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={ownShare}
            onChange={(e) => setOwnShare(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">相手立替</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={otherShare}
            onChange={(e) => setOtherShare(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      <div
        className={clsx(
          "rounded-md border px-3 py-2 text-sm",
          isNegativeSplit
            ? "border-red-400 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            : "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
        )}
      >
        折半額: <span className="font-semibold">¥{splitDisplay}</span>
        {isNegativeSplit && (
          <p className="mt-1">
            折半額がマイナスです。自己負担と相手立替の合計が支払い総額を超えています。
          </p>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-red-600 dark:text-red-400">保存に失敗しました: {submitError}</p>
      )}
      {justSaved && <p className="text-sm text-teal-700 dark:text-teal-400">保存しました。</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className={clsx(
          "rounded-md px-4 py-2 font-medium text-white transition-colors",
          canSubmit ? "bg-teal-600 hover:bg-teal-700" : "cursor-not-allowed bg-neutral-300 dark:bg-neutral-700"
        )}
      >
        {submitting ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
