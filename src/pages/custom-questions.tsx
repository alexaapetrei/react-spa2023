import { useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Check, Download, FolderUp, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_IDS, categoryLabel } from "@/lib/categories";
import {
  addCustomQuestion,
  addCustomQuestions,
  CONTENT_LANGUAGES,
  correctAnswerKeys,
  removeCustomQuestion,
  updateCustomQuestion,
  useCustomQuestions,
  type ContentLanguage,
  type CustomQuestion,
  type LocalizedContent,
  type NewCustomQuestion,
} from "@/lib/custom-questions-store";

const MAX_ANSWERS = 20;
const MAX_IMAGE_DIMENSION = 1600;
const keyAt = (index: number) => String.fromCharCode(97 + index);
const emptyContent = (): LocalizedContent => ({ text: {} });
const emptyForm = () => ({
  categoria: CATEGORY_IDS[0] ?? "a",
  q: emptyContent(),
  qImage: "",
  answers: [
    { ...emptyContent(), image: "" } as LocalizedContent,
    { ...emptyContent(), image: "" } as LocalizedContent,
  ],
  correct: [] as string[],
});
const languageNames: Record<ContentLanguage, string> = {
  ro: "Română",
  en: "English",
  de: "Deutsch",
  hu: "Magyar",
};

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function optimizeImage(file: File): Promise<string> {
  if (typeof createImageBitmap !== "function") return readAsDataUrl(file);
  // Preserve animated images and vectors; raster conversion would flatten or rasterize them.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return readAsDataUrl(file);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return readAsDataUrl(file);
  }
  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1_500_000) return readAsDataUrl(file);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return readAsDataUrl(file);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const optimized = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    return readAsDataUrl(optimized ?? file);
  } finally {
    bitmap.close();
  }
}

async function readImage(
  event: ChangeEvent<HTMLInputElement>,
  setImage: (value: string) => void,
  setError: (value: boolean) => void,
): Promise<void> {
  const file = event.target.files?.[0];
  if (!file) return;
  setError(false);
  if (!file.type.startsWith("image/")) {
    setError(true);
    event.target.value = "";
    return;
  }
  event.target.value = "";
  try {
    setImage(await optimizeImage(file));
  } catch {
    setError(true);
  }
}

function ImageField({
  image,
  onChange,
  label,
  errorLabel,
  processingLabel,
  removeImageLabel,
}: {
  image?: string;
  onChange: (value: string) => void;
  label: string;
  errorLabel: string;
  processingLabel: string;
  removeImageLabel: string;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring/50">
          <ImagePlus className="size-4" />
          {label}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              setProcessing(true);
              void readImage(event, onChange, setError).finally(() => setProcessing(false));
            }}
          />
        </label>
        {image && (
          <>
            <img
              src={image}
              alt=""
              className="h-12 max-w-24 rounded border border-border bg-muted/40 object-contain"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={removeImageLabel}
              title={removeImageLabel}
              onClick={() => onChange("")}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>
      {processing && <p className="text-xs text-muted-foreground">{processingLabel}</p>}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {errorLabel}
        </p>
      )}
    </div>
  );
}

