import { useRow } from "tinybase/ui-react";
import { store, type QuestionRow } from "../lib/customStore";

interface QuestionListItemProps {
  questionId: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

/**
 * Leaf component for question list items.
 * Uses useQuestion to subscribe only to its own row updates.
 */
export function QuestionListItem({
  questionId,
  index,
  isActive,
  onClick,
  onDeleteClick,
}: QuestionListItemProps) {
  const row = useRow("questions", questionId, store);

  if (!row) return null;

  const question = row as unknown as QuestionRow;

  return (
    <div className="group relative">
      <button
        type="button"
        className={`editorial-sidebar-item w-full ${isActive ? "editorial-sidebar-item-active font-medium" : "editorial-sidebar-item-idle"}`}
        onClick={onClick}
      >
        <span className="font-mono text-xs text-muted-foreground shrink-0 mt-0.5 w-5">
          {index + 1}.
        </span>
        <span className="line-clamp-2 flex-1 min-w-0 pr-5">{question.q}</span>
      </button>
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 border border-transparent p-1 opacity-0 transition-opacity text-muted-foreground hover:text-destructive group-hover:opacity-100"
        onClick={onDeleteClick}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}
