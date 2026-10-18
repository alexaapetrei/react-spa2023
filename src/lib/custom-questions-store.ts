import { createLocalStore } from "./local-store";
import { progressStore } from "./progress-store";

export const CONTENT_LANGUAGES = ["ro", "en", "de", "hu"] as const;
export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];
export type LocalizedContent = { text: Partial<Record<ContentLanguage, string>>; image?: string };
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

export function correctAnswerKeys(value: string): string[] {
  return value.replaceAll(",", "").split("").filter(Boolean);
}

const NO_QUESTIONS: readonly CustomQuestion[] = Object.freeze([]);
function isContent(value: unknown): value is LocalizedContent {
  if (typeof value === "string") return true; // migrate old local questions
  return !!value && typeof value === "object" && !!(value as LocalizedContent).text;
}
function normalizeContent(value: LocalizedContent | string): LocalizedContent {
  return typeof value === "string" ? { text: { ro: value } } : value;
}
function isCustomQuestion(value: unknown): value is CustomQuestion {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CustomQuestion>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.categoria === "string" &&
    typeof candidate.v === "string" &&
    isContent(candidate.q) &&
    !!candidate.ans &&
    typeof candidate.ans === "object" &&
    Object.values(candidate.ans).every(isContent)
  );
}

export const customQuestionsStore = createLocalStore<CustomQuestion[]>({
  key: "custom-questions",
  fallback: NO_QUESTIONS as CustomQuestion[],
  parse: (raw) => {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(isCustomQuestion).map((question) => ({
          ...question,
          q: normalizeContent(question.q),
          ans: Object.fromEntries(
            Object.entries(question.ans).map(([key, value]) => [key, normalizeContent(value)]),
          ),
          v: correctAnswerKeys(question.v).join(""),
        }))
      : (NO_QUESTIONS as CustomQuestion[]);
  },
});
export const useCustomQuestions = customQuestionsStore.use;

export function addCustomQuestion(input: NewCustomQuestion): CustomQuestion {
  return addCustomQuestions([input])[0];
}

export function addCustomQuestions(inputs: NewCustomQuestion[]): CustomQuestion[] {
  const createdAt = Date.now();
  const created = inputs.map((input, index): CustomQuestion => ({
    id: `${input.categoria}-custom-${createdAt.toString(36)}-${index.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    categoria: input.categoria,
    q: input.q,
    ans: input.ans,
    v: input.correct.join(""),
    createdAt,
  }));
  customQuestionsStore.update((questions) => [...questions, ...created]);
  return created;
}
export function removeCustomQuestion(id: string): void {
  customQuestionsStore.update((questions) => questions.filter((question) => question.id !== id));
}

export function updateCustomQuestion(id: string, input: NewCustomQuestion): void {
  const previous = customQuestionsStore.get().find((question) => question.id === id);
  if (!previous) return;
  const updatedId =
    previous.categoria === input.categoria
      ? id
      : `${input.categoria}-custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  customQuestionsStore.update((questions) =>
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
