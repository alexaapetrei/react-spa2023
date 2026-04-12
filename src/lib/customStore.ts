import { createStore } from "tinybase";
import { createCheckpoints } from "tinybase/checkpoints";
import { createIndexes } from "tinybase/indexes";
import { createIndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import type { Catego, Category } from "../types/catego";
import { createCustomQuestionId } from "./categoryProgress";

export type SetRow = {
  name: string;
  lang: string;
  categoryKey: string;
  createdAt: number;
  isCanonical?: boolean;
  urlKey?: string;
};

export type QuestionRow = {
  setId: string;
  lang: string;
  categoryKey: string;
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
  canonicalId?: string; // id from the original json, e.g. "a-1066"
  canonicalImageId?: number; // "i" from the original json
  isCustom: boolean;
};

export const store = createStore().setTablesSchema({
  sets: {
    name: { type: "string" },
    lang: { type: "string" },
    categoryKey: { type: "string" },
    createdAt: { type: "number" },
    isCanonical: { type: "boolean", default: false },
    urlKey: { type: "string" },
  },
  questions: {
    setId: { type: "string" },
    lang: { type: "string" },
    categoryKey: { type: "string" },
    q: { type: "string" },
    v: { type: "string" },
    isCustom: { type: "boolean", default: true },
    canonicalId: { type: "string" },
    canonicalImageId: { type: "number" },
    imageData: { type: "string" },
    imageExt: { type: "string" },
    a: { type: "string" },
    b: { type: "string" },
    c: { type: "string" },
    d: { type: "string" },
    e: { type: "string" },
    f: { type: "string" },
    g: { type: "string" },
    h: { type: "string" },
    i: { type: "string" },
    j: { type: "string" },
  },
  canonical_initialized: {
    loaded: { type: "boolean", default: false },
  },
});
export const checkpoints = createCheckpoints(store).setSize(100);
export const indexes = createIndexes(store);
indexes.setIndexDefinition("bySet", "questions", "setId");
indexes.setIndexDefinition("setsByLang", "sets", "lang");

const persister = createIndexedDbPersister(store, "ursdb-custom");
const SUPPORTED_LANGS = ["ro", "en", "de", "hu"] as const;
const ANSWER_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;

type SupportedLang = (typeof SUPPORTED_LANGS)[number];

let initPromise: Promise<void> | undefined;

function normalizeLang(lang: unknown): SupportedLang {
  if (typeof lang !== "string") return "ro";
  const base = lang.trim().toLowerCase().replace(/_/g, "-").split("-")[0];
  return SUPPORTED_LANGS.includes(base as SupportedLang) ? (base as SupportedLang) : "ro";
}

function canonicalSetId(lang: string, categoryKey: string): string {
  return `canonical:${normalizeLang(lang)}:${categoryKey}`;
}

function isCanonicalSetId(setId: string): boolean {
  return setId.startsWith("canonical:");
}

function toKebabSegment(value: string): string {
  const kebab = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return kebab || "set";
}

function baseSetUrlKey(lang: string, categoryKey: string, isCanonical: boolean): string {
  const scope = isCanonical ? "canonical" : "custom";
  return `${scope}-${normalizeLang(lang)}-${toKebabSegment(categoryKey)}`;
}

function ensureUniqueSetUrlKey(baseKey: string, setId: string): string {
  const table = store.getTable("sets") as Record<string, Record<string, unknown>>;
  const used = new Set<string>();
  for (const [id, row] of Object.entries(table)) {
    if (id === setId) continue;
    if (typeof row.urlKey === "string" && row.urlKey.length > 0) {
      used.add(row.urlKey);
    }
  }

  if (!used.has(baseKey)) return baseKey;

  const suffix = toKebabSegment(setId).slice(-8) || crypto.randomUUID().slice(0, 8);
  const candidate = `${baseKey}-${suffix}`;
  if (!used.has(candidate)) return candidate;

  let counter = 2;
  while (used.has(`${candidate}-${counter}`)) {
    counter += 1;
  }
  return `${candidate}-${counter}`;
}

function createSetUrlKey(
  setId: string,
  lang: string,
  categoryKey: string,
  isCanonical: boolean,
): string {
  const baseKey = baseSetUrlKey(lang, categoryKey, isCanonical);
  return ensureUniqueSetUrlKey(baseKey, setId);
}

function resolveSetUrlKey(setId: string, row: Record<string, unknown>): string {
  const lang = normalizeLang(row.lang);
  const categoryKey =
    typeof row.categoryKey === "string" && row.categoryKey.length > 0
      ? row.categoryKey
      : toKebabSegment(setId);
  const isCanonical = row.isCanonical === true || isCanonicalSetId(setId);
  return createSetUrlKey(setId, lang, categoryKey, isCanonical);
}

function isCanonicalRow(row: Record<string, unknown>): boolean {
  return (
    row.setId === "canonical" ||
    (typeof row.setId === "string" && isCanonicalSetId(row.setId)) ||
    row.isCustom === false
  );
}

function collectAnswers(row: Record<string, unknown>): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const key of ANSWER_KEYS) {
    const value = row[key];
    if (typeof value === "string" && value !== "") {
      answers[key] = value;
    }
  }
  return answers;
}

