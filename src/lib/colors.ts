import type { Category } from "./types";

// Fixed categorical palette, assigned by each category's position in the
// FULL category list (sorted by sort_order) — not by position within
// whatever filtered subset happens to be displayed. This keeps a given
// category the same color across every chart and every month, even when
// different charts show different subsets of categories.
const PALETTE = [
  "#0d9488", // teal
  "#f59e0b", // amber
  "#6366f1", // indigo
  "#ec4899", // pink
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#f97316", // orange
  "#8b5cf6", // violet
  "#14b8a6", // teal-light
  "#ef4444", // red
  "#a3a3a3", // neutral
  "#3b82f6", // blue
];

export function colorForCategory(categoryId: string, allCategories: Category[]): string {
  const index = allCategories.findIndex((c) => c.id === categoryId);
  return PALETTE[(index < 0 ? 0 : index) % PALETTE.length];
}
