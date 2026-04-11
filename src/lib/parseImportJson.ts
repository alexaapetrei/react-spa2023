import type { QuestionRow } from "./customStore";
import type { Category, Catego } from "../hooks/useCatego";

export type ParseJsonResult = {
  questions: Partial<QuestionRow>[];
  language?: string;
  suggestedCategoryKey?: string;
  suggestedSetName?: string;
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
  if (
    typeof input === "object" &&
    input !== null &&
    "language" in input &&
    "questions" in input &&
    Array.isArray((input as { questions: unknown[] }).questions)
  ) {
    const manifest = input as {
      language?: string;
      category?: string | string[];
      setName?: string;
      questions: Array<{
        q?: string;
        v?: string;
        ans?: Record<string, string>;
        image?: string;
        i?: string | number;
      }>;
    };

    if (!["ro", "en", "de", "hu"].includes(manifest.language ?? "")) {
      throw new Error("JSON import must specify a valid language: ro, en, de, or hu");
    }

    const suggestedCategoryKey = Array.isArray(manifest.category)
      ? manifest.category[0]
      : manifest.category;

    const questions = manifest.questions.map((item) => {
      const row: Partial<QuestionRow> = {
        q: item.q,
        v: item.v,
      };

      if (item.ans) {
        for (const [key, value] of Object.entries(item.ans)) {
          if (value) {
            (row as Record<string, string>)[key] = value;
          }
        }
      }

      const imageRef = item.image ?? item.i;
      if (typeof imageRef === "string") {
        row.imageExt = imageRef.split(".").pop()?.toLowerCase() ?? "jpg";
      }

      return row;
    });

    return {
      questions,
      language: manifest.language,
      suggestedCategoryKey,
      suggestedSetName: manifest.setName,
    };
  }

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
