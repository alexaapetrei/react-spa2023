---
name: tinybase-8-best-practices
description: Best practices for using TinyBase 8 in React applications, focusing on reactive data management, stores, indexes, and UI bindings without useEffect.
---

# TinyBase 8 Best Practices

TinyBase 8 is a reactive database for local-first web applications. These guidelines ensure efficient, type-safe, and reactive state management in React.

## Core Principles

1.  **Prefer TinyBase Hooks over `useEffect`**: Use `useRow`, `useTable`, `useCell`, and `useResultTable` to reactively bind UI to state. Avoid manual synchronization with `useEffect`.
2.  **Schema-First Design**: Define a clear `TablesSchema` and `ValuesSchema` to ensure type safety across the store.
3.  **Encapsulated Logic**: Use `Queries` for complex data selection and `Indexes` for efficient lookups.
4.  **Local-First Sync**: Leverage `Synchronizers` for persistence (LocalStorage, IndexedDB) or CRDT-based remote sync.

## Implementation Guide

### 1. Store Setup (Provider Pattern)

Initialize the store and provide it to the application. Use `useCreateStore` for one-time initialization.

```tsx
import { createStore } from "tinybase";
import { Provider, useCreateStore } from "tinybase/ui-react";

export const App = () => {
  const store = useCreateStore(() =>
    createStore().setTablesSchema({
      todos: {
        text: { type: "string" },
        done: { type: "boolean", default: false },
      },
    }),
  );

  return (
    <Provider store={store}>
      <TodoApp />
    </Provider>
  );
};
```

### 2. Reactive UI Bindings

Use specific hooks to subscribe only to the data that changes.

- `useTable(tableId)`: Subscribes to an entire table.
- `useRow(tableId, rowId)`: Subscribes to a specific row.
- `useCell(tableId, rowId, cellId)`: Subscribes to a specific cell.
- `useSortedRowIds(tableId, cellId)`: Subscribes to sorted row IDs.

```tsx
import { useCell, useRow } from "tinybase/ui-react";

const TodoItem = ({ id }) => {
  const { text, done } = useRow("todos", id);
  const store = useStore();

  const toggleDone = () => store.setCell("todos", id, "done", !done);

  return (
    <div>
      <input type="checkbox" checked={done} onChange={toggleDone} />
      <span>{text}</span>
    </div>
  );
};
```

### 3. Advanced Data Selection (Queries)

For filtering, joining, or aggregating data, use the `Queries` object.

```tsx
import { createQueries } from "tinybase";
import { useCreateQueries, useResultTable } from "tinybase/ui-react";

const ActiveTodos = () => {
  const queries = useCreateQueries(store, (queries) => {
    queries.setQueryDefinition("activeTodos", "todos", ({ select, where }) => {
      select("text");
      where("done", false);
    });
  });

  const results = useResultTable("activeTodos", queries);
  // results is reactive and only contains active todos
};
```

### 4. Efficient Lookups (Indexes)

Use `Indexes` to group data (e.g., todos by category).

```tsx
import { createIndexes } from "tinybase";
import { useCreateIndexIds, useSliceIds } from "tinybase/ui-react";

const CategoryList = () => {
  const indexes = useCreateIndexes(store, (indexes) => {
    indexes.setIndexDefinition("byCategory", "todos", "category");
  });

  const categories = useSliceIds("byCategory", indexes);
  // ...
};
```

### 5. Persistence (Synchronizers)

TinyBase 8 introduces `Synchronizers` for easier persistence.

```tsx
import { createLocalPersister } from "tinybase/persisters/persister-browser";
import { useCreatePersister } from "tinybase/ui-react";

// Inside your component
useCreatePersister(
  store,
  (store) => createLocalPersister(store, "my_app_data"),
  [],
  async (persister) => {
    await persister.startAutoLoad();
    await persister.startAutoSave();
  },
);
```

## Checklist

- [ ] Is the store schema defined?
- [ ] Are we using `useRow`/`useCell` instead of manual `useState`?
- [ ] For complex filtering, are we using `Queries`?
- [ ] Is the `Provider` correctly wrapping the component tree?
- [ ] Are we using `useCreateStore` to avoid re-creating the store on re-renders?
