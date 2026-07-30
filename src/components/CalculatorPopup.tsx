"use client";

import { useState } from "react";
import clsx from "clsx";
import { evaluateExpression } from "@/lib/calculator";

interface Props {
  title: string;
  onInput: (value: number) => void;
  onClose: () => void;
}

const BUTTON_ROWS: string[][] = [
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  ["0", ".", "C", "+"],
];

function toEvaluable(expression: string) {
  return expression.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
}

export function CalculatorPopup({ title, onInput, onClose }: Props) {
  const [expression, setExpression] = useState("");

  const evaluable = toEvaluable(expression) || "0";
  const result = evaluateExpression(evaluable);
  // Ending with an operator ("633×") is a normal mid-calculation state, not
  // a mistake — only treat it as a real error once it can't be completed
  // into something valid just by pressing more digits.
  const isMidExpression = /[+\-*/]\s*$/.test(evaluable);
  const showError = result === null && !isMidExpression;

  function press(key: string) {
    if (key === "C") {
      setExpression("");
      return;
    }
    setExpression((prev) => prev + key);
  }

  function backspace() {
    setExpression((prev) => prev.slice(0, -1));
  }

  function equals() {
    if (result === null) return;
    // Collapse the expression into its result so further taps (e.g. ×2)
    // apply to the running total instead of being folded into one long
    // expression evaluated by operator precedence.
    setExpression(String(result));
  }

  function confirm() {
    if (result === null) return;
    onInput(Math.round(result));
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-72 rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900"
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">{title}の電卓</h3>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            ✕
          </button>
        </div>

        <div className="mb-3 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-right dark:border-neutral-700 dark:bg-neutral-800">
          <div className="min-h-[1.25rem] text-sm text-neutral-500 dark:text-neutral-400">
            {expression || "0"}
          </div>
          <div className={clsx("text-xl font-semibold", showError && "text-red-500")}>
            {showError ? "エラー" : result !== null ? `¥${result.toLocaleString("ja-JP")}` : " "}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {BUTTON_ROWS.flat().map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              className="rounded-md bg-neutral-100 py-2 text-lg hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={backspace}
            className="rounded-md bg-neutral-100 py-2 text-sm hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={equals}
            disabled={result === null}
            className="rounded-md bg-neutral-200 py-2 text-lg font-medium hover:bg-neutral-300 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:disabled:bg-neutral-800"
          >
            =
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={result === null}
            className="col-span-2 rounded-md bg-teal-600 py-2 font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
          >
            入力
          </button>
        </div>
      </div>
    </div>
  );
}
