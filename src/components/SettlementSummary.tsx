import type { SettlementResult } from "@/lib/calculations";

export function SettlementSummary({ result }: { result: SettlementResult }) {
  const { from, to, amount, frontedTotal } = result;

  return (
    <div className="rounded-lg border border-neutral-200 p-6 text-center dark:border-neutral-800">
      {amount === 0 ? (
        <p className="text-xl font-semibold">精算の必要はありません</p>
      ) : (
        <p className="text-2xl font-bold">
          {from}が{to}に <span className="text-teal-600 dark:text-teal-400">¥{amount.toLocaleString("ja-JP")}</span> 支払う
        </p>
      )}
      <div className="mt-4 flex justify-center gap-8 text-sm text-neutral-500 dark:text-neutral-400">
        <span>風馬の立替合計: ¥{frontedTotal["風馬"].toLocaleString("ja-JP")}</span>
        <span>ちか子の立替合計: ¥{frontedTotal["ちか子"].toLocaleString("ja-JP")}</span>
      </div>
    </div>
  );
}
