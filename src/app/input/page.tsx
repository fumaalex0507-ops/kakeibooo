import { createServerClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/TransactionForm";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InputPage() {
  const supabase = createServerClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) {
    return (
      <p className="text-red-600 dark:text-red-400">
        分類の取得に失敗しました: {error.message}
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">支出を入力</h1>
      <TransactionForm categories={(categories ?? []) as Category[]} />
    </div>
  );
}
