import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Trash2, Pencil, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardFooter } from "../components/ui/card";
import { CustomQuestionForm } from "../components/custom-question-form";
import {
  deleteQuestion,
  updateSet,
  getCategoryKeysForLang,
  undoCustomStoreChange,
  redoCustomStoreChange,
} from "../lib/customStore";
import { router, customEditRoute } from "../router";
import type { QuestionRow, SetRow } from "../lib/customStore";
import { hasCustomCategoryKeyCollision, slugifyCustomCategoryName } from "../lib/customCategory";

export function CustomEditPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setId } = useParams({ from: "/custom/$setId" });
  const { setMeta, questions } = customEditRoute.useLoaderData() as {
    setMeta: ({ id: string } & SetRow) | null;
    questions: Array<{ id: string } & QuestionRow>;
  };

  const [editingQuestion, setEditingQuestion] = useState<(typeof questions)[0] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(setMeta?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const lang = i18n.language || "ro";

  const saveName = () => {
    setError(null);
    if (!editName.trim()) return setError(t("custom.setNameRequired"));
    if (!setMeta) return;

    const key = slugifyCustomCategoryName(editName);
    if (hasCustomCategoryKeyCollision(getCategoryKeysForLang(lang), key, setMeta.categoryKey)) {
      return setError(t("custom.categoryExists"));
    }

    updateSet(setId, { name: editName.trim(), lang, categoryKey: key });
    setIsEditingName(false);
    router.invalidate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      undoCustomStoreChange();
    }
    if (
      (e.key === "y" && (e.ctrlKey || e.metaKey)) ||
      (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)
    ) {
      e.preventDefault();
      redoCustomStoreChange();
    }
  };

  return (
    <div
      className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start"
      onKeyDown={handleKeyDown}
    >
      <div className="editorial-sidebar-shell lg:sticky lg:top-4">
        <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-4 text-white">
          <p className="editorial-label text-white/60">{t("custom.existingQuestions")}</p>
          <span className="border border-white/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-white/70">
            {questions.length}
          </span>
        </div>
        <div className="lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              {t("custom.noQuestions")}
            </p>
          ) : (
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setEditingQuestion(null);
                  setResetKey((k) => k + 1);
                }}
                className="flex w-full items-center justify-center gap-2 rounded border-2 border-dashed border-white/20 px-4 py-4 text-white/60 transition-colors hover:border-white/40 hover:text-white"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">{t("custom.newQuestion")}</span>
              </button>
              {[...questions].reverse().map((q, idx) => (
                <div key={q.id} className="group relative">
                  <button
                    className={`editorial-sidebar-item w-full ${editingQuestion?.id === q.id ? "editorial-sidebar-item-active font-medium" : "editorial-sidebar-item-idle"}`}
                    onClick={() => setEditingQuestion(q)}
                  >
                    <span className="font-mono text-xs text-muted-foreground shrink-0 mt-0.5 w-5">
                      {questions.length - idx}.
                    </span>
                    <span className="line-clamp-2 flex-1 min-w-0 pr-5">{q.q}</span>
                  </button>
                  <Dialog.Root
                    open={deleteTarget === q.id}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                  >
                    <Dialog.Trigger asChild>
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 border border-transparent p-1 opacity-0 transition-opacity text-muted-foreground hover:text-destructive group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(q.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="editorial-dialog-overlay" />
                      <Dialog.Content className="editorial-dialog-content">
                        <Card className="w-full max-w-sm">
                          <CardHeader>
                            <p className="editorial-kicker">{t("custom.deleteQuestionLabel")}</p>
                            <Dialog.Title className="text-[24px] font-medium leading-[1.2]">
                              {t("custom.deleteQuestionTitle")}
                            </Dialog.Title>
                            <Dialog.Description className="line-clamp-3 text-[13px] text-muted-foreground">
                              {q.q}
                            </Dialog.Description>
                          </CardHeader>
                          <CardFooter className="justify-end gap-2">
                            <Dialog.Close asChild>
                              <Button variant="outline">{t("common.cancel")}</Button>
                            </Dialog.Close>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setEditingQuestion(null);
                                deleteQuestion(q.id);
                                setDeleteTarget(null);
                                router.invalidate();
                              }}
                            >
                              {t("custom.deleteSet")}
                            </Button>
                          </CardFooter>
                        </Card>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="border border-border bg-card text-card-foreground">
          <div className="flex items-center justify-between border-b border-white/10 bg-black px-5 py-4 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/custom" as any })}
                className="shrink-0 text-white hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("custom.title")}
              </Button>
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
                    <button
                      className="rounded p-1 text-white/50 opacity-60 transition-all hover:opacity-100 hover:bg-white/10"
                      onClick={() => setIsEditingName(true)}
                      title={t("custom.editSet")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <CustomQuestionForm
          setId={setId}
          editQuestion={editingQuestion ?? undefined}
          resetKey={resetKey}
          onSaved={() => {
            setEditingQuestion(null);
            router.invalidate();
          }}
          onQuestionSaved={() => router.invalidate()}
        />
      </div>
    </div>
  );
}
