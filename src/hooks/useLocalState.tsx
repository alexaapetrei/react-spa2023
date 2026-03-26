import { useState } from "react";

export type localState = { corecte: string[]; gresite: string[] };

const STORAGE_KEY = "state";
const DEFAULT_STATE: localState = { corecte: [], gresite: [] };

/**
 * Reads quiz progress from localStorage synchronously on mount (lazy init —
 * no flash of empty state). The write side is intentionally kept explicit in
 * the components that mutate it so saves are easy to reason about.
 */
function useLocalState(
  defaultState: localState = DEFAULT_STATE,
): [localState, React.Dispatch<React.SetStateAction<localState>>] {
  const [state, setState] = useState<localState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as localState) : defaultState;
    } catch {
      return defaultState;
    }
  });

  return [state, setState];
}

export default useLocalState;
