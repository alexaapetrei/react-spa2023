import { useSyncExternalStore } from "react";

/**
 * A tiny observable backed by one `localStorage` key.
 *
 * Owns the three things every persisted store needs and that are easy to get
 * subtly wrong: a referentially-stable snapshot (React tears otherwise), a
 * listener set, and cross-tab sync via the `storage` event.
 *
 * Deliberately not `useEffect`-based: the snapshot is read synchronously at
 * module scope and re-read on write, so components stay in sync through
 * `useSyncExternalStore` alone.
 */
export type LocalStore<T> = {
  /** Current value — the same reference until a write happens. */
  get(): T;
  set(next: T): void;
  /** Functional update, so callers can't read a stale snapshot. */
  update(updater: (current: T) => T): void;
  subscribe(listener: () => void): () => void;
  /** Subscribe a component to this store. */
  use(): T;
};

export function createLocalStore<T>(options: {
  key: string;
  /** Returned when the key is absent or unreadable. Must be referentially stable. */
  fallback: T;
  /** Narrow untrusted stored JSON into `T`. Throw to fall back. */
  parse: (raw: string) => T;
}): LocalStore<T> {
  const { key, fallback, parse } = options;

  const read = (): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : parse(raw);
    } catch {
      return fallback;
    }
  };

  let snapshot = read();
  const listeners = new Set<() => void>();

  const emit = (): void => {
    snapshot = read();
    for (const listener of listeners) listener();
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  // `storage` fires only in *other* documents — exactly the cross-tab sync we
  // want. Registered once per store rather than once per subscriber.
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key === key) emit();
    });
  }

  const store: LocalStore<T> = {
    get: () => snapshot,
    set(next) {
      window.localStorage.setItem(key, JSON.stringify(next));
      emit();
    },
    update(updater) {
      store.set(updater(snapshot));
    },
    subscribe,
    use: () =>
      useSyncExternalStore(
        subscribe,
        () => snapshot,
        () => fallback,
      ),
  };

  return store;
}
