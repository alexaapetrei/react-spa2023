import * as React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "@tanstack/react-form";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { saveSet, saveQuestion, getCategoryKeysForLang, getSetById } from "../lib/customStore";
import type { QuestionRow } from "../lib/customStore";
import { hasCustomCategoryKeyCollision, slugifyCustomCategoryName } from "../lib/customCategory";

type AnswerValue = {
  letter: string;
  text: string;
  correct: boolean;
};

type Props = {
  setId?: string;
  editQuestion?: { id: string } & QuestionRow;
  resetKey?: number;
  onSaved?: () => void;
  onQuestionSaved?: (questionText: string, setId: string) => void;
};

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function rowToAnswers(row: QuestionRow): AnswerValue[] {
  return LETTERS.filter((l) => row[l as keyof QuestionRow]).map((l) => ({
    letter: l,
    text: (row[l as keyof QuestionRow] as string) ?? "",
    correct: row.v.includes(l),
  }));
}

export function CustomQuestionForm({
  setId: initialSetId,
  editQuestion,
  resetKey,
  onSaved,
  onQuestionSaved,
}: Props) {
  const { t, i18n } = useTranslation();
  const isNewSet = !initialSetId;
  const isEditing = !!editQuestion;

  const [savedCount, setSavedCount] = React.useState(0);
  const [currentSetId, setCurrentSetId] = React.useState<string | undefined>(initialSetId);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const questionRef = React.useRef<HTMLTextAreaElement>(null);
  const answerInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm({
    defaultValues: {
      setName: "",
      lang: i18n.language || "ro",
      questionText: "",
      answers: [
        { letter: "a", text: "", correct: false },
        { letter: "b", text: "", correct: false },
      ],
      imageData: "",
      imageExt: "",
    },
  });

  const Field = form.Field;

  const resetQuestionFields = () => {
    form.setFieldValue("questionText", "");
    form.setFieldValue("answers", [
      { letter: "a", text: "", correct: false },
      { letter: "b", text: "", correct: false },
    ]);
    form.setFieldValue("imageData", "");
    form.setFieldValue("imageExt", "");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  React.useEffect(() => {
    if (!editQuestion) {
      resetQuestionFields();
      return;
    }

    form.setFieldValue("questionText", editQuestion.q);
    const populated = rowToAnswers(editQuestion);
    form.setFieldValue(
      "answers",
      populated.length >= 2
        ? populated
        : [
            { letter: "a", text: "", correct: false },
            { letter: "b", text: "", correct: false },
          ],
    );
    form.setFieldValue("imageData", editQuestion.imageData ?? "");
    form.setFieldValue("imageExt", editQuestion.imageExt ?? "");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }, [editQuestion?.id]);

  React.useEffect(() => {
    if (resetKey === undefined) return;
    resetQuestionFields();
    setTimeout(() => questionRef.current?.focus(), 0);
  }, [resetKey]);

  const handleAddAnswer = () => {
    const answers = form.getFieldValue("answers") ?? [];
    if (answers.length >= 10) return;
    const nextLetter = LETTERS[answers.length];
    form.setFieldValue("answers", [...answers, { letter: nextLetter, text: "", correct: false }]);
    setTimeout(() => {
      answerInputRefs.current[answers.length]?.focus();
    }, 0);
  };

  const handleRemoveAnswer = (idx: number) => {
    const answers = form.getFieldValue("answers") ?? [];
    if (answers.length <= 2) return;
    form.setFieldValue(
      "answers",
      answers.filter((_: unknown, i: number) => i !== idx),
    );
  };

  const handleAnswerText = (idx: number, text: string) => {
    const answers = form.getFieldValue("answers") ?? [];
    form.setFieldValue(
      "answers",
      answers.map((a: AnswerValue, i: number) => (i === idx ? { ...a, text } : a)),
    );
  };

  const handleAnswerCorrect = (idx: number, correct: boolean) => {
    const answers = form.getFieldValue("answers") ?? [];
    form.setFieldValue(
      "answers",
      answers.map((a: AnswerValue, i: number) => (i === idx ? { ...a, correct } : a)),
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = await readFileAsDataURL(file);
    form.setFieldValue("imageData", preview);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    form.setFieldValue("imageExt", ext);
  };

  const handleRemoveImage = () => {
    form.setFieldValue("imageData", "");
    form.setFieldValue("imageExt", "");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleCheckCollision = (name: string, lang: string, excludeKey?: string): boolean => {
    if (!name.trim()) return false;
    const categoryKey = slugifyCustomCategoryName(name);
    const existingKeys = getCategoryKeysForLang(lang);
    return hasCustomCategoryKeyCollision(existingKeys, categoryKey, excludeKey);
  };

  const handleSaveNext = async (): Promise<string | null> => {
    setValidationError(null);

    const setName = form.getFieldValue("setName") ?? "";
    const lang = form.getFieldValue("lang") ?? "ro";
    const answers = form.getFieldValue("answers") ?? [];
    const questionTextValue = form.getFieldValue("questionText") ?? "";

    const currentSet = currentSetId ? getSetById(currentSetId) : null;
    if (handleCheckCollision(setName, lang, currentSet?.categoryKey)) {
      setValidationError(t("custom.categoryExists"));
      return null;
    }

    if (!questionTextValue.trim()) {
      setValidationError(t("custom.validationQuestionRequired"));
      return null;
    }
    if (answers.length < 2) {
      setValidationError(t("custom.validationMinAnswers"));
      return null;
    }
    if (!answers.some((a: AnswerValue) => a.correct)) {
      setValidationError(t("custom.validationCorrectAnswer"));
      return null;
    }
    if (answers.some((a: AnswerValue) => !a.text.trim())) {
      setValidationError(t("custom.validationAnswerText"));
      return null;
    }

    let setIdToUse = currentSetId;

    if (isNewSet && (!setIdToUse || !getSetById(setIdToUse))) {
      if (!setName.trim()) {
        setValidationError(t("custom.setNameRequired"));
        return null;
      }
      const categoryKey = slugifyCustomCategoryName(setName);
      const newId = saveSet({ name: setName.trim(), lang, categoryKey });
      setIdToUse = newId;
      setCurrentSetId(newId);
    }

    if (!setIdToUse) {
      setValidationError(t("custom.setNameRequired"));
      return null;
    }

    const correctLetters = answers
      .filter((a: AnswerValue) => a.correct)
      .map((a: AnswerValue) => a.letter)
      .join("");
    const rowData: Parameters<typeof saveQuestion>[1] = {
      q: questionTextValue.trim(),
      v: correctLetters,
    };

    for (const ans of answers) {
      (rowData as Record<string, string>)[ans.letter] = ans.text.trim();
    }

    const imageData = form.getFieldValue("imageData") ?? "";
    const imageExt = form.getFieldValue("imageExt") ?? "";
    if (imageData) {
      rowData.imageData = imageData;
      rowData.imageExt = imageExt;
    }

    saveQuestion(setIdToUse, rowData, isEditing ? editQuestion!.id : undefined);

    const questionId = isEditing ? editQuestion!.id : `temp-${Date.now()}`;

    if (isEditing) {
      onSaved?.();
    } else {
      setSavedCount((c) => c + 1);
      onQuestionSaved?.(questionTextValue.trim(), setIdToUse);
    }

    resetQuestionFields();
    setTimeout(() => questionRef.current?.focus(), 0);

    return questionId;
  };

  return (
    <div className="space-y-6">
      {isNewSet && (
        <Card>
          <CardHeader>
            <p className="editorial-kicker">{t("custom.setMetadata")}</p>
            <CardTitle>{t("custom.newSet")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              name="setName"
              children={(field) => (
                <div className="space-y-1">
                  <label className="editorial-label">{t("custom.setName")}</label>
                  <input
                    type="text"
                    className="editorial-input focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.map((err) => (
                    <p key={err} className="text-sm text-red-600">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            />
            <form.Subscribe selector={(state) => [state.values.setName, state.values.lang]}>
              {([currentSetName, currentLang]) => {
                const currentSet = currentSetId ? getSetById(currentSetId) : null;
                if (
                  handleCheckCollision(
                    currentSetName ?? "",
                    currentLang ?? "ro",
                    currentSet?.categoryKey,
                  )
                ) {
                  return <p className="text-sm text-red-600">{t("custom.categoryExists")}</p>;
                }
                return null;
              }}
            </form.Subscribe>
            <Field
              name="lang"
              children={(field) => (
                <div className="space-y-1">
                  <label className="editorial-label">{t("custom.language")}</label>
                  <select
                    className="editorial-select focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="ro">Română</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="hu">Magyar</option>
                  </select>
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="editorial-kicker">{t("custom.questionEditor")}</p>
              <CardTitle>
                {isEditing ? t("custom.editQuestion") : t("custom.questionText")}
              </CardTitle>
            </div>
            {!isEditing && savedCount > 0 && (
              <span className="border border-border px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("custom.questionsAdded", { count: savedCount })}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <Field
              name="imageData"
              children={(field) => (
                <div className="space-y-3">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {field.state.value ? (
                    <>
                      <div className="flex min-h-56 items-center justify-center border border-border bg-muted/30 p-2">
                        <img
                          src={field.state.value}
                          alt="Preview"
                          className="max-h-72 w-full object-contain"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("custom.removeImage")}
                      </Button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex min-h-56 w-full items-center justify-center border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    >
                      {t("custom.addImage")}
                    </button>
                  )}
                </div>
              )}
            />

            <div className="min-w-0 space-y-4">
              <Field
                name="questionText"
                children={(field) => (
                  <textarea
                    ref={questionRef}
                    className="editorial-input min-h-[120px] resize-none focus:ring-2 focus:ring-primary/30 focus:outline-none"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t("custom.questionText")}
                  />
                )}
              />

              <Field
                name="answers"
                children={(field) => {
                  const answers = field.state.value ?? [];
                  return (
                    <div className="space-y-2">
                      <p className="editorial-label">{t("custom.answers")}</p>
                      {answers.map((ans: AnswerValue, idx: number) => (
                        <div key={ans.letter} className="flex items-center gap-2">
                          <span className="shrink-0 border border-border bg-muted px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {ans.letter}
                          </span>
                          <input
                            type="text"
                            ref={(el) => {
                              answerInputRefs.current[idx] = el;
                            }}
                            className="editorial-input flex-1 py-2 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                            value={ans.text}
                            onChange={(e) => handleAnswerText(idx, e.target.value)}
                          />
                          <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={ans.correct}
                              className="h-4 w-4 rounded-none border-input text-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
                              onChange={(e) => handleAnswerCorrect(idx, e.target.checked)}
                            />
                            {t("custom.correctAnswer")}
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={answers.length <= 2}
                            onClick={() => handleRemoveAnswer(idx)}
                            className="h-8 w-8 shrink-0 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={answers.length >= 10}
                        onClick={handleAddAnswer}
                      >
                        + {t("custom.addAnswer")}
                      </Button>
                    </div>
                  );
                }}
              />

              {validationError && <p className="text-sm text-red-600">{validationError}</p>}

              <Button
                onClick={async () => {
                  const qId = await handleSaveNext();
                  if (qId && onQuestionSaved) {
                    onQuestionSaved(
                      form.getFieldValue("questionText") ?? "",
                      currentSetId ?? setId ?? "",
                    );
                  }
                }}
                className="w-full"
              >
                {isEditing ? t("custom.updateQuestion") : t("custom.saveNext")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
