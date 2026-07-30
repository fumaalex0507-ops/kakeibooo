"use client";

import clsx from "clsx";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PAYERS } from "@/lib/types";

export function UserSwitcher() {
  const { currentUser, setCurrentUser } = useCurrentUser();

  return (
    <div className="inline-flex rounded-full border border-neutral-300 p-1 text-sm dark:border-neutral-700">
      {PAYERS.map((payer) => (
        <button
          key={payer}
          type="button"
          onClick={() => setCurrentUser(payer)}
          className={clsx(
            "rounded-full px-3 py-1 transition-colors",
            currentUser === payer
              ? "bg-teal-600 text-white"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          )}
        >
          {payer}
        </button>
      ))}
    </div>
  );
}
