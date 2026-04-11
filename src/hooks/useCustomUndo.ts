import { useEffect, useState } from "react";
import {
  addCustomUndoListener,
  getCustomUndoState,
  undoCustomStoreChange,
} from "../lib/customStore";

export function useCustomUndo(): {
  canUndo: boolean;
  undoLabel: string;
  undo: () => boolean;
} {
  const [undoState, setUndoState] = useState(getCustomUndoState);

  useEffect(() => addCustomUndoListener(() => setUndoState(getCustomUndoState())), []);

  const undo = () => {
    const didUndo = undoCustomStoreChange();
    if (didUndo) {
      setUndoState(getCustomUndoState());
    }
    return didUndo;
  };

  return {
    canUndo: undoState.canUndo,
    undoLabel: undoState.label,
    undo,
  };
}
