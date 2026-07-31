"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";
import { evaluateExpression } from "@/lib/calculator";
import { aggregateCategoryTotalsForMonth, resolveEffectiveBudgets } from "@/lib/calculations";
import { CalculatorPopup } from "@/components/CalculatorPopup";
import { CalculatorIcon } from "@/components/icons/CalculatorIcon";
import { BudgetProgress } from "@/components/BudgetProgress";
import { colorForCategory, colorForPayer } from "@/lib/colors";
import { PAYERS, type Budget, type Category, type MonthlyTotalRow } from "@/lib/types";

interface Props {
  categories: Category[];
  allCategories: Category[];
  budgetCategories: Category[];
  monthlyTotals: MonthlyTotalRow[];
  allBudgets: Budget[];
}

function todayIso() {
  // toISOString() converts to UTC, which would show yesterday's date for
  // JST users between 0:00-8:59 local time — build the string from local
  // getFullYear/Month/Date instead so it always matches the user's clock.
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TransactionForm({ categories, allCategories, budgetCategories, monthlyTotals, allBudgets }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(todayIso());
  const [payerId, setPayerId] = useState(PAYERS[0]);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [totalAmount, setTotalAmount] = useState("");
  const [ownShare, setOwnShare] = useState("0");
  const [otherShare, setOtherShare] = useState("0");
  const [ownTouched, setOwnTouched] = useState(false);
  const [otherTouched, setOtherTouched] = useState(false);
  const [activeCalculator, setActiveCalculator] = useState<"own" | "other" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const ownResult = evaluateExpression(ownShare);
  const otherResult = evaluateExpression(otherShare);

  const total = Number(totalAmount) || 0;
  const own = ownResult ?? 0;
  const other = otherResult ?? 0;
  const splitAmount = total - (own + other);

  const hasInvalidExpression = ownResult === null || otherResult === null;
  // Only surface the invalid-expression error once the user has left the
  // field — "300+" is a perfectly normal mid-typing state, not a mistake.
  const showOwnError = ownTouched && ownResult === null;
  const showOtherError = otherTouched && otherResult === null;
  const isNegativeSplit = splitAmount < 0;
  const isTotalMissing = total <= 0;
  const canSubmit = !isNegativeSplit && !isTotalMissing && !hasInvalidExpression && !submitting;

  const splitDisplay = useMemo(() => splitAmount.toLocaleString("ja-JP"), [splitAmount]);

  const yearMonth = date.slice(0, 7);
  const effectiveBudgets = useMemo(
    () => resolveEffectiveBudgets(allBudgets.filter((b) => b.payer_id === payerId), yearMonth),
    [allBudgets, payerId, yearMonth]
  );
  const budgetCategoryTotals = useMemo(
    () => aggregateCategoryTotalsForMonth(monthlyTotals, yearMonth, payerId),
    [monthlyTotals, yearMonth, payerId]
  );

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
    // Budget totals were fetched server-side on page load — refresh so the
    // progress bars below pick up this transaction's contribution.
    router.refresh();
  }

  return (
    <>
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
        <div className="flex gap-2 text-sm">
          {PAYERS.map((payer) => {
            const isSelected = payerId === payer;
            return (
              <button
                key={payer}
                type="button"
                onClick={() => setPayerId(payer)}
                className={clsx(
                  "rounded-md border px-3 py-1.5 font-medium transition-colors",
                  isSelected
                    ? "border-transparent text-white"
                    : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                )}
                style={isSelected ? { backgroundColor: colorForPayer(payer) } : undefined}
              >
                {payer}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">分類</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-fit rounded-full px-3 py-1.5 text-sm font-semibold text-white"
          style={{ backgroundColor: colorForCategory(categoryId, allCategories) }}
          required
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-white dark:bg-neutral-900">
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
          <label className="flex items-center gap-1.5 text-sm font-medium">
            自己負担
            <button
              type="button"
              onClick={() => setActiveCalculator("own")}
              aria-label="自己負担を電卓で計算"
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <CalculatorIcon className="h-4 w-4" />
            </button>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={ownShare}
            onChange={(e) => setOwnShare(e.target.value)}
            onFocus={(e) => {
              e.target.select();
              setOwnTouched(false);
            }}
            onBlur={() => {
              resolveOnBlur(ownShare, setOwnShare);
              setOwnTouched(true);
            }}
            className={clsx(
              "rounded-md border px-3 py-2 dark:bg-neutral-900",
              showOwnError ? "border-red-400 dark:border-red-700" : "border-neutral-300 dark:border-neutral-700"
            )}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1.5 text-sm font-medium">
            相手立替
            <button
              type="button"
              onClick={() => setActiveCalculator("other")}
              aria-label="相手立替を電卓で計算"
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <CalculatorIcon className="h-4 w-4" />
            </button>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={otherShare}
            onChange={(e) => setOtherShare(e.target.value)}
            onFocus={(e) => {
              e.target.select();
              setOtherTouched(false);
            }}
            onBlur={() => {
              resolveOnBlur(otherShare, setOtherShare);
              setOtherTouched(true);
            }}
            className={clsx(
              "rounded-md border px-3 py-2 dark:bg-neutral-900",
              showOtherError ? "border-red-400 dark:border-red-700" : "border-neutral-300 dark:border-neutral-700"
            )}
          />
        </div>
      </div>
      {(showOwnError || showOtherError) && (
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

      {activeCalculator === "own" && (
        <CalculatorPopup
          title="自己負担"
          onInput={(value) => setOwnShare(String(value))}
          onClose={() => setActiveCalculator(null)}
        />
      )}
      {activeCalculator === "other" && (
        <CalculatorPopup
          title="相手立替"
          onInput={(value) => setOtherShare(String(value))}
          onClose={() => setActiveCalculator(null)}
        />
      )}
    </form>
    <div className="mx-auto mt-8 max-w-md">
      <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {payerId}の{yearMonth}予算
      </h2>
      <BudgetProgress
        categories={budgetCategories}
        budgetAmounts={effectiveBudgets}
        categoryTotals={budgetCategoryTotals}
        showEditorHint={false}
      />
    </div>
    </>
  );
}
