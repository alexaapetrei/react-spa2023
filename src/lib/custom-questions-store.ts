import { useSyncExternalStore } from "react";
import { progressStore } from "./progress-store";

const DATABASE_NAME = "urssur-custom-questions";
const DATABASE_VERSION = 1;
const STORE_NAME = "records";
const QUESTIONS_KEY = "custom-questions";
const LEGACY_STORAGE_KEY = "custom-questions";

export const CONTENT_LANGUAGES = ["ro", "en", "de", "hu"] as const;
export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];
export type LocalizedContent = { text: Partial<Record<ContentLanguage, string>>; image?: Blob };
export type CustomQuestion = {
  id: string;
  categoria: string;
  q: LocalizedContent;
  ans: Record<string, LocalizedContent>;
  v: string;
  createdAt: number;
};
export type NewCustomQuestion = Omit<CustomQuestion, "id" | "v" | "createdAt"> & {
  correct: string[];
};

type LegacyContent = { text: Partial<Record<ContentLanguage, string>>; image?: string | Blob };
type StoreQuestion = Omit<CustomQuestion, "q" | "ans"> & {
  q: LegacyContent | string;
  ans: Record<string, LegacyContent | string>;
};

export function correctAnswerKeys(value: string): string[] {
  return value.replaceAll(",", "").split("").filter(Boolean);
}

const NO_QUESTIONS: readonly CustomQuestion[] = Object.freeze([]);
let snapshot: readonly CustomQuestion[] = NO_QUESTIONS;
const listeners = new Set<() => void>();
let databasePromise: Promise<IDBDatabase> | undefined;
let initializationPromise: Promise<void> | undefined;
let mutationQueue: Promise<void> = Promise.resolve();

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable in this browser."));
  }
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open question storage."));
    request.onblocked = () => reject(new Error("Question storage is blocked by another tab."));
  }).catch((error: unknown) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

function readRecord(database: IDBDatabase): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(QUESTIONS_KEY);
    let result: unknown;
    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(request.error ?? new Error("Could not read saved questions."));
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Could not read saved questions."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Reading saved questions was aborted."));
  });
}

function writeRecord(database: IDBDatabase, questions: readonly CustomQuestion[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(questions, QUESTIONS_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Could not save questions to IndexedDB."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Saving questions to IndexedDB was aborted."));
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isContent(value: unknown): value is LegacyContent | string {
  if (typeof value === "string") return true;
  if (!isRecord(value) || !isRecord(value.text)) return false;
  return Object.values(value.text).every((text) => typeof text === "string");
}

function isQuestion(value: unknown): value is StoreQuestion {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.categoria === "string" &&
    typeof value.v === "string" &&
    isContent(value.q) &&
    isRecord(value.ans) &&
    Object.values(value.ans).every(isContent)
  );
}

async function normalizeContent(value: LegacyContent | string): Promise<LocalizedContent> {
  if (typeof value === "string") return { text: { ro: value } };
  const image = value.image;
  let blob: Blob | undefined;
  if (typeof Blob !== "undefined" && image instanceof Blob) blob = image;
  else if (typeof image === "string" && image.startsWith("data:image/")) {
    const response = await fetch(image);
    if (!response.ok) throw new Error("Could not migrate a saved image.");
    blob = await response.blob();
  }
  return { text: value.text, image: blob };
}

async function normalizeQuestions(values: unknown[]): Promise<CustomQuestion[]> {
  const questions: CustomQuestion[] = [];
  for (const value of values) {
    if (!isQuestion(value)) continue;
    const ans: Record<string, LocalizedContent> = {};
    for (const [key, content] of Object.entries(value.ans)) {
      ans[key] = await normalizeContent(content);
    }
    questions.push({
      id: value.id,
      categoria: value.categoria,
      q: await normalizeContent(value.q),
      ans,
      v: correctAnswerKeys(value.v).join(""),
      createdAt: typeof value.createdAt === "number" ? value.createdAt : Date.now(),
    });
  }
  return questions;
}

async function initialize(): Promise<void> {
  const database = await openDatabase();
  const saved = await readRecord(database);
  if (Array.isArray(saved)) {
    snapshot = await normalizeQuestions(saved);
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // The IndexedDB copy is already authoritative; a stale legacy key is harmless.
    }
    return;
  }

  let migrated: CustomQuestion[] = [];
  let legacyCanBeRemoved = false;
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw === null) {
      legacyCanBeRemoved = true;
    } else {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        migrated = await normalizeQuestions(parsed);
        legacyCanBeRemoved = true;
      }
    }
  } catch {
    // Keep a bad legacy value untouched so it can still be recovered manually.
  }
  await writeRecord(database, migrated);
  snapshot = migrated;
  if (legacyCanBeRemoved) {
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // The IndexedDB copy is already authoritative; a stale legacy key is harmless.
    }
  }
}

function ensureInitialized(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initialize().then(() => {
      for (const listener of listeners) listener();
    });
  }
  return initializationPromise;
}

function notify(): void {
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  void ensureInitialized().catch(() => notify());
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("urssur-custom-questions");
    channel.onmessage = () => {
      void mutationQueue.then(async () => {
        const database = await openDatabase();
        const value = await readRecord(database);
        if (Array.isArray(value)) {
          snapshot = await normalizeQuestions(value);
          notify();
        }
      });
    };
  }
}

export const customQuestionsStore = {
  get: () => snapshot,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  use: () =>
    useSyncExternalStore(
      customQuestionsStore.subscribe,
      customQuestionsStore.get,
      () => NO_QUESTIONS,
    ),
};

export const useCustomQuestions = customQuestionsStore.use;

function updateQuestions(updater: (questions: readonly CustomQuestion[]) => CustomQuestion[]) {
  const operation = mutationQueue.then(async () => {
    await ensureInitialized();
    const next = updater(snapshot);
    const database = await openDatabase();
    await writeRecord(database, next);
    snapshot = next;
    notify();
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("urssur-custom-questions");
      channel.postMessage("updated");
      channel.close();
    }
    return next;
  });
  mutationQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

export async function addCustomQuestion(input: NewCustomQuestion): Promise<CustomQuestion> {
  return (await addCustomQuestions([input]))[0];
}

export async function addCustomQuestions(inputs: NewCustomQuestion[]): Promise<CustomQuestion[]> {
  const createdAt = Date.now();
  const created = inputs.map((input, index): CustomQuestion => ({
    id: `${input.categoria}-custom-${createdAt.toString(36)}-${index.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    categoria: input.categoria,
    q: input.q,
    ans: input.ans,
    v: input.correct.join(""),
    createdAt,
  }));
  await updateQuestions((questions) => [...questions, ...created]);
  return created;
}

export async function removeCustomQuestion(id: string): Promise<void> {
  await updateQuestions((questions) => questions.filter((question) => question.id !== id));
}

export async function updateCustomQuestion(id: string, input: NewCustomQuestion): Promise<void> {
  const previous = snapshot.find((question) => question.id === id);
  if (!previous) return;
  const updatedId =
    previous.categoria === input.categoria
      ? id
      : `${input.categoria}-custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await updateQuestions((questions) =>
    questions.map((question) =>
      question.id === id
        ? {
            ...question,
            id: updatedId,
            categoria: input.categoria,
            q: input.q,
            ans: input.ans,
            v: input.correct.join(""),
          }
        : question,
    ),
  );
  if (updatedId !== id) {
    progressStore.update(({ corecte, gresite }) => ({
      corecte: corecte.map((questionId) => (questionId === id ? updatedId : questionId)),
      gresite: gresite.map((questionId) => (questionId === id ? updatedId : questionId)),
    }));
  }
}