export function CustomQuestions() {
  const { t } = useTranslation();
  const questions = useCustomQuestions();
  const [form, setForm] = useState(emptyForm);
  const [lang, setLang] = useState<ContentLanguage>("ro");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const importInput = useRef<HTMLInputElement>(null);

  const setQuestionText = (value: string) =>
    setForm((current) => ({
      ...current,
      q: { ...current.q, text: { ...current.q.text, [lang]: value } },
    }));
  const setAnswerText = (index: number, value: string) =>
    setForm((current) => ({
      ...current,
      answers: current.answers.map((answer, i) =>
        i === index ? { ...answer, text: { ...answer.text, [lang]: value } } : answer,
      ),
    }));
  const updateAnswerImage = (index: number, value: string) =>
    setForm((current) => ({
      ...current,
      answers: current.answers.map((answer, i) =>
        i === index ? { ...answer, image: value } : answer,
      ),
    }));
  const toggleCorrect = (key: string) =>
    setForm((current) => ({
      ...current,
      correct: current.correct.includes(key)
        ? current.correct.filter((item) => item !== key)
        : [...current.correct, key],
    }));

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const populated = form.answers
      .map((answer, index) => ({ answer, key: keyAt(index) }))
      .filter(
        ({ answer }) => CONTENT_LANGUAGES.some((code) => answer.text[code]?.trim()) || answer.image,
      );
    if (
      !form.categoria ||
      (!CONTENT_LANGUAGES.some((code) => form.q.text[code]?.trim()) && !form.qImage)
    ) {
      setError(t("custom.errors.question"));
      return;
    }
    if (populated.length < 2 || populated.length > MAX_ANSWERS) {
      setError(t("custom.errors.answers"));
      return;
    }
    const correct = form.correct.filter((key) => populated.some((item) => item.key === key));
    if (!correct.length) {
      setError(t("custom.errors.correct"));
      return;
    }
    const ans = Object.fromEntries(populated.map(({ answer, key }) => [key, answer]));
    const input = {
      categoria: form.categoria,
      q: { ...form.q, image: form.qImage || undefined },
      ans,
      correct,
    };
    try {
      if (editingId) updateCustomQuestion(editingId, input);
      else addCustomQuestion(input);
    } catch {
      setError(t("custom.errors.storage"));
      return;
    }
    setForm(emptyForm());
    setEditingId(null);
    setError("");
    setSavedId(Date.now().toString());
  };

  const editQuestion = (question: CustomQuestion) => {
    setEditingId(question.id);
    setForm({
      categoria: question.categoria,
      q: { text: question.q.text },
      qImage: question.q.image ?? "",
      answers: Object.entries(question.ans).map(([, answer]) => ({
        text: { ...answer.text },
        image: answer.image,
      })),
      correct: correctAnswerKeys(question.v),
    });
    setError("");
    setImportMessage("");
    setSavedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setForm(emptyForm());
    setEditingId(null);
    setError("");
  };

  const exportSet = async () => {
    const images: Record<string, Uint8Array> = {};
    const exported = questions.map((question, questionIndex) => {
      const q = exportContent(question.q, `images/question-${questionIndex + 1}`, images);
      const ans = Object.fromEntries(
        Object.entries(question.ans).map(([key, value]) => [
          key,
          exportContent(value, `images/question-${questionIndex + 1}-answer-${key}`, images),
        ]),
      );
      return { ...question, q, ans };
    });
    const archive = zipSync({
      "set.json": strToU8(
        JSON.stringify(
          { format: "first-principles-question-set", version: 1, questions: exported },
          null,
          2,
        ),
      ),
      ...images,
    });
    const url = URL.createObjectURL(new Blob([archive], { type: "application/zip" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "question-set.zip";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const importSet = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setImportMessage("");
    try {
      const imported = parseQuestionSet(new Uint8Array(await file.arrayBuffer()));
      addCustomQuestions(imported);
      setImportMessage(t("custom.imported", { count: imported.length }));
    } catch {
      setError(t("custom.importError"));
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("custom.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("custom.subtitle")}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <input
            ref={importInput}
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            onChange={importSet}
          />
          <Button
            type="button"
            variant="outline"
            className="min-w-0 flex-1 sm:flex-none"
            onClick={() => importInput.current?.click()}
          >
            <FolderUp />
            <span className="truncate">{t("custom.import")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-w-0 flex-1 sm:flex-none"
            onClick={exportSet}
            disabled={!questions.length}
          >
            <Download />
            <span className="truncate">{t("custom.export")}</span>
          </Button>
        </div>
      </header>
      <p className="-mt-4 text-xs text-muted-foreground">{t("custom.exportHint")}</p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? t("custom.editQuestion") : t("custom.newQuestion")}
            </CardTitle>
            <CardDescription>{t("custom.newQuestionHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label>{t("custom.category")}</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, categoria: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_IDS.map((id) => (
                      <SelectItem key={id} value={id}>
                        {categoryLabel(id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("custom.question")}</Label>
                <LanguageTabs lang={lang} setLang={setLang} />
                <Textarea
                  value={form.q.text[lang] ?? ""}
                  onChange={(event) => setQuestionText(event.target.value)}
                  placeholder={t("custom.questionPlaceholder")}
                  rows={3}
                />
                <ImageField
                  image={form.qImage}
                  label={t("custom.addImage")}
                  errorLabel={t("custom.errors.image")}
                  processingLabel={t("custom.processingImage")}
                  removeImageLabel={t("custom.removeImage")}
                  onChange={(qImage) => setForm((current) => ({ ...current, qImage }))}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("custom.answers")}</Label>
                  <span className="text-xs text-muted-foreground">
                    {form.answers.length}/{MAX_ANSWERS}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t("custom.answersHint")}</p>
                <LanguageTabs lang={lang} setLang={setLang} />
                <div className="space-y-3">
                  {form.answers.map((answer, index) => {
                    const key = keyAt(index);
                    return (
                      <div
                        key={key}
                        className="space-y-2 rounded-lg border border-border p-3 dark:bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 shrink-0 text-sm font-bold uppercase">{key}.</span>
                          <Input
                            value={answer.text[lang] ?? ""}
                            onChange={(event) => setAnswerText(index, event.target.value)}
                            placeholder={t("custom.answerPlaceholder", {
                              letter: key.toUpperCase(),
                            })}
                          />
                          <Button
                            type="button"
                            variant={form.correct.includes(key) ? "default" : "outline"}
                            size="icon"
                            aria-pressed={form.correct.includes(key)}
                            aria-label={t("custom.markCorrect")}
                            onClick={() => toggleCorrect(key)}
                          >
                            <Check />
                          </Button>
                          {form.answers.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("custom.removeAnswer")}
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  answers: current.answers.filter((_, i) => i !== index),
                                  correct: current.correct
                                    .filter((correctKey) => correctKey !== key)
                                    .map((correctKey) =>
                                      String.fromCharCode(
                                        correctKey.charCodeAt(0) > key.charCodeAt(0)
                                          ? correctKey.charCodeAt(0) - 1
                                          : correctKey.charCodeAt(0),
                                      ),
                                    ),
                                }))
                              }
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                        <ImageField
                          image={answer.image}
                          label={t("custom.addImage")}
                          errorLabel={t("custom.errors.image")}
                          processingLabel={t("custom.processingImage")}
                          removeImageLabel={t("custom.removeImage")}
                          onChange={(value) => updateAnswerImage(index, value)}
                        />
                      </div>
                    );
                  })}
                </div>
                {form.answers.length < MAX_ANSWERS && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        answers: [...current.answers, { ...emptyContent() }],
                      }))
                    }
                  >
                    <Plus />
                    {t("custom.addAnswer")}
                  </Button>
                )}
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              {importMessage && (
                <p className="text-sm text-green-600" role="status">
                  {importMessage}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit">
                  {editingId ? <Check /> : <Plus />}
                  {editingId ? t("custom.update") : t("custom.save")}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X />
                    {t("custom.cancelEdit")}
                  </Button>
                )}
                {savedId && <span className="text-xs text-green-600">{t("custom.saved")}</span>}
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {t("custom.savedTitle")}
              <Badge variant="secondary">{questions.length}</Badge>
            </CardTitle>
            <CardDescription>{t("custom.savedHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!questions.length ? (
              <p className="text-sm text-muted-foreground">{t("custom.empty")}</p>
            ) : (
              questions
                .slice()
                .reverse()
                .map((question, index) => (
                  <div key={question.id}>
                    {index > 0 && <Separator className="mb-3" />}
                    <SavedQuestion
                      question={question}
                      onEdit={() => editQuestion(question)}
                      onDelete={() => {
                        removeCustomQuestion(question.id);
                        if (editingId === question.id) cancelEdit();
                      }}
                    />
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LanguageTabs({
  lang,
  setLang,
}: {
  lang: ContentLanguage;
  setLang: (lang: ContentLanguage) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Content language">
      {CONTENT_LANGUAGES.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={code === lang ? "secondary" : "ghost"}
          role="tab"
          aria-selected={code === lang}
          onClick={() => setLang(code)}
        >
          {languageNames[code]}
        </Button>
      ))}
    </div>
  );
}

function exportContent(
  content: LocalizedContent,
  path: string,
  images: Record<string, Uint8Array>,
) {
  const result: { text: LocalizedContent["text"]; image?: string } = { text: content.text };
  if (content.image) {
    const [meta, data] = content.image.split(",");
    const mime = /^data:(image\/[^;,]+)/.exec(meta)?.[1] ?? "image/jpeg";
    const extension =
      (
        {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
          "image/svg+xml": "svg",
          "image/avif": "avif",
        } as Record<string, string>
      )[mime] ?? "jpg";
    const filename = `${path}.${extension}`;
    images[filename] = Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
    result.image = filename;
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function imageDataUrl(path: unknown, files: Record<string, Uint8Array>): string | undefined {
  if (path === undefined) return undefined;
  if (
    typeof path !== "string" ||
    !path.startsWith("images/") ||
    path.includes("..") ||
    path.includes("\\")
  ) {
    throw new Error("Invalid image path");
  }
  const bytes = files[path];
  if (!bytes) throw new Error("Missing image file");
  const extension = path.split(".").pop()?.toLowerCase();
  const mime = (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
      avif: "image/avif",
    } as Record<string, string>
  )[extension ?? ""];
  if (!mime) throw new Error("Unsupported image format");
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)),
    );
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function parseLocalizedContent(
  value: unknown,
  files: Record<string, Uint8Array>,
): LocalizedContent {
  if (!isRecord(value) || !isRecord(value.text)) throw new Error("Invalid content");
  const text: Partial<Record<ContentLanguage, string>> = {};
  for (const [language, translation] of Object.entries(value.text)) {
    if (
      !(CONTENT_LANGUAGES as readonly string[]).includes(language) ||
      typeof translation !== "string"
    ) {
      throw new Error("Invalid translation");
    }
    text[language as ContentLanguage] = translation;
  }
  const image = imageDataUrl(value.image, files);
  if (!image && !Object.values(text).some((translation) => translation.trim()))
    throw new Error("Empty content");
  return { text, image };
}

function parseQuestionSet(bytes: Uint8Array): NewCustomQuestion[] {
  if (bytes.length > 100 * 1024 * 1024) throw new Error("Question set is too large");
  const files = unzipSync(bytes);
  const setFile = files["set.json"];
  if (!setFile) throw new Error("Missing set.json");
  const document: unknown = JSON.parse(strFromU8(setFile));
  if (
    !isRecord(document) ||
    document.format !== "first-principles-question-set" ||
    document.version !== 1 ||
    !Array.isArray(document.questions) ||
    document.questions.length === 0
  ) {
    throw new Error("Unsupported question set");
  }
  return document.questions.map((value): NewCustomQuestion => {
    if (
      !isRecord(value) ||
      typeof value.categoria !== "string" ||
      !CATEGORY_IDS.includes(value.categoria)
    )
      throw new Error("Invalid category");
    if (!isRecord(value.ans) || typeof value.v !== "string") throw new Error("Invalid answers");
    const answerEntries = Object.entries(value.ans);
    if (
      answerEntries.length < 2 ||
      answerEntries.length > MAX_ANSWERS ||
      answerEntries.some(([key]) => !/^[a-t]$/.test(key))
    ) {
      throw new Error("Invalid answer count");
    }
    const correct = correctAnswerKeys(value.v);
    if (
      !correct.length ||
      new Set(correct).size !== correct.length ||
      correct.some((key) => !Object.prototype.hasOwnProperty.call(value.ans, key))
    )
      throw new Error("Invalid correct answers");
    const q = parseLocalizedContent(value.q, files);
    const ans = Object.fromEntries(
      answerEntries.map(([key, content]) => [key, parseLocalizedContent(content, files)]),
    );
    return { categoria: value.categoria, q, ans, correct };
  });
}

function SavedQuestion({
  question,
  onEdit,
  onDelete,
}: {
  question: CustomQuestion;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const language = (
    CONTENT_LANGUAGES.includes(i18n.resolvedLanguage as ContentLanguage)
      ? i18n.resolvedLanguage
      : "ro"
  ) as ContentLanguage;
  const text =
    question.q.text[language] || question.q.text.ro || Object.values(question.q.text)[0] || "";
  const correct = new Set(correctAnswerKeys(question.v));
  return (
    <article className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className="shrink-0">
          {categoryLabel(question.categoria)}
        </Badge>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={t("custom.editQuestion")}
            title={t("custom.editQuestion")}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label={t("custom.delete")}
            title={t("custom.delete")}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <p className="text-sm font-medium leading-snug">{text}</p>
      {question.q.image && (
        <img
          src={question.q.image}
          alt=""
          className="max-h-28 rounded border border-border bg-muted/40 object-contain"
        />
      )}
      <ul className="space-y-2">
        {Object.entries(question.ans).map(([key, content]) => (
          <li key={key} className="flex items-start gap-2 text-xs">
            <span
              className={`font-bold uppercase ${correct.has(key) ? "text-green-600" : "text-muted-foreground"}`}
            >
              {key}.
            </span>
            <span>
              {content.text[language] || content.text.ro || Object.values(content.text)[0] || ""}
              {content.image && (
                <img src={content.image} alt="" className="mt-1 max-h-16 rounded object-contain" />
              )}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