function getCanonicalImageUrl(
  categoryKey: string,
  row: Record<string, unknown>,
): string | undefined {
  const rawId = row.canonicalImageId;
  const imageId = typeof rawId === "number" ? rawId : Number(rawId);
  if (!Number.isInteger(imageId) || imageId <= 0) {
    return undefined;
  }

  const rawExt = typeof row.imageExt === "string" ? row.imageExt.trim() : "";
  const imageExt = (rawExt ? rawExt : "jpg").replace(/^\./, "").toLowerCase();
  return `/img/${categoryKey}/${imageId}.${imageExt}`;
}

function createCanonicalQuestionId(categoryKey: string): string {
  return `${categoryKey}-${crypto.randomUUID().slice(0, 8)}`;
}

function upsertCanonicalSetRow(lang: SupportedLang, categoryKey: string): string {
  const setId = canonicalSetId(lang, categoryKey);
  const existing = store.getRow("sets", setId) as Record<string, unknown> | undefined;
  const nextUrlKey = createSetUrlKey(setId, lang, categoryKey, true);

  if (!existing) {
    store.setRow("sets", setId, {
      name: categoryKey.toUpperCase(),
      lang,
      categoryKey,
      createdAt: 0,
      isCanonical: true,
      urlKey: nextUrlKey,
    } as Record<string, string | number | boolean>);
    return setId;
  }

  if (existing.lang !== lang) {
    store.setCell("sets", setId, "lang", lang);
  }
  if (existing.categoryKey !== categoryKey) {
    store.setCell("sets", setId, "categoryKey", categoryKey);
  }
  if (existing.name !== categoryKey.toUpperCase()) {
    store.setCell("sets", setId, "name", categoryKey.toUpperCase());
  }
  if (existing.isCanonical !== true) {
    store.setCell("sets", setId, "isCanonical", true);
  }
  if (existing.createdAt !== 0) {
    store.setCell("sets", setId, "createdAt", 0);
  }
  if (existing.urlKey !== nextUrlKey) {
    store.setCell("sets", setId, "urlKey", nextUrlKey);
  }

  return setId;
}

async function loadCanonicalJsonForLang(lang: SupportedLang): Promise<Catego | null> {
  try {
    if (lang === "ro") {
      return (await import("../data/catego.json")).default;
    }
    return (await import(`../data/catego-${lang}.json`)).default;
  } catch (error) {
    console.error(`Failed to load canonical data for ${lang}`, error);
    return null;
  }
}

export async function initCustomStore(): Promise<void> {
  initPromise ??= (async () => {
    await persister.startAutoLoad();
    checkpoints.clear();
    await persister.startAutoSave();

    migrateLegacyCustomRows();

    await ensureAllCanonicalLoaded();
  })();
  await initPromise;
}

