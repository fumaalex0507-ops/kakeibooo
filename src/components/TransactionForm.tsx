"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";
import { evaluateExpression } from "@/lib/calculator";
import { PAYERS, type Category } from "@/lib/types";

interface Props {
  categories: Category[];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({ categories }: Props) {
  const [date, setDate] = useState(todayIso());
  const [payerId, setPayerId] = useState(PAYERS[0]);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [totalAmount, setTotalAmount] = useState("");
  const [ownShare, setOwnShare] = useState("0");
  const [otherShare, setOtherShare] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const totalResult = evaluateExpression(totalAmount);
  const ownResult = evaluateExpression(ownShare);
  const otherResult = evaluateExpression(otherShare);

  const total = totalResult ?? 0;
  const own = ownResult ?? 0;
  const other = otherResult ?? 0;
  const splitAmount = total - (own + other);

  const hasInvalidExpression = totalResult === null || ownResult === null || otherResult === null;
  const isNegativeSplit = splitAmount < 0;
  const isTotalMissing = total <= 0;
  const canSubmit = !isNegativeSplit && !isTotalMissing && !hasInvalidExpression && !submitting;

  const splitDisplay = useMemo(() => splitAmount.toLocaleString("ja-JP"), [splitAmount]);

  // On blur, resolve a typed expression (e.g. "500+300") down to its plain
  // numeric result, so the field reads like a calculator that just computed
  // an answer rather than leaving the raw formula sitting there.
  function resolveOnBlur(raw: string, setValue: (v: string) => void) {
    const result = evaluateExpression(raw);
    if (result !== null && raw.trim() !== "") {
      setValue(String(result));
    }
  }

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
          type="text"
          inputMode="decimal"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          onBlur={() => resolveOnBlur(totalAmount, setTotalAmount)}
          className={clsx(
            "rounded-md border px-3 py-2 dark:bg-neutral-900",
            totalResult === null
              ? "border-red-400 dark:border-red-700"
              : "border-neutral-300 dark:border-neutral-700"
          )}
          placeholder="0 または 500+300 のように計算式も入力できます"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">自己負担</label>
          <input
            type="text"
            inputMode="decimal"
            value={ownShare}
            onChange={(e) => setOwnShare(e.target.value)}
            onBlur={() => resolveOnBlur(ownShare, setOwnShare)}
            className={clsx(
              "rounded-md border px-3 py-2 dark:bg-neutral-900",
              ownResult === null
                ? "border-red-400 dark:border-red-700"
                : "border-neutral-300 dark:border-neutral-700"
            )}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">相手立替</label>
          <input
            type="text"
            inputMode="decimal"
            value={otherShare}
            onChange={(e) => setOtherShare(e.target.value)}
            onBlur={() => resolveOnBlur(otherShare, setOtherShare)}
            className={clsx(
              "rounded-md border px-3 py-2 dark:bg-neutral-900",
              otherResult === null
                ? "border-red-400 dark:border-red-700"
                : "border-neutral-300 dark:border-neutral-700"
            )}
          />
        </div>
      </div>
      {hasInvalidExpression && (
        <p className="text-sm text-red-600 dark:text-red-400">
          計算式が正しくありません（数字と + − × ÷ ( ) のみ使えます）。
        </p>
      )}

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
