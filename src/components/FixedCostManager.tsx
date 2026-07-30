"use client";

import { useState } from "react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";
import { PAYERS, type Category, type FixedCost } from "@/lib/types";

interface Props {
  categories: Category[];
  initialFixedCosts: FixedCost[];
}

export function FixedCostManager({ categories, initialFixedCosts }: Props) {
  const [fixedCosts, setFixedCosts] = useState(initialFixedCosts);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [payerId, setPayerId] = useState(PAYERS[0]);
  const [totalAmount, setTotalAmount] = useState("");
  const [ownShare, setOwnShare] = useState("0");
  const [otherShare, setOtherShare] = useState("0");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const { data, error } = await supabase
      .from("fixed_costs")
      .insert({
        title,
        category_id: categoryId,
        payer_id: payerId,
        total_amount: Number(totalAmount) || 0,
        own_share: Number(ownShare) || 0,
        other_share: Number(otherShare) || 0,
        day_of_month: Number(dayOfMonth) || 1,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setFixedCosts((prev) => [...prev, data as FixedCost]);
    setTitle("");
    setTotalAmount("");
    setOwnShare("0");
    setOtherShare("0");
    setDayOfMonth("1");
  }

  async function toggleActive(fc: FixedCost) {
    const { error } = await supabase
      .from("fixed_costs")
      .update({ active: !fc.active })
      .eq("id", fc.id);
    if (!error) {
      setFixedCosts((prev) => prev.map((f) => (f.id === fc.id ? { ...f, active: !f.active } : f)));
    }
  }

  async function remove(fc: FixedCost) {
    const { error } = await supabase.from("fixed_costs").delete().eq("id", fc.id);
    if (!error) {
      setFixedCosts((prev) => prev.filter((f) => f.id !== fc.id));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {fixedCosts.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">固定費はまだ登録されていません。</p>
        )}
        {fixedCosts.map((fc) => (
          <div
            key={fc.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
          >
            <div>
              <span className="font-medium">{fc.title}</span>{" "}
              <span className="text-neutral-500 dark:text-neutral-400">
                （{categoryName(fc.category_id)}・{fc.payer_id}・毎月{fc.day_of_month}日・¥
                {fc.total_amount.toLocaleString("ja-JP")}）
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleActive(fc)}
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs",
                  fc.active
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                )}
              >
                {fc.active ? "有効" : "停止中"}
              </button>
              <button
                type="button"
                onClick={() => remove(fc)}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-medium">固定費を追加</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="項目名（例: 家賃）"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value as (typeof PAYERS)[number])}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {PAYERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            inputMode="numeric"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="総額"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            required
          />
          <input
            type="number"
            inputMode="numeric"
            value={ownShare}
            onChange={(e) => setOwnShare(e.target.value)}
            placeholder="自分独自負担額"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <input
            type="number"
            inputMode="numeric"
            value={otherShare}
            onChange={(e) => setOtherShare(e.target.value)}
            placeholder="相手独自負担額"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          発生日（毎月）
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={28}
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            className="w-20 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          日
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          追加
        </button>
      </form>
    </div>
  );
}
