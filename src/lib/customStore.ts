import { createStore } from "tinybase";
import { createIndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import type { Catego, Category } from "../hooks/useCatego";

export type SetRow = {
  name: string;
  lang: string;
  categoryKey: string;
  createdAt: number;
};

export type QuestionRow = {
  setId: string;
  q: string;
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  e?: string;
  f?: string;
  g?: string;
  h?: string;
  i?: string;
  j?: string;
  v: string;
  imageData?: string;
  imageExt?: string;
};

export const store = createStore();

const persister = createIndexedDbPersister(store, "ursdb-custom");

let initialized = false;

export async function initCustomStore(): Promise<void> {
  if (initialized) return;
  initialized = true;
  await persister.startAutoLoad();
  await persister.startAutoSave();
}

export function getSetsForLang(lang: string): Array<{ id: string } & SetRow> {
  const table = store.getTable("sets") as Record<string, Record<string, unknown>>;
  return Object.entries(table)
    .filter(([, row]) => row.lang === lang)
    .map(([id, row]) => ({ id, ...(row as unknown as SetRow) }));
}

export function getQuestionsForSet(setId: string): Array<{ id: string } & QuestionRow> {
  const table = store.getTable("questions") as Record<string, Record<string, unknown>>;
  return Object.entries(table)
    .filter(([, row]) => row.setId === setId)
    .map(([id, row]) => ({ id, ...(row as unknown as QuestionRow) }));
}

export function saveSet(data: Omit<SetRow, "createdAt">): string {
  const id = crypto.randomUUID();
  store.setRow("sets", id, { ...data, createdAt: Date.now() } as Record<
    string,
    string | number | boolean
  >);
  return id;
}

export function saveQuestion(
  setId: string,
  data: Omit<QuestionRow, "setId">,
  existingId?: string,
): string {
  const id = existingId ?? `${setId}-${crypto.randomUUID()}`;
  const row: Record<string, string | number | boolean> = { setId, q: data.q, v: data.v };
  const answerKeys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
  for (const key of answerKeys) {
    if (data[key] !== undefined && data[key] !== "") {
      row[key] = data[key] as string;
    }
  }
  if (data.imageData) row.imageData = data.imageData;
  if (data.imageExt) row.imageExt = data.imageExt;
  store.setRow("questions", id, row);
  return id;
}

export function deleteQuestion(questionId: string): void {
  store.delRow("questions", questionId);
}

export function deleteSet(setId: string): void {
  store.delRow("sets", setId);
  const table = store.getTable("questions") as Record<string, Record<string, unknown>>;
  for (const [qId, row] of Object.entries(table)) {
    if (row.setId === setId) {
      store.delRow("questions", qId);
    }
  }
}

export function mergeCustomQuestions(lang: string, catego: Catego): Catego {
  const sets = getSetsForLang(lang);
  if (sets.length === 0) return catego;

  const merged: Catego = { ...catego };

  for (const set of sets) {
    const questions = getQuestionsForSet(set.id);
    if (questions.length === 0) continue;

    const categories: Category[] = questions.map((row) => {
      const ans: Record<string, string> = {};
      const answerKeys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
      for (const key of answerKeys) {
        if (row[key] !== undefined && row[key] !== "") {
          ans[key] = row[key] as string;
        }
      }
      return {
        // Prefix with categoryKey so localStorage filters (q.startsWith(categoria))
        // correctly track correct/wrong counts for custom questions.
        id: `${set.categoryKey}-${row.id}`,
        q: row.q,
        ans,
        v: row.v,
        imageUrl: row.imageData,
        isCustom: true,
      };
    });

    if (merged[set.categoryKey]) {
      merged[set.categoryKey] = [...merged[set.categoryKey], ...categories];
    } else {
      merged[set.categoryKey] = categories;
    }
  }

  return merged;
}
