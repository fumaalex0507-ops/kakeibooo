import type { Category, Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
  categories: Category[];
}

export function TransactionTable({ transactions, categories }: Props) {
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  if (transactions.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">この月の明細はまだありません。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <th className="py-2 pr-4">日付</th>
            <th className="py-2 pr-4">支払者</th>
            <th className="py-2 pr-4">分類</th>
            <th className="py-2 pr-4 text-right">総額</th>
            <th className="py-2 pr-4 text-right">自己負担</th>
            <th className="py-2 pr-4 text-right">相手負担</th>
            <th className="py-2 pr-4 text-right">折半額</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-900">
              <td className="py-2 pr-4">{t.date}</td>
              <td className="py-2 pr-4">{t.payer_id}</td>
              <td className="py-2 pr-4">{categoryName(t.category_id)}</td>
              <td className="py-2 pr-4 text-right">¥{t.total_amount.toLocaleString("ja-JP")}</td>
              <td className="py-2 pr-4 text-right">¥{t.own_share.toLocaleString("ja-JP")}</td>
              <td className="py-2 pr-4 text-right">¥{t.other_share.toLocaleString("ja-JP")}</td>
              <td className="py-2 pr-4 text-right">¥{t.split_amount.toLocaleString("ja-JP")}</td>
              <td className="py-2 text-neutral-400">
                {t.fixed_cost_id && <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">自動</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
