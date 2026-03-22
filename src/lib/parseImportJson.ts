import type { QuestionRow } from "./customStore";
import type { Category, Catego } from "../hooks/useCatego";

export type ParseJsonResult = {
  questions: Partial<QuestionRow>[];
  suggestedCategoryKey?: string;
};

function mapCategoryToQuestionRow(cat: Category): Partial<QuestionRow> {
  const row: Partial<QuestionRow> = {
    q: cat.q,
    v: cat.v,
  };

  if (cat.ans) {
    for (const [key, val] of Object.entries(cat.ans)) {
      if (val) {
        (row as Record<string, string>)[key] = val;
      }
    }
  }

  // If there's an image reference (i), note the extension but the actual
  // image file must be provided separately
  if (cat.i !== undefined) {
    row.imageExt = "jpg";
  }

  if (cat.imageUrl) {
    row.imageData = cat.imageUrl;
  }

  return row;
}

export function parseImportJson(input: unknown): ParseJsonResult {
  if (Array.isArray(input)) {
    // Direct Category[] array
    const questions = (input as Category[]).map(mapCategoryToQuestionRow);
    return { questions };
  }

  if (typeof input === "object" && input !== null) {
    const asCatego = input as Catego;
    const keys = Object.keys(asCatego);
    if (keys.length > 0) {
      // Use the first key
      const firstKey = keys[0];
      const cats = asCatego[firstKey];
      if (Array.isArray(cats)) {
        const questions = cats.map(mapCategoryToQuestionRow);
        return { questions, suggestedCategoryKey: firstKey };
      }
    }
  }

  return { questions: [] };
}
