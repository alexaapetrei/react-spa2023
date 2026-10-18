import { createLocalStore } from "./local-store";

/**
 * Quiz progress, modelled as one verdict per question.
 *
 * Question ids are namespaced `<categoria>-<n>` (e.g. `a-1066`, `dan-42`), so a
 * category owns exactly the ids that start with `<categoria>-`. Matching on the
 * delimiter matters: a bare `startsWith("d")` would sweep up every `dan-*` id.
 */

export type QuizProgress = {
  corecte: string[];
  gresite: string[];
};

export type CategoryStats = {
  /** Questions answered correctly in this category. */
  correct: number;
  /** Questions whose latest verdict was wrong. */
  wrong: number;
  /** correct + wrong. */
  answered: number;
  /** Questions in the category, when the dataset is loaded. */
  total: number | null;
  /** correct / answered, as a 0–100 integer. */
  accuracy: number;
  /** answered / total, as a 0–100 integer. Null when total is unknown. */
  coverage: number | null;
};

/** Frozen so the fallback stays referentially stable across reads. */
const EMPTY: QuizProgress = Object.freeze({ corecte: [], gresite: [] });

/** Category key for a question id. Falls back to the id when un-namespaced. */
export function categoryOf(id: string): string {
  const dash = id.indexOf("-");
  return dash === -1 ? id : id.slice(0, dash);
}

const toIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const progressStore = createLocalStore<QuizProgress>({
  key: "state",
  fallback: EMPTY,
  parse: (raw) => {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const { corecte, gresite } = parsed as Partial<QuizProgress>;
    return { corecte: toIds(corecte), gresite: toIds(gresite) };
  },
});

/** Live quiz progress, shared by every subscriber in the tree. */
export const useProgress = progressStore.use;

/**
 * Records the verdict for one question. Re-answering a question replaces its
 * previous verdict instead of appending, so counts can never exceed the number
 * of questions and progress never overshoots 100%.
 */
export function recordAnswer(id: string, correct: boolean): void {
  progressStore.update(({ corecte, gresite }) => {
    const withoutId = (ids: string[]) => ids.filter((existing) => existing !== id);
    return {
      corecte: correct ? [...withoutId(corecte), id] : withoutId(corecte),
      gresite: correct ? withoutId(gresite) : [...withoutId(gresite), id],
    };
  });
}

/** Forgets every verdict belonging to one category. */
export function clearCategory(categoria: string): void {
  progressStore.update(({ corecte, gresite }) => ({
    corecte: corecte.filter((id) => categoryOf(id) !== categoria),
    gresite: gresite.filter((id) => categoryOf(id) !== categoria),
  }));
}

/** Forgets every saved answer across all categories. */
export function clearAllProgress(): void {
  progressStore.set(EMPTY);
}

/** Derives the numbers every progress view needs, so they can't drift apart. */
export function categoryStats(
  progress: QuizProgress,
  categoria: string,
  total: number | null = null,
): CategoryStats {
  const correct = progress.corecte.filter((id) => categoryOf(id) === categoria).length;
  const wrong = progress.gresite.filter((id) => categoryOf(id) === categoria).length;
  const answered = correct + wrong;

  return {
    correct,
    wrong,
    answered,
    total,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    coverage:
      total != null && total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : null,
  };
}
