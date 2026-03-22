import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardFooter } from "../components/ui/card";
import { CustomQuestionForm } from "../components/custom-question-form";
import { getQuestionsForSet, deleteQuestion, store } from "../lib/customStore";
import type { QuestionRow, SetRow } from "../lib/customStore";

type QuestionItem = { id: string } & QuestionRow;

export function CustomEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setId } = useParams({ from: "/custom/$setId" });

  // Read set metadata from store
  const setMeta = store.getRow("sets", setId) as SetRow | undefined;

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [deleteQTarget, setDeleteQTarget] = useState<string | null>(null);

  const refreshQuestions = () => setQuestions(getQuestionsForSet(setId) as QuestionItem[]);

  useEffect(() => {
    refreshQuestions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteQuestion = (qId: string) => {
    deleteQuestion(qId);
    setDeleteQTarget(null);
    refreshQuestions();
  };

  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6 lg:items-start">
      {/* Sidebar */}
      <div className="mb-6 lg:mb-0">
        <div className="lg:sticky lg:top-4 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold">{t("custom.existingQuestions")}</p>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
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
                {questions.map((q, idx) => (
                  <div key={q.id} className="group relative">
                    <button
                      className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                        editingQuestion?.id === q.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/70 text-foreground"
                      }`}
                      onClick={() => setEditingQuestion(q)}
                    >
                      <span className="font-mono text-xs text-muted-foreground shrink-0 mt-0.5 w-5">
                        {idx + 1}.
                      </span>
                      <span className="line-clamp-2 flex-1 min-w-0 pr-5">{q.q}</span>
                    </button>
                    <Dialog.Root
                      open={deleteQTarget === q.id}
                      onOpenChange={(open) => {
                        if (!open) setDeleteQTarget(null);
                      }}
                    >
                      <Dialog.Trigger asChild>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteQTarget(q.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150" />
                        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150">
                          <Card className="w-full max-w-sm">
                            <CardHeader>
                              <Dialog.Title className="font-semibold text-lg">
                                {t("custom.deleteQuestionTitle")}
                              </Dialog.Title>
                              <Dialog.Description className="text-sm text-muted-foreground line-clamp-3">
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
                                  if (editingQuestion?.id === q.id) setEditingQuestion(null);
                                  handleDeleteQuestion(q.id);
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
      </div>

      {/* Main */}
      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/custom" as any })}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("custom.title")}
          </Button>
          {(setMeta as SetRow | undefined)?.name && (
            <h2 className="text-xl font-bold truncate">{(setMeta as SetRow).name}</h2>
          )}
        </div>
        <CustomQuestionForm
          setId={setId}
          editQuestion={editingQuestion ?? undefined}
          onSaved={() => {
            setEditingQuestion(null);
            refreshQuestions();
          }}
          onQuestionSaved={() => {
            refreshQuestions();
          }}
          onDone={() => navigate({ to: "/custom" as any })}
        />
      </div>
    </div>
  );
}
