"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";
import { PAYERS, type Category, type PayerId, type Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
  categories: Category[];
}

interface EditFields {
  date: string;
  payerId: PayerId;
  categoryId: string;
  totalAmount: string;
  ownShare: string;
  otherShare: string;
}

function transactionToFields(t: Transaction): EditFields {
  return {
    date: t.date,
    payerId: t.payer_id,
    categoryId: t.category_id,
    totalAmount: String(t.total_amount),
    ownShare: String(t.own_share),
    otherShare: String(t.other_share),
  };
}

function TransactionEditRow({
  categories,
  fields,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
}: {
  categories: Category[];
  fields: EditFields;
  onChange: (fields: EditFields) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const total = Number(fields.totalAmount) || 0;
  const own = Number(fields.ownShare) || 0;
  const other = Number(fields.otherShare) || 0;
  const splitAmount = total - (own + other);
  const isNegativeSplit = splitAmount < 0;

  return (
    <tr className="border-b border-neutral-100 bg-neutral-50 dark:border-neutral-900 dark:bg-neutral-900/50">
      <td className="py-2 pr-2">
        <input
          type="date"
          value={fields.date}
          onChange={(e) => onChange({ ...fields, date: e.target.value })}
          className="w-36 rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </td>
      <td className="py-2 pr-2">
        <select
          value={fields.payerId}
          onChange={(e) => onChange({ ...fields, payerId: e.target.value as PayerId })}
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          {PAYERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-2">
        <select
          value={fields.categoryId}
          onChange={(e) => onChange({ ...fields, categoryId: e.target.value })}
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={fields.totalAmount}
          onChange={(e) => onChange({ ...fields, totalAmount: e.target.value })}
          className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-right text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={fields.ownShare}
          onChange={(e) => onChange({ ...fields, ownShare: e.target.value })}
          className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-right text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={fields.otherShare}
          onChange={(e) => onChange({ ...fields, otherShare: e.target.value })}
          className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-right text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </td>
      <td className={clsx("py-2 pr-2 text-right", isNegativeSplit && "text-red-600 dark:text-red-400")}>
        ¥{splitAmount.toLocaleString("ja-JP")}
      </td>
      <td className="py-2">
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || isNegativeSplit || total <= 0}
              className="rounded-md bg-teal-600 px-2 py-1 text-xs font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
            >
              キャンセル
            </button>
          </div>
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </td>
    </tr>
  );
}

export function TransactionTable({ transactions: initialTransactions, categories }: Props) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fields, setFields] = useState<EditFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  function startEditing(t: Transaction) {
    setEditingId(t.id);
    setFields(transactionToFields(t));
    setError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setFields(null);
    setError(null);
  }

  async function save() {
    if (!editingId || !fields) return;
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("transactions")
      .update({
        date: fields.date,
        payer_id: fields.payerId,
        category_id: fields.categoryId,
        total_amount: Number(fields.totalAmount) || 0,
        own_share: Number(fields.ownShare) || 0,
        other_share: Number(fields.otherShare) || 0,
      })
      .eq("id", editingId)
      .select()
      .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setTransactions((prev) => prev.map((t) => (t.id === editingId ? (data as Transaction) : t)));
    cancelEditing();
    // The settlement summary and utility status above are computed
    // server-side from the full month's data — refresh so they pick up
    // this edit instead of only this table updating itself.
    router.refresh();
  }

  async function remove(t: Transaction) {
    if (!window.confirm(`${t.date}・${categoryName(t.category_id)}・¥${t.total_amount.toLocaleString("ja-JP")} を削除しますか？`)) {
      return;
    }
    const { error } = await supabase.from("transactions").delete().eq("id", t.id);
    if (!error) {
      setTransactions((prev) => prev.filter((row) => row.id !== t.id));
      router.refresh();
    }
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">この月の明細はまだありません。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <th className="py-2 pr-4">日付</th>
            <th className="py-2 pr-4">支払者</th>
            <th className="py-2 pr-4">分類</th>
            <th className="py-2 pr-4 text-right">総額</th>
            <th className="py-2 pr-4 text-right">自己負担</th>
            <th className="py-2 pr-4 text-right">相手立替</th>
            <th className="py-2 pr-4 text-right">折半額</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) =>
            editingId === t.id && fields ? (
              <TransactionEditRow
                key={t.id}
                categories={categories}
                fields={fields}
                onChange={setFields}
                onSave={save}
                onCancel={cancelEditing}
                saving={saving}
                error={error}
              />
            ) : (
              <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 pr-4">{t.date}</td>
                <td className="py-2 pr-4">{t.payer_id}</td>
                <td className="py-2 pr-4">{categoryName(t.category_id)}</td>
                <td className="py-2 pr-4 text-right">¥{t.total_amount.toLocaleString("ja-JP")}</td>
                <td className="py-2 pr-4 text-right">¥{t.own_share.toLocaleString("ja-JP")}</td>
                <td className="py-2 pr-4 text-right">¥{t.other_share.toLocaleString("ja-JP")}</td>
                <td className="py-2 pr-4 text-right">¥{t.split_amount.toLocaleString("ja-JP")}</td>
                <td className="py-2 text-neutral-400">
                  <div className="flex items-center justify-end gap-2">
                    {t.fixed_cost_id && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">自動</span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditing(t)}
                      className="text-xs text-neutral-600 hover:underline dark:text-neutral-300"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(t)}
                      className="text-xs text-red-600 hover:underline dark:text-red-400"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