function migrateLegacyCustomRows(): void {
  store.transaction(() => {
    const setIds = store.getRowIds("sets");
    for (const setId of setIds) {
      const setRow = store.getRow("sets", setId) as Record<string, unknown> | undefined;
      if (!setRow) continue;

      const rowLang = typeof setRow.lang === "string" ? setRow.lang : "ro";
      const normalizedSetLang = normalizeLang(rowLang);
      if (rowLang !== normalizedSetLang) {
        store.setCell("sets", setId, "lang", normalizedSetLang);
      }

      if (isCanonicalSetId(setId)) {
        if (setRow.isCanonical !== true) {
          store.setCell("sets", setId, "isCanonical", true);
        }
        if (setRow.createdAt !== 0) {
          store.setCell("sets", setId, "createdAt", 0);
        }
      }

      const nextUrlKey = resolveSetUrlKey(setId, setRow);
      if (setRow.urlKey !== nextUrlKey) {
        store.setCell("sets", setId, "urlKey", nextUrlKey);
      }
    }

    const questionIds = store.getRowIds("questions");
    for (const questionId of questionIds) {
      const row = store.getRow("questions", questionId) as Record<string, unknown> | undefined;
      if (!row) continue;

      const setId = typeof row.setId === "string" ? row.setId : "";
      if (!setId) continue;

      if (setId === "canonical" || isCanonicalSetId(setId)) {
        const lang = normalizeLang(row.lang);
        const categoryKey =
          typeof row.categoryKey === "string" && row.categoryKey.length > 0
            ? row.categoryKey
            : undefined;
        if (!categoryKey) continue;

        const nextSetId = upsertCanonicalSetRow(lang, categoryKey);
        if (row.setId !== nextSetId) {
          store.setCell("questions", questionId, "setId", nextSetId);
        }
        if (row.lang !== lang) {
          store.setCell("questions", questionId, "lang", lang);
        }
        if (row.categoryKey !== categoryKey) {
          store.setCell("questions", questionId, "categoryKey", categoryKey);
        }
        if (row.isCustom !== false) {
          store.setCell("questions", questionId, "isCustom", false);
        }
        continue;
      }

      const setRow = store.getRow("sets", setId) as Record<string, unknown> | undefined;
      if (!setRow) continue;

      const normalizedQuestionLang = normalizeLang(row.lang ?? setRow.lang);
      if (row.lang !== normalizedQuestionLang) {
        store.setCell("questions", questionId, "lang", normalizedQuestionLang);
      }

      if (typeof setRow.categoryKey === "string" && row.categoryKey !== setRow.categoryKey) {
        store.setCell("questions", questionId, "categoryKey", setRow.categoryKey);
      }

      if (row.isCustom !== true) {
        store.setCell("questions", questionId, "isCustom", true);
      }
    }
  });
}

export async function ensureCanonicalLoaded(lang: string): Promise<void> {
  const normalizedLang = normalizeLang(lang);
  const table = store.getTable("canonical_initialized") as Record<string, { loaded: boolean }>;
  if (table?.[normalizedLang]?.loaded) return;

  const questionIds = store.getRowIds("questions");
  const hasCanonical = questionIds.some((id) => {
    const row = store.getRow("questions", id) as Record<string, unknown>;
    return row.lang === normalizedLang && isCanonicalRow(row);
  });

  if (hasCanonical) {
    store.setRow("canonical_initialized", normalizedLang, { loaded: true });
    return;
  }

  const data = await loadCanonicalJsonForLang(normalizedLang);
  if (!data) {
    return;
  }

  store.transaction(() => {
    for (const [categoryKey, questions] of Object.entries(data)) {
      const setId = upsertCanonicalSetRow(normalizedLang, categoryKey);

      for (const q of questions) {
        const id = `canonical-${normalizedLang}-${q.id}`;
        const row: Record<string, string | number | boolean> = {
          setId,
          lang: normalizedLang,
          categoryKey,
          q: q.q,
          v: q.v,
          isCustom: false,
          canonicalId: q.id,
        };
        if (q.i !== undefined) row.canonicalImageId = q.i;

        if (q.ans) {
          for (const [key, val] of Object.entries(q.ans)) {
            row[key] = val;
          }
        }
        store.setRow("questions", id, row);
      }
    }
    store.setRow("canonical_initialized", normalizedLang, { loaded: true });
  });
}

