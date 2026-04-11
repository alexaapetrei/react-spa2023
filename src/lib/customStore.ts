import { createStore } from "tinybase";
import { createCheckpoints } from "tinybase/checkpoints";
import { createIndexes } from "tinybase/indexes";
import { createIndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import type { Catego, Category } from "../hooks/useCatego";
import { createCustomQuestionId } from "./categoryProgress";

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
export const checkpoints = createCheckpoints(store).setSize(100);
export const indexes = createIndexes(store);
indexes.setIndexDefinition("bySet", "questions", "setId");
indexes.setIndexDefinition("setsByLang", "sets", "lang");

const persister = createIndexedDbPersister(store, "ursdb-custom");

let initPromise: Promise<void> | undefined;
type ChangeAction =
  | "addQuestion"
  | "updateQuestion"
  | "deleteQuestion"
  | "addSet"
  | "updateSet"
  | "deleteSet"
  | "import";
const customStoreChangeListeners = new Set<(action?: ChangeAction) => void>();

export async function initCustomStore(): Promise<void> {
  initPromise ??= (async () => {
    await persister.startAutoLoad();
    checkpoints.clear();
    await persister.startAutoSave();
  })();
  await initPromise;
}

function notifyCustomStoreChange(action?: ChangeAction): void {
  customStoreChangeListeners.forEach((listener) => listener(action));
}

function recordCustomStoreChange<T>(
  label: string,
  action: () => T,
  changeAction?: ChangeAction,
): T {
  const result = store.transaction(action);
  checkpoints.addCheckpoint(label);
  notifyCustomStoreChange(changeAction);
  return result;
}

export function addCustomStoreChangeListener(
  listener: (action?: ChangeAction) => void,
): () => void {
  customStoreChangeListeners.add(listener);
  return () => {
    customStoreChangeListeners.delete(listener);
  };
}

export function addCustomUndoListener(listener: () => void): () => void {
  const listenerId = checkpoints.addCheckpointIdsListener(listener);
  return () => {
    checkpoints.delListener(listenerId);
  };
}

export function getCustomUndoState(): { canUndo: boolean; label: string } {
  const [backwardIds, currentId] = checkpoints.getCheckpointIds();
  return {
    canUndo: backwardIds.length > 0 && currentId !== undefined,
    label: currentId ? (checkpoints.getCheckpoint(currentId) ?? "") : "",
  };
}

export function getCustomRedoState(): { canRedo: boolean; label: string } {
  const [, , forwardIds] = checkpoints.getCheckpointIds();
  const redoId = forwardIds[0];
  return {
    canRedo: redoId !== undefined,
    label: redoId ? (checkpoints.getCheckpoint(redoId) ?? "") : "",
  };
}

export function undoCustomStoreChange(): boolean {
  if (!getCustomUndoState().canUndo) return false;
  checkpoints.goBackward();
  notifyCustomStoreChange();
  return true;
}

export function redoCustomStoreChange(): boolean {
  if (!getCustomRedoState().canRedo) return false;
  checkpoints.goForward();
  notifyCustomStoreChange();
  return true;
}

export function getSetsForLang(lang: string): Array<{ id: string } & SetRow> {
  const table = store.getTable("sets") as Record<string, Record<string, unknown>>;
  return Object.entries(table)
    .filter(([, row]) => row.lang === lang)
    .map(([id, row]) => ({ id, ...(row as unknown as SetRow) }));
}

export function getAllSets(): Array<{ id: string } & SetRow> {
  const table = store.getTable("sets") as Record<string, Record<string, unknown>>;
  return Object.entries(table).map(([id, row]) => ({ id, ...(row as unknown as SetRow) }));
}

export function getCategoryKeysForLang(lang: string): string[] {
  const table = store.getTable("sets") as Record<string, Record<string, unknown>>;
  return Object.values(table)
    .filter((row) => row.lang === lang)
    .map((row) => row.categoryKey as string);
}

export function getSetById(setId: string): ({ id: string } & SetRow) | null {
  const row = store.getRow("sets", setId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return { id: setId, ...(row as unknown as SetRow) };
}

export function getQuestionsForSet(setId: string): Array<{ id: string } & QuestionRow> {
  const table = store.getTable("questions") as Record<string, Record<string, unknown>>;
  return Object.entries(table)
    .filter(([, row]) => row.setId === setId)
    .map(([id, row]) => ({ id, ...(row as unknown as QuestionRow) }));
}

export function saveSet(data: Omit<SetRow, "createdAt">): string {
  const id = crypto.randomUUID();
  return recordCustomStoreChange(
    "create set",
    () => {
      store.setRow("sets", id, { ...data, createdAt: Date.now() } as Record<
        string,
        string | number | boolean
      >);
      return id;
    },
    "addSet",
  );
}

export function updateSet(setId: string, data: Omit<SetRow, "createdAt">): void {
  const existing = getSetById(setId);
  if (!existing) return;

  recordCustomStoreChange(
    "update set",
    () => {
      store.setRow("sets", setId, {
        ...data,
        createdAt: existing.createdAt,
      } as Record<string, string | number | boolean>);
    },
    "updateSet",
  );
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
  return recordCustomStoreChange(
    existingId ? "update question" : "create question",
    () => {
      store.setRow("questions", id, row);
      return id;
    },
    existingId ? "updateQuestion" : "addQuestion",
  );
}

export function deleteQuestion(questionId: string): void {
  recordCustomStoreChange(
    "delete question",
    () => {
      store.delRow("questions", questionId);
    },
    "deleteQuestion",
  );
}

export function deleteSet(setId: string): void {
  recordCustomStoreChange(
    "delete set",
    () => {
      store.delRow("sets", setId);
      const table = store.getTable("questions") as Record<string, Record<string, unknown>>;
      for (const [qId, row] of Object.entries(table)) {
        if (row.setId === setId) {
          store.delRow("questions", qId);
        }
      }
    },
    "deleteSet",
  );
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
        id: createCustomQuestionId(set.categoryKey, row.id),
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
