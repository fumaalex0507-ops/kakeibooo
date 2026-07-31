"use client";

import { useState } from "react";
import { format } from "date-fns";
import clsx from "clsx";
import { supabase } from "@/lib/supabase/client";
import { colorForCategory, colorForPayer } from "@/lib/colors";
import { PAYERS, type Category, type FixedCost, type PayerId } from "@/lib/types";

interface Props {
  categories: Category[];
  initialFixedCosts: FixedCost[];
}

interface FixedCostFieldsValue {
  title: string;
  categoryId: string;
  payerId: PayerId;
  ownShare: string;
  splitAmount: string;
  dayOfMonth: string;
}

// total_amount/own_share/other_share are derived from just two boxes: 自己負担
// (own_share, not shared) and 折半 (the amount to split 50/50). other_share
// (money the payer fronted entirely for the other person) isn't offered here
// since fixed costs are always either fully one person's own expense or fully
// split — total_amount = ownShare + splitAmount, other_share always 0.
function fieldsToRow(fields: FixedCostFieldsValue) {
  const ownShare = Number(fields.ownShare) || 0;
  const splitAmount = Number(fields.splitAmount) || 0;
  return {
    title: fields.title,
    category_id: fields.categoryId,
    payer_id: fields.payerId,
    total_amount: ownShare + splitAmount,
    own_share: ownShare,
    other_share: 0,
    day_of_month: Number(fields.dayOfMonth) || 1,
  };
}

// Mirrors the fieldsToRow invariant above: own_share > 0 means fully
// self-paid, otherwise it's fully split.
function shareLabel(fc: FixedCost): string {
  return fc.own_share > 0 ? "自己負担" : "折半";
}

function fixedCostToFields(fc: FixedCost): FixedCostFieldsValue {
  return {
    title: fc.title,
    categoryId: fc.category_id,
    payerId: fc.payer_id,
    ownShare: String(fc.own_share),
    splitAmount: String(fc.total_amount - fc.own_share - fc.other_share),
    dayOfMonth: String(fc.day_of_month),
  };
}

function FixedCostFields({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: FixedCostFieldsValue;
  onChange: (value: FixedCostFieldsValue) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">支払い者</label>
          <div className="flex items-center rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <select
              value={value.payerId}
              onChange={(e) => onChange({ ...value, payerId: e.target.value as PayerId })}
              className="w-fit rounded-full px-3 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: colorForPayer(value.payerId) }}
            >
              {PAYERS.map((p) => (
                <option key={p} value={p} className="bg-white dark:bg-neutral-900">
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">分類</label>
          <div className="flex items-center rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <select
              value={value.categoryId}
              onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
              className="w-fit rounded-full px-3 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: colorForCategory(value.categoryId, categories) }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-neutral-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">項目名</label>
        <input
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="項目名（例: 家賃）"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">折半</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={value.splitAmount}
            onChange={(e) => onChange({ ...value, splitAmount: e.target.value })}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">自己負担</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={value.ownShare}
            onChange={(e) => onChange({ ...value, ownShare: e.target.value })}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        発生日（毎月）
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={28}
          value={value.dayOfMonth}
          onChange={(e) => onChange({ ...value, dayOfMonth: e.target.value })}
          className="w-20 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        日
      </label>
    </div>
  );
}

function FixedCostRow({
  fc,
  categories,
  onToggleActive,
  onDelete,
  onSave,
}: {
  fc: FixedCost;
  categories: Category[];
  onToggleActive: (fc: FixedCost) => void;
  onDelete: (fc: FixedCost) => void;
  onSave: (fc: FixedCost, fields: FixedCostFieldsValue) => Promise<string | null>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [fields, setFields] = useState<FixedCostFieldsValue>(() => fixedCostToFields(fc));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  function startEditing() {
    setFields(fixedCostToFields(fc));
    setError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const err = await onSave(fc, fields);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
        <FixedCostFields categories={categories} value={fields} onChange={setFields} />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
      <div className="flex flex-col items-start gap-1">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: colorForPayer(fc.payer_id) }}
          >
            {fc.payer_id}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: colorForCategory(fc.category_id, categories) }}
          >
            {categoryName(fc.category_id)}
          </span>
        </div>
        <span className="text-left">
          <span className="font-medium">{fc.title}</span>{" "}
          <span className="text-neutral-500 dark:text-neutral-400">
            （毎月{fc.day_of_month}日・¥{fc.total_amount.toLocaleString("ja-JP")}・{shareLabel(fc)}）
          </span>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleActive(fc)}
          className={clsx(
            "rounded-full px-2 py-0.5 text-xs",
            fc.active
              ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
              : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
          )}
        >
          {fc.active ? "有効" : "停止中"}
        </button>
        <button type="button" onClick={startEditing} className="text-xs text-neutral-600 hover:underline dark:text-neutral-300">
          編集
        </button>
        <button
          type="button"
          onClick={() => onDelete(fc)}
          className="text-xs text-red-600 hover:underline dark:text-red-400"
        >
          削除
        </button>
      </div>
    </div>
  );
}

export function FixedCostManager({ categories, initialFixedCosts }: Props) {
  const [fixedCosts, setFixedCosts] = useState(initialFixedCosts);
  const [newFields, setNewFields] = useState<FixedCostFieldsValue>({
    title: "",
    categoryId: categories[0]?.id ?? "",
    payerId: PAYERS[0],
    ownShare: "0",
    splitAmount: "0",
    dayOfMonth: "1",
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);

    const { data, error } = await supabase
      .from("fixed_costs")
      .insert(fieldsToRow(newFields))
      .select()
      .single();

    if (error) {
      setAddError(error.message);
      return;
    }

    // Generate this month's transaction for the new fixed cost right away —
    // AppInit's mount-time call already ran before this fixed cost existed,
    // and won't fire again just from navigating to another tab.
    await supabase.rpc("generate_fixed_cost_transactions", {
      p_year_month: format(new Date(), "yyyy-MM"),
    });

    setFixedCosts((prev) => [...prev, data as FixedCost]);
    setNewFields({
      title: "",
      categoryId: categories[0]?.id ?? "",
      payerId: PAYERS[0],
      ownShare: "0",
      splitAmount: "0",
      dayOfMonth: "1",
    });
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
    const { error: deleteError } = await supabase.from("fixed_costs").delete().eq("id", fc.id);
    if (deleteError) {
      setListError(deleteError.message);
      return;
    }
    setListError(null);
    setFixedCosts((prev) => prev.filter((f) => f.id !== fc.id));
  }

  async function saveEdit(fc: FixedCost, fields: FixedCostFieldsValue): Promise<string | null> {
    const { data, error } = await supabase
      .from("fixed_costs")
      .update(fieldsToRow(fields))
      .eq("id", fc.id)
      .select()
      .single();

    if (error) return error.message;

    setFixedCosts((prev) => prev.map((f) => (f.id === fc.id ? (data as FixedCost) : f)));
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {listError && <p className="text-sm text-red-600 dark:text-red-400">{listError}</p>}
        {fixedCosts.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">固定費はまだ登録されていません。</p>
        )}
        {fixedCosts.map((fc) => (
          <FixedCostRow
            key={fc.id}
            fc={fc}
            categories={categories}
            onToggleActive={toggleActive}
            onDelete={remove}
            onSave={saveEdit}
          />
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-medium">固定費を追加</h2>
        <FixedCostFields categories={categories} value={newFields} onChange={setNewFields} />
        {addError && <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>}
        <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          追加
        </button>
      </form>
    </div>
  );
}
