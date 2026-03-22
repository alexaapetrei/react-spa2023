import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { CustomQuestionForm } from "../components/custom-question-form";

export function CustomNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [savedQuestions, setSavedQuestions] = useState<string[]>([]);

  const handleQuestionSaved = useCallback((questionText: string) => {
    setSavedQuestions((prev) => [...prev, questionText]);
  }, []);

  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6 lg:items-start">
      {/* Sidebar */}
      <div className="mb-6 lg:mb-0">
        <div className="lg:sticky lg:top-4 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold">{t("custom.existingQuestions")}</p>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
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
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground"
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

      {/* Main */}
      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/custom" as any })}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("custom.title")}
          </Button>
          <h2 className="text-xl font-bold">{t("custom.newSet")}</h2>
        </div>
        <CustomQuestionForm
          onQuestionSaved={handleQuestionSaved}
          onDone={() => navigate({ to: "/custom" as any })}
        />
      </div>
    </div>
  );
}
