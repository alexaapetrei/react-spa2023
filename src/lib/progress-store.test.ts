import { afterEach, expect, it, vi } from "vitest";
import { clearAllProgress, progressStore } from "./progress-store";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("clears saved answers for every category", () => {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });

  progressStore.set({ corecte: ["a-1", "b-2"], gresite: ["dan-3"] });
  clearAllProgress();

  expect(progressStore.get()).toEqual({ corecte: [], gresite: [] });
});
