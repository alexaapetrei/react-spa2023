import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { saveSet, saveQuestion } from "../lib/customStore";
import type { QuestionRow } from "../lib/customStore";

type AnswerRow = {
  letter: string;
  text: string;
  correct: boolean;
};

type Props = {
  setId?: string;
  /** When set, the form opens pre-populated for editing this question */
  editQuestion?: { id: string } & QuestionRow;
  /** Called after an edit is saved — lets the parent clear the selection */
  onSaved?: () => void;
  onQuestionSaved?: (questionText: string, setId: string) => void;
  onDone: () => void;
};

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
const BUILT_IN_KEYS = ["a", "b", "c", "d", "dan"];

function slugify(name: string): string {
  return (
    "custom-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function rowToAnswers(row: QuestionRow): AnswerRow[] {
  return LETTERS.filter((l) => row[l as keyof QuestionRow]).map((l) => ({
    letter: l,
    text: (row[l as keyof QuestionRow] as string) ?? "",
    correct: row.v.includes(l),
  }));
}

export function CustomQuestionForm({
  setId: initialSetId,
  editQuestion,
  onSaved,
  onQuestionSaved,
  onDone,
}: Props) {
  const { t } = useTranslation();
  const isNewSet = !initialSetId;
  const isEditing = !!editQuestion;

  const [setName, setSetName] = useState("");
  const [lang, setLang] = useState("ro");
  const [categoryKey, setCategoryKey] = useState("a");
  const [newCategoryName, setNewCategoryName] = useState("");

  const [questionText, setQuestionText] = useState("");
  const [answers, setAnswers] = useState<AnswerRow[]>([
    { letter: "a", text: "", correct: false },
    { letter: "b", text: "", correct: false },
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [savedCount, setSavedCount] = useState(0);
  const [currentSetId, setCurrentSetId] = useState<string | undefined>(initialSetId);
  const [error, setError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const answerInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Populate form when editQuestion changes
  useEffect(() => {
    if (!editQuestion) return;
    setQuestionText(editQuestion.q);
    const populated = rowToAnswers(editQuestion);
    setAnswers(
      populated.length >= 2
        ? populated
        : [
            { letter: "a", text: "", correct: false },
            { letter: "b", text: "", correct: false },
          ],
    );
    setImagePreview(editQuestion.imageData ?? null);
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }, [editQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddAnswer = () => {
    if (answers.length >= 10) return;
    const nextLetter = LETTERS[answers.length];
    setAnswers((prev) => [...prev, { letter: nextLetter, text: "", correct: false }]);
    // Focus the newly added answer input on next render
    setTimeout(() => {
      answerInputRefs.current[answers.length]?.focus();
    }, 0);
  };

  const handleRemoveAnswer = (idx: number) => {
    if (answers.length <= 2) return;
    setAnswers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAnswerText = (idx: number, text: string) => {
    setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, text } : a)));
  };

  const handleAnswerCorrect = (idx: number, correct: boolean) => {
    setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, correct } : a)));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const preview = await readFileAsDataURL(file);
    setImagePreview(preview);
  };

  const handleSaveNext = async () => {
    setError(null);

    if (!questionText.trim()) {
      setError("Question text is required");
      return;
    }
    if (answers.length < 2) {
      setError("At least 2 answers are required");
      return;
    }
    if (!answers.some((a) => a.correct)) {
      setError("At least one correct answer is required");
      return;
    }
    if (answers.some((a) => !a.text.trim())) {
      setError("All answer texts must be filled in");
      return;
    }

    let setIdToUse = currentSetId;

    if (isNewSet && savedCount === 0) {
      const resolvedCategoryKey =
        categoryKey === "__new__" ? slugify(newCategoryName) : categoryKey;
      const newId = saveSet({
        name: setName,
        lang,
        categoryKey: resolvedCategoryKey,
      });
      setIdToUse = newId;
      setCurrentSetId(newId);
    }

    if (!setIdToUse) {
      setError("Set ID not found");
      return;
    }

    const correctLetters = answers
      .filter((a) => a.correct)
      .map((a) => a.letter)
      .join("");
    const rowData: Parameters<typeof saveQuestion>[1] = {
      q: questionText.trim(),
      v: correctLetters,
    };

    for (const ans of answers) {
      (rowData as Record<string, string>)[ans.letter] = ans.text.trim();
    }

    // Keep existing image if no new file was chosen
    if (imageFile && imagePreview) {
      rowData.imageData = imagePreview;
      const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      rowData.imageExt = ext;
    } else if (!imageFile && imagePreview && isEditing) {
      rowData.imageData = imagePreview;
      rowData.imageExt = editQuestion!.imageExt;
    }

    // Pass existing ID when editing so TinyBase overwrites the same row
    saveQuestion(setIdToUse, rowData, isEditing ? editQuestion!.id : undefined);

    if (isEditing) {
      // Notify parent the edit is done, then clear form
      onSaved?.();
    } else {
      setSavedCount((c) => c + 1);
      onQuestionSaved?.(questionText.trim(), setIdToUse);
    }

    // Reset question state
    setQuestionText("");
    setAnswers([
      { letter: "a", text: "", correct: false },
      { letter: "b", text: "", correct: false },
    ]);
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setTimeout(() => questionRef.current?.focus(), 0);
  };

  return (
    <div className="space-y-6">
      {isNewSet && (
        <Card>
          <CardHeader>
            <CardTitle>{t("custom.newSet")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("custom.setName")}</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t("custom.language")}</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="ro">Română</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="hu">Magyar</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t("custom.categoryTarget")}</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-background"
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value)}
              >
                {BUILT_IN_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k.toUpperCase()}
                  </option>
                ))}
                <option value="__new__">{t("custom.newCategory")}</option>
              </select>
            </div>

            {categoryKey === "__new__" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">{t("custom.categoryName")}</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm bg-background"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEditing ? t("custom.editQuestion") : t("custom.questionText")}</CardTitle>
            {!isEditing && savedCount > 0 && (
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {t("custom.questionsAdded", { count: savedCount })}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            ref={questionRef}
            className="w-full border rounded px-3 py-2 text-sm bg-background min-h-[80px] resize-none"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={t("custom.questionText")}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("custom.answers")}</p>
            {answers.map((ans, idx) => (
              <div key={ans.letter} className="flex items-center gap-2">
                <span className="bg-muted rounded font-mono text-xs px-1.5 py-0.5 shrink-0">
                  {ans.letter}
                </span>
                <input
                  type="text"
                  ref={(el) => {
                    answerInputRefs.current[idx] = el;
                  }}
                  className="flex-1 border rounded px-3 py-1.5 text-sm bg-background"
                  value={ans.text}
                  onChange={(e) => handleAnswerText(idx, e.target.value)}
                />
                <label className="flex items-center gap-1 text-sm shrink-0">
                  <input
                    type="checkbox"
                    checked={ans.correct}
                    onChange={(e) => handleAnswerCorrect(idx, e.target.checked)}
                  />
                  {t("custom.correctAnswer")}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={answers.length <= 2}
                  onClick={() => handleRemoveAnswer(idx)}
                  className="shrink-0 h-7 w-7 p-0"
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

          <div className="space-y-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
              {t("custom.addImage")}
            </Button>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded border object-contain"
              />
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleSaveNext} className="flex-1">
              {isEditing ? t("custom.updateQuestion") : t("custom.saveNext")}
            </Button>
            {isEditing ? (
              <Button variant="outline" onClick={() => onSaved?.()}>
                {t("common.cancel")}
              </Button>
            ) : (
              <Button variant="outline" onClick={onDone}>
                {t("custom.done")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
