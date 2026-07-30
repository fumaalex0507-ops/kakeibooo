import clsx from "clsx";

interface Props {
  status: { electricity: boolean; gas: boolean; water: boolean };
}

const LABELS: Record<keyof Props["status"], string> = {
  electricity: "電気",
  gas: "ガス",
  water: "水道",
};

export function UtilityStatusBadges({ status }: Props) {
  return (
    <div className="flex gap-3">
      {(Object.keys(LABELS) as (keyof Props["status"])[]).map((key) => (
        <span
          key={key}
          className={clsx(
            "rounded-full px-3 py-1 text-sm font-medium",
            status[key]
              ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
              : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
          )}
        >
          {LABELS[key]}: {status[key] ? "済" : "未"}
        </span>
      ))}
    </div>
  );
}