export async function ensureAllCanonicalLoaded(): Promise<void> {
  for (const lang of SUPPORTED_LANGS) {
    await ensureCanonicalLoaded(lang);
  }
}

export async function reinitializeCanonicalFromJson(): Promise<void> {
  await initCustomStore();

  store.transaction(() => {
    const questionIds = store.getRowIds("questions");
    for (const questionId of questionIds) {
      const row = store.getRow("questions", questionId) as Record<string, unknown>;
      const isCanonical = isCanonicalRow(row);
      if (isCanonical) {
        store.delRow("questions", questionId);
      }
    }

    const canonicalInitializedIds = store.getRowIds("canonical_initialized");
    for (const lang of canonicalInitializedIds) {
      store.delRow("canonical_initialized", lang);
    }

    const setIds = store.getRowIds("sets");
    for (const setId of setIds) {
      const setRow = store.getRow("sets", setId) as Record<string, unknown>;
      if (setRow.isCanonical === true || isCanonicalSetId(setId)) {
        store.delRow("sets", setId);
      }
    }
  });

  await ensureAllCanonicalLoaded();
  notifyCustomStoreChange();
}

export type ChangeAction =
  | "addSet"
  | "updateSet"
  | "deleteSet"
  | "addQuestion"
  | "updateQuestion"
  | "deleteQuestion";

const customStoreChangeListeners = new Set<(action?: ChangeAction) => void>();

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
  const normalizedLang = normalizeLang(lang);
  const table = store.getTable("sets") as Record<string, Record<string, unknown>>;
  return Object.entries(table)
    .filter(([, row]) => normalizeLang(row.lang) === normalizedLang)
    .map(([id, row]) => ({ id, ...(row as unknown as SetRow) }));
}

export function getAllSets(): Array<{ id: string } & SetRow> {
  const table = store.getTable("sets") as Record<string, Record<string, unknown>>;
  return Object.entries(table).map(([id, row]) => ({ id, ...(row as unknown as SetRow) }));
}

export function getCategoryKeysForLang(lang: string): string[] {
  const normalizedLang = normalizeLang(lang);
  const table = store.getTable("sets") as Record<string, Record<string, unknown>>;
  return Object.values(table)
    .filter((row) => normalizeLang(row.lang) === normalizedLang)
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
  const normalizedLang = normalizeLang(data.lang);
  const urlKey = createSetUrlKey(id, normalizedLang, data.categoryKey, false);
  return recordCustomStoreChange(
    "create set",
    () => {
      store.setRow("sets", id, {
        ...data,
        lang: normalizedLang,
        createdAt: Date.now(),
        isCanonical: false,
        urlKey,
      } as Record<string, string | number | boolean>);
      return id;
    },
    "addSet",
  );
}

export function updateSet(setId: string, data: Omit<SetRow, "createdAt">): void {
  const existing = getSetById(setId);
  if (!existing) return;
  if (existing.isCanonical) return;
  const normalizedLang = normalizeLang(data.lang);
  const urlKey = createSetUrlKey(setId, normalizedLang, data.categoryKey, false);

  recordCustomStoreChange(
    "update set",
    () => {
      store.setRow("sets", setId, {
        ...data,
        lang: normalizedLang,
        createdAt: existing.createdAt,
        isCanonical: false,
        urlKey,
      } as Record<string, string | number | boolean>);

      if (data.categoryKey !== existing.categoryKey) {
        for (const questionId of indexes.getSliceRowIds("bySet", setId)) {
          store.setPartialRow("questions", questionId, {
            categoryKey: data.categoryKey,
            lang: normalizedLang,
          });
        }
      }
    },
    "updateSet",
  );
}

