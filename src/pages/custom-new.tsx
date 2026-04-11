import { useState, useCallback, useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Undo2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { CustomQuestionForm } from "../components/custom-question-form";
import { addCustomStoreChangeListener, getQuestionsForSet, getSetById } from "../lib/customStore";
import { useCustomUndo } from "../hooks/useCustomUndo";

export function CustomNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const { canUndo, undo } = useCustomUndo();
  const [currentSetId, setCurrentSetId] = useState<string | undefined>();
  const [savedQuestions, setSavedQuestions] = useState<string[]>([]);

  const refreshSavedQuestions = useCallback(
    (setId = currentSetId) => {
      if (!setId) {
        setSavedQuestions([]);
        return;
      }

      if (!getSetById(setId)) {
        setCurrentSetId(undefined);
        setSavedQuestions([]);
        return;
      }

      setSavedQuestions(getQuestionsForSet(setId).map((question) => question.q));
    },
    [currentSetId],
  );

  useEffect(
    () => addCustomStoreChangeListener(() => refreshSavedQuestions()),
    [refreshSavedQuestions],
  );

  const handleQuestionSaved = useCallback(
    (_questionText: string, setId: string) => {
      setCurrentSetId(setId);
      refreshSavedQuestions(setId);
    },
    [refreshSavedQuestions],
  );

  const handleUndo = useCallback(() => {
    if (!undo()) return;
    refreshSavedQuestions();
    router.invalidate();
  }, [refreshSavedQuestions, router, undo]);

  const goBackToCustomSets = useCallback(() => {
    navigate({ to: "/custom" as any });
  }, [navigate]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
      <div>
        <div className="editorial-sidebar-shell lg:sticky lg:top-4">
          <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-4 text-white">
            <p className="editorial-label text-white/60">{t("custom.existingQuestions")}</p>
            <span className="border border-white/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-white/70">
              {savedQuestions.length}
            </span>
          </div>
          <div className="lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
            {savedQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                {t("custom.noQuestions")}
              </p>
            ) : (
              <div className="p-2 space-y-1">
                {savedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="editorial-sidebar-item border-b border-border/70 last:border-b-0"
                  >
                    <span className="font-mono text-xs text-muted-foreground shrink-0 mt-0.5 w-5">
                      {idx + 1}.
                    </span>
                    <span className="line-clamp-2 flex-1 min-w-0">{q}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="border border-border bg-card text-card-foreground">
          <div className="flex min-h-20 flex-col gap-4 border-b border-white/10 bg-black px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBackToCustomSets}
                className="-ml-3 mb-2 text-white hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("custom.title")}
              </Button>
              <p className="editorial-kicker text-white/60">{t("custom.kicker")}</p>
              <h2 className="mt-2 truncate text-[26px] font-medium leading-[1.15] text-white">
                {t("custom.newSet")}
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!canUndo}
              onClick={handleUndo}
              title={t("common.undo")}
              className="border-white bg-transparent text-white hover:border-white/70 hover:bg-white/10 hover:text-white"
            >
              <Undo2 className="mr-2 h-4 w-4" />
              {t("common.undo")}
            </Button>
          </div>
        </div>

        <CustomQuestionForm onQuestionSaved={handleQuestionSaved} />
      </div>
    </div>
  );
}
