import catego from "@/data/catego.json";

/**
 * Category keys in dataset order (`a`, `b`, `c`, `d`, `e`, `r`, `t`, `dan`).
 *
 * Derived from the source data rather than hard-coded, so adding a category to
 * the JSON is enough — no list to keep in sync. The dataset is imported by the
 * router already, so this shares the same module instance.
 */
export const CATEGORY_IDS: readonly string[] = Object.keys(catego);

/** Display label for a category key — the key itself, uppercased. */
export const categoryLabel = (categoria: string): string => categoria.toUpperCase();
