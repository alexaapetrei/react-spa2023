import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { saveSet, saveQuestion } from "../lib/customStore";
import type { QuestionRow } from "../lib/customStore";
import { parseCsv } from "../lib/parseCsv";
import { parseImportJson } from "../lib/parseImportJson";
import { importFromZip } from "../lib/customZip";

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

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Props = {
  onDone: () => void;
};

export function CustomImport({ onDone }: Props) {
  const { t } = useTranslation();

  const [lang, setLang] = useState("ro");
  const [setName, setSetName] = useState("");
  const [categoryKey, setCategoryKey] = useState("a");
  const [newCategoryName, setNewCategoryName] = useState("");

  const [parsedQuestions, setParsedQuestions] = useState<Partial<QuestionRow>[]>([]);
  const [imageMap, setImageMap] = useState<Map<number, File>>(new Map());
  const [isPreview, setIsPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuestionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuestionFile(file);
    setIsPreview(false);
    setParsedQuestions([]);
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const map = new Map<number, File>();
    for (const file of files) {
      const stem = file.name.replace(/\.[^.]+$/, "");
      const num = parseInt(stem, 10);
      if (!isNaN(num)) {
        map.set(num, file);
      }
    }
    setImageMap(map);
  };

  const handleParsePreview = async () => {
    setError(null);
    if (!questionFile) {
      setError("Please select a question file");
      return;
    }

    const ext = questionFile.name.split(".").pop()?.toLowerCase();

    // Handle ZIP files
    if (ext === "zip") {
      setIsPreview(true);
      setParsedQuestions([{ q: "(ZIP file — will import directly)" }]);
      return;
    }

    const text = await readFileAsText(questionFile);

    try {
      if (ext === "json") {
        const json = JSON.parse(text);
        const result = parseImportJson(json);
        setParsedQuestions(result.questions);
        if (result.suggestedCategoryKey && BUILT_IN_KEYS.includes(result.suggestedCategoryKey)) {
          setCategoryKey(result.suggestedCategoryKey);
        }
      } else if (ext === "csv") {
        const questions = parseCsv(text);
        setParsedQuestions(questions);
      } else {
        setError("Unsupported file type. Use .json, .csv, or .zip");
        return;
      }
    } catch (err) {
      setError(`Parse error: ${err instanceof Error ? err.message : "Unknown error"}`);
      return;
    }

    setIsPreview(true);
  };

  const handleImport = async () => {
    setError(null);
    if (!questionFile) return;
    if (!setName.trim()) {
      setError("Set name is required");
      return;
    }

    setImporting(true);
    try {
      const ext = questionFile.name.split(".").pop()?.toLowerCase();
      const resolvedCategoryKey =
        categoryKey === "__new__" ? slugify(newCategoryName) : categoryKey;

      if (ext === "zip") {
        await importFromZip(questionFile, lang, setName.trim(), resolvedCategoryKey);
      } else {
        const setId = saveSet({ name: setName.trim(), lang, categoryKey: resolvedCategoryKey });

        for (let idx = 0; idx < parsedQuestions.length; idx++) {
          const q = parsedQuestions[idx];
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

          // Check if there's a matching image (1-based)
          const imageFile = imageMap.get(idx + 1);
          if (imageFile) {
            const dataUrl = await readFileAsDataURL(imageFile);
            rowData.imageData = dataUrl;
            rowData.imageExt = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
          }

          saveQuestion(setId, rowData);
        }
      }

      onDone();
    } catch (err) {
      setError(`Import error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setImporting(false);
    }
  };

  const previewRows = parsedQuestions.slice(0, 10);
  const extraCount = parsedQuestions.length - 10;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t("custom.importFile")}</CardTitle>
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

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("custom.importFile")}</label>
            <input
              type="file"
              accept=".json,.csv,.zip"
              className="w-full text-sm"
              onChange={handleQuestionFileChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">{t("custom.imageFiles")}</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="w-full text-sm"
              onChange={handleImageFilesChange}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={handleParsePreview} disabled={!questionFile}>
            {t("custom.importPreview", { count: parsedQuestions.length })}
          </Button>
        </CardContent>
      </Card>

      {isPreview && parsedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("custom.importPreview", { count: parsedQuestions.length })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-3 w-8">#</th>
                    <th className="text-left py-1 pr-3">{t("custom.questionText")}</th>
                    <th className="text-left py-1 pr-3">{t("custom.answers")}</th>
                    <th className="text-left py-1 pr-3">{t("custom.correctAnswer")}</th>
                    <th className="text-left py-1">Img</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((q, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-1 pr-3 text-muted-foreground">{idx + 1}</td>
                      <td className="py-1 pr-3 max-w-[200px] truncate">{q.q}</td>
                      <td className="py-1 pr-3 text-muted-foreground">
                        {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
                          .filter((k) => (q as Record<string, string>)[k])
                          .join(", ")}
                      </td>
                      <td className="py-1 pr-3">{q.v}</td>
                      <td className="py-1">{imageMap.has(idx + 1) ? "✓" : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {extraCount > 0 && (
              <p className="text-sm text-muted-foreground">and {extraCount} more…</p>
            )}

            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={importing}>
                {importing
                  ? "Importing…"
                  : t("custom.importConfirm", { count: parsedQuestions.length })}
              </Button>
              <Button variant="outline" onClick={onDone}>
                {t("custom.done")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
