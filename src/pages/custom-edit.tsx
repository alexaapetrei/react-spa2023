import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { useRow, useSliceRowIds } from "tinybase/ui-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardFooter } from "../components/ui/card";
import { CustomQuestionForm } from "../components/custom-question-form";
import {
  deleteQuestion,
  updateSet,
  getCategoryKeysForLang,
  indexes,
  store,
  type SetRow,
  type QuestionRow,
} from "../lib/customStore";
import { hasCustomCategoryKeyCollision, slugifyCustomCategoryName } from "../lib/customCategory";
import { useCustomUndo } from "../hooks/useCustomUndo";
import { QuestionListItem } from "../components/QuestionListItem";

/**
 * Leaf component for delete dialog - subscribes only to its own question row.
 */
function DeleteDialogContent({
  questionId,
  onDelete,
  onCancel,
}: {
  questionId: string;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const row = useRow("questions", questionId, store);

  if (!row) return null;

  const question = row as unknown as QuestionRow;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <p className="editorial-kicker">{t("custom.deleteQuestionLabel")}</p>
        <Dialog.Title className="text-[24px] font-medium leading-[1.2]">
          {t("custom.deleteQuestionTitle")}
        </Dialog.Title>
        <Dialog.Description className="line-clamp-3 text-[13px] text-muted-foreground">
          {question.q}
        </Dialog.Description>
      </CardHeader>
      <CardFooter className="justify-end gap-2">
        <Dialog.Close asChild>
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </Dialog.Close>
        <Button variant="destructive" onClick={onDelete}>
          {t("custom.deleteSet")}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function CustomEditPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setId } = useLoaderData({ from: "/custom/$setKey" });
  const setMetaRow = useRow("sets", setId, store);
  const setMeta = setMetaRow
    ? ({ id: setId, ...(setMetaRow as unknown as SetRow) } as const)
    : null;
  const isCanonicalSet = setMeta?.isCanonical === true || setId.startsWith("canonical:");
  const { undo, redo } = useCustomUndo();

  const questionIds = useSliceRowIds("bySet", setId, indexes);
  const totalQuestions = questionIds.length;

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(setMeta?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const lang = i18n.language || "ro";

  const saveName = () => {
    if (isCanonicalSet) return;
    setError(null);
    if (!editName.trim()) return setError(t("custom.setNameRequired"));
    if (!setMeta) return;

    const key = slugifyCustomCategoryName(editName);
    if (hasCustomCategoryKeyCollision(getCategoryKeysForLang(lang), key, setMeta.categoryKey)) {
      return setError(t("custom.categoryExists"));
    }

    updateSet(setId, { name: editName.trim(), lang, categoryKey: key });
    setIsEditingName(false);
    navigate({ to: "/custom/$setKey", params: { setKey: setId }, replace: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    if (
      (e.key === "y" && (e.ctrlKey || e.metaKey)) ||
      (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)
    ) {
      e.preventDefault();
      redo();
    }
  };

  // Reverse for display (newest first)
  const reversedIds = [...questionIds].reverse();

  return (
    <div
      className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start"
      onKeyDown={handleKeyDown}
    >
      <div className="editorial-sidebar-shell lg:sticky lg:top-4">
        <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-4 text-white">
          <p className="editorial-label text-white/60">{t("custom.existingQuestions")}</p>
          <span className="border border-white/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-white/70">
            {totalQuestions}
          </span>
        </div>
        <div className="lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          {questionIds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              {t("custom.noQuestions")}
            </p>
          ) : (
            <div className="p-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetId(null);
                  setEditingQuestionId(null);
                  setResetKey((k) => k + 1);
                }}
                className="flex w-full items-center justify-center gap-2 rounded border-2 border-dashed border-white/20 px-4 py-4 text-white/60 transition-colors hover:border-white/40 hover:text-white"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">{t("custom.newQuestion")}</span>
              </button>
              {reversedIds.map((questionId, idx) => (
                <QuestionListItem
                  key={questionId}
                  questionId={questionId}
                  index={totalQuestions - idx - 1}
                  isActive={editingQuestionId === questionId}
                  onClick={() => setEditingQuestionId(questionId)}
                  onDeleteClick={(e) => {
                    e.stopPropagation();
                    setDeleteTargetId(questionId);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="border border-border bg-card text-card-foreground">
          <div className="flex items-center justify-between border-b border-white/10 bg-black px-5 py-4 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/custom">
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-white hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {t("custom.title")}
                </Button>
              </Link>
              {setMeta?.name &&
                (isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="min-w-0 rounded border border-white/30 bg-black px-2 py-1 text-[18px] font-medium text-white outline-none transition-all focus:border-white/60 focus:ring-1 focus:ring-white/20"
                      value={editName}
                      onChange={(e) => {
                        setError(null);
                        setEditName(e.target.value);
                      }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName();
                        if (e.key === "Escape") {
                          setEditName(setMeta.name);
                          setIsEditingName(false);
                        }
                      }}
                    />
                    <Button size="sm" onClick={saveName}>
                      {t("common.save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditName(setMeta.name);
                        setIsEditingName(false);
                      }}
                      className="text-white hover:bg-white/10 hover:text-white"
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-[18px] font-medium text-white">{setMeta.name}</h2>
                    {!isCanonicalSet ? (
                      <button
                        type="button"
                        className="rounded p-1 text-white/50 opacity-60 transition-all hover:opacity-100 hover:bg-white/10"
                        onClick={() => setIsEditingName(true)}
                        title={t("custom.editSet")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <CustomQuestionForm
          setId={setId}
          editQuestionId={editingQuestionId ?? undefined}
          resetKey={resetKey}
          onSaved={() => {
            setEditingQuestionId(null);
          }}
          onQuestionSaved={() => {}}
        />
      </div>

      {/* Delete Dialog */}
      <Dialog.Root
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="editorial-dialog-overlay" />
          <Dialog.Content className="editorial-dialog-content">
            {deleteTargetId && (
              <DeleteDialogContent
                questionId={deleteTargetId}
                onDelete={() => {
                  setEditingQuestionId(null);
                  deleteQuestion(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                onCancel={() => setDeleteTargetId(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
