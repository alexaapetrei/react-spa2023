import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { saveSet, saveQuestion, getCategoryKeysForLang } from "../lib/customStore";
import type { QuestionRow } from "../lib/customStore";
import { parseImportJson } from "../lib/parseImportJson";
import { importFromZip, previewZip } from "../lib/customZip";
import { hasCustomCategoryKeyCollision, slugifyCustomCategoryName } from "../lib/customCategory";

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

type Props = {
  onDone: () => void;
};

export function CustomImport({ onDone }: Props) {
  const { t, i18n } = useTranslation();

  const [setName, setSetName] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<Partial<QuestionRow>[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [zipPreview, setZipPreview] = useState<{
    count: number;
    questions: Array<{ q: string; v: string }>;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collisionError, setCollisionError] = useState(false);

  const handleCheckCollision = (name: string, langCode: string): boolean => {
    if (!name.trim()) return false;
    const categoryKey = slugifyCustomCategoryName(name);
    const existingKeys = getCategoryKeysForLang(langCode);
    return hasCustomCategoryKeyCollision(existingKeys, categoryKey);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQuestionFile(file);
    setParsedQuestions([]);
    setZipPreview(null);
    setError(null);
    setSetName("");

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "zip") {
      try {
        const preview = await previewZip(file);
        setZipPreview({ count: preview.count, questions: preview.questions });
        setSetName(preview.setName || file.name.replace(/\.[^.]+$/, ""));
      } catch (err) {
        setError(`Preview error: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
      return;
    }

    if (ext === "json") {
      try {
        const text = await readFileAsText(file);
        const json = JSON.parse(text);
        const result = parseImportJson(json);
        setParsedQuestions(result.questions);
        setSetName(result.suggestedSetName || file.name.replace(/\.[^.]+$/, ""));
      } catch (err) {
        setError(`Parse error: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  };

  const handleImport = async () => {
    setError(null);
    setCollisionError(false);
    if (!questionFile) return;

    const ext = questionFile.name.split(".").pop()?.toLowerCase();
    const lang = i18n.language || "ro";
    const name = setName.trim() || questionFile.name.replace(/\.[^.]+$/, "");

    if (ext !== "zip") {
      if (!name) {
        setError("Set name is required");
        return;
      }
      if (handleCheckCollision(name, lang)) {
        setCollisionError(true);
        setError("A set with this name already exists in this language");
        return;
      }
    }

    setImporting(true);
    try {
      const categoryKey = slugifyCustomCategoryName(name);

      if (ext === "zip") {
        await importFromZip(questionFile, lang, name, categoryKey);
      } else {
        const setId = saveSet({ name, lang, categoryKey });

        for (const q of parsedQuestions) {
          if (!q.q || !q.v) continue;

          const rowData: Parameters<typeof saveQuestion>[1] = {
            q: q.q,
            v: q.v,
          };

          const answerKeys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
          for (const key of answerKeys) {
            if (q[key]) {
              (rowData as Record<string, string>)[key] = q[key] as string;
            }
          }

          saveQuestion(setId, rowData);
        }
      }

      setQuestionFile(null);
      setParsedQuestions([]);
      setIsPreview(false);
      onDone();
    } catch (err) {
      setError(`Import error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-white/10 bg-black text-white">
          <p className="editorial-kicker text-white/60">{t("custom.importAction")}</p>
          <CardTitle className="text-white">{t("custom.importFile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPreview ? (
            <>
              <div className="space-y-1">
                <label className="editorial-label">{t("custom.importFile")}</label>
                <input
                  type="file"
                  accept=".json,.zip"
                  className="editorial-file"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-1">
                <label className="editorial-label">{t("custom.setName")}</label>
                <input
                  type="text"
                  className="editorial-input"
                  value={setName}
                  onChange={(e) => {
                    setCollisionError(false);
                    setSetName(e.target.value);
                  }}
                  placeholder={questionFile ? undefined : t("custom.importFile")}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <Button onClick={() => setIsPreview(true)} disabled={!questionFile || !!error}>
                  {t("custom.importPreview", {
                    count: zipPreview?.count ?? parsedQuestions.length,
                  })}
                </Button>
                <Button variant="outline" onClick={onDone}>
                  {t("common.cancel")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="editorial-label">{t("custom.setName")}</label>
                <input
                  type="text"
                  className="editorial-input"
                  value={setName}
                  onChange={(e) => {
                    setCollisionError(false);
                    setSetName(e.target.value);
                  }}
                />
              </div>

              {collisionError && (
                <p className="text-sm text-red-600">{t("custom.categoryExists")}</p>
              )}

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-sm border border-border p-2">
                <p className="editorial-label mb-2">
                  {t("custom.importPreview", {
                    count: zipPreview?.count ?? parsedQuestions.length,
                  })}
                </p>
                {(zipPreview?.questions ?? parsedQuestions).slice(0, 20).map((q, idx) => (
                  <div key={idx} className="border-b border-border pb-2 last:border-0">
                    <p className="text-sm font-medium">
                      {idx + 1}. {q.q}
                    </p>
                    <p className="text-xs text-muted-foreground">{q.v}</p>
                  </div>
                ))}
                {(zipPreview?.count ?? parsedQuestions.length) > 20 && (
                  <p className="text-xs text-muted-foreground">
                    {t("custom.moreQuestions", {
                      count: (zipPreview?.count ?? parsedQuestions.length) - 20,
                    })}
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={importing || (!zipPreview && parsedQuestions.length === 0)}
                >
                  {t("custom.importConfirm", {
                    count: zipPreview?.count ?? parsedQuestions.length,
                  })}
                </Button>
                <Button variant="outline" onClick={() => setIsPreview(false)} disabled={importing}>
                  {t("common.back")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
