import { useUndoInformation, useRedoInformation } from "tinybase/ui-react";
import { checkpoints } from "../lib/customStore";

export function useCustomUndo() {
  const [canUndo, undo, , undoLabel] = useUndoInformation(checkpoints);
  const [canRedo, redo, , redoLabel] = useRedoInformation(checkpoints);

  return { canUndo, canRedo, undoLabel, redoLabel, undo, redo };
}