export function getSetIdByUrlKey(setKey: string): string | null {
  const table = store.getTable("sets") as Record<string, Record<string, unknown>>;

  if (table[setKey]) {
    return setKey;
  }

  for (const [setId, row] of Object.entries(table)) {
    if (row.urlKey === setKey) {
      return setId;
    }
  }

  return null;
}

export function saveQuestion(
  setId: string,
  data: Omit<QuestionRow, "setId" | "lang" | "categoryKey" | "isCustom">,
  existingId?: string,
): string {
  const set = getSetById(setId);
  if (!set) throw new Error("Set not found");
  const isCanonicalSet = set.isCanonical === true || isCanonicalSetId(setId);

  const id = existingId ?? `${setId}-${crypto.randomUUID()}`;
  const row: Record<string, string | number | boolean> = {
    setId,
    q: data.q,
    v: data.v,
    lang: set.lang,
    categoryKey: set.categoryKey,
    isCustom: !isCanonicalSet,
  };
  for (const key of ANSWER_KEYS) {
    const cellValue = data[key];
    if (typeof cellValue === "string" && cellValue !== "") {
      row[key] = cellValue;
    }
  }
  if (isCanonicalSet) {
    const existingRow = existingId
      ? (store.getRow("questions", existingId) as Record<string, unknown> | undefined)
      : undefined;
    let canonicalId = createCanonicalQuestionId(set.categoryKey);
    if (typeof existingRow?.canonicalId === "string") {
      canonicalId = existingRow.canonicalId;
    }
    if (typeof data.canonicalId === "string") {
      canonicalId = data.canonicalId;
    }
    row.canonicalId = canonicalId;

    let canonicalImageId: number | undefined;
    if (typeof existingRow?.canonicalImageId === "number") {
      canonicalImageId = existingRow.canonicalImageId;
    }
    if (typeof data.canonicalImageId === "number") {
      canonicalImageId = data.canonicalImageId;
    }
    if (canonicalImageId !== undefined) {
      row.canonicalImageId = canonicalImageId;
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
  const set = getSetById(setId);
  if (set?.isCanonical) return;

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

export function getAllQuestionsForLang(lang: string): Catego {
  const normalizedLang = normalizeLang(lang);
  const questionTable = store.getTable("questions") as Record<string, Record<string, unknown>>;
  const setTable = store.getTable("sets") as Record<string, Record<string, unknown>>;
  const result: Catego = {};

  for (const [id, row] of Object.entries(questionTable)) {
    const setId = row.setId as string | undefined;
    const setRow = setId ? setTable[setId] : undefined;
    if (normalizeLang(row.lang ?? setRow?.lang) !== normalizedLang) continue;

    const catKey = (row.categoryKey as string) ?? (setRow?.categoryKey as string);
    if (!catKey) continue;
    if (!result[catKey]) result[catKey] = [];

    const ans = collectAnswers(row);
    const isCustom = !isCanonicalRow(row);
    const customImage = typeof row.imageData === "string" ? row.imageData : undefined;
    const canonicalImage = customImage || getCanonicalImageUrl(catKey, row);

    result[catKey].push({
      id: isCustom ? createCustomQuestionId(catKey, id) : ((row.canonicalId as string) ?? id),
      q: row.q as string,
      ans,
      v: row.v as string,
      imageUrl: isCustom ? customImage : canonicalImage,
      i: row.canonicalImageId as number,
      isCustom,
    });
  }

  return result;
}

export async function exportAllQuestionsAsJson(lang: string): Promise<void> {
  const normalizedLang = normalizeLang(lang);
  await ensureCanonicalLoaded(normalizedLang);

  const data = getAllQuestionsForLang(normalizedLang);

  const exportData: Record<string, Category[]> = {};
  for (const [cat, questions] of Object.entries(data)) {
    exportData[cat] = questions.map((q) => {
      const { isCustom: _isCustom, imageUrl: _imageUrl, ...rest } = q;
      return rest;
    });
  }

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fileName = normalizedLang === "ro" ? "catego.json" : `catego-${normalizedLang}.json`;
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
