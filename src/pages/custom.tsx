import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Download, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { RowProps, useRow, useSliceRowIds } from "tinybase/ui-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { CustomImport } from "../components/custom-import";
import { langs } from "../i18n";
import {
  deleteSet,
  indexes,
  store,
  type SetRow,
  exportAllQuestionsAsJson,
  reinitializeCanonicalFromJson,
} from "../lib/customStore";
import { exportSetAsZip } from "../lib/customZip";
import { normalizeLegacyCustomCategoryKey } from "../lib/customCategory";
import * as Dialog from "@radix-ui/react-dialog";

type LangKey = keyof typeof langs;

const ALL_LANGS = Object.keys(langs) as LangKey[];

function SetCard({ rowId, onDelete }: { rowId: RowProps["rowId"]; onDelete: () => void }) {
  const { t, i18n } = useTranslation();
  const row = useRow("sets", rowId, store);
  const questionIds = useSliceRowIds("bySet", rowId, indexes);
  const questionCount = questionIds.length;
  const [isDeleting, setIsDeleting] = useState(false);

  if (!row) return null;

  const set = row as unknown as SetRow;
  const isCanonical = set.isCanonical === true || String(rowId).startsWith("canonical:");

  const createdAt = new Intl.DateTimeFormat(i18n.language, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(set.createdAt));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-[24px] font-medium leading-[1.15]">{set.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t("custom.setMeta", {
                count: questionCount,
                createdAt,
              })}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="border border-border px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {set.lang}
            </span>
            <span className="border border-border px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {normalizeLegacyCustomCategoryKey(set.categoryKey, set.name)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex flex-col items-start gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/custom/$setKey"
            params={{ setKey: set.urlKey ?? String(rowId) }}
            preload={false}
          >
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              {t("custom.editSet")}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => exportSetAsZip(rowId)}>
            <Download className="mr-2 h-4 w-4" />
            {t("custom.exportZip")}
          </Button>
        </div>

        {!isCanonical ? (
          <Dialog.Root open={isDeleting} onOpenChange={setIsDeleting}>
            <Dialog.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("custom.deleteSet")}
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="editorial-dialog-overlay" />
              <Dialog.Content className="editorial-dialog-content">
                <Card className="w-full max-w-sm">
                  <CardHeader>
                    <p className="editorial-kicker">{t("custom.deleteLabel")}</p>
                    <Dialog.Title className="text-[24px] font-medium leading-[1.2]">
                      {t("custom.deleteConfirmTitle")}
                    </Dialog.Title>
                    <Dialog.Description className="text-[13px] text-muted-foreground">
                      {t("custom.deleteConfirmText")}
                    </Dialog.Description>
                  </CardHeader>
                  <CardFooter className="justify-end gap-2">
                    <Dialog.Close asChild>
                      <Button variant="outline">{t("common.cancel")}</Button>
                    </Dialog.Close>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        onDelete();
                        setIsDeleting(false);
                      }}
                    >
                      {t("custom.deleteSet")}
                    </Button>
                  </CardFooter>
                </Card>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        ) : null}
      </CardFooter>
    </Card>
  );
}

export function CustomPage() {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<LangKey>(
    ALL_LANGS.includes(i18n.language as LangKey) ? (i18n.language as LangKey) : "ro",
  );
  const [showImport, setShowImport] = useState(false);
  const [isReinitializing, setIsReinitializing] = useState(false);
  const filteredSetIds = useSliceRowIds("setsByLang", selectedLang, indexes);

  const totalQuestions = filteredSetIds.reduce(
    (sum, setId) => sum + indexes.getSliceRowIds("bySet", setId).length,
    0,
  );

  const counts: Record<LangKey, number> = {
    ro: useSliceRowIds("setsByLang", "ro", indexes).length,
    en: useSliceRowIds("setsByLang", "en", indexes).length,
    de: useSliceRowIds("setsByLang", "de", indexes).length,
    hu: useSliceRowIds("setsByLang", "hu", indexes).length,
  };

  const handleDelete = (setId: string) => {
    deleteSet(setId);
  };

  const handleReinitializeCanonical = async () => {
    setIsReinitializing(true);
    try {
      await reinitializeCanonicalFromJson();
    } catch (error) {
      console.error("Failed to reinitialize canonical data", error);
    } finally {
      setIsReinitializing(false);
    }
  };

  if (showImport) {
    return <CustomImport onDone={() => setShowImport(false)} />;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <section className="overflow-hidden border border-border bg-card text-card-foreground">
        <div className="border-b border-white/10 bg-black px-5 py-6 text-white md:px-8 md:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="editorial-kicker text-white/60">{t("custom.kicker")}</p>
              <h1 className="max-w-2xl text-[26px] font-medium leading-[1.15] text-white md:text-[32px]">
                {t("custom.title")}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/70">{t("custom.description")}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void exportAllQuestionsAsJson(selectedLang).catch((error) => {
                    console.error("Failed to export all questions as JSON", error);
                  });
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("custom.exportAllJson", { lang: selectedLang.toUpperCase() })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void handleReinitializeCanonical();
                }}
                disabled={isReinitializing}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isReinitializing ? t("custom.reinitializing") : t("custom.reinitializeCanonical")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
                <Upload className="mr-2 h-4 w-4" />
                {t("custom.importAction")}
              </Button>
              <Link to="/custom/new" preload={false}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("custom.newSet")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-5 py-5 md:grid-cols-4 md:px-8 md:py-6">
          {ALL_LANGS.map((lang) => {
            const active = selectedLang === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLang(lang)}
                className={`border px-4 py-4 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-foreground hover:bg-accent dark:hover:border-white/60 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="editorial-kicker">{(lang as string).toUpperCase()}</p>
                    <p className="mt-2 text-[18px] font-medium text-foreground">{langs[lang]}</p>
                  </div>
                  <span className="border border-border px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {counts[lang]}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("custom.setsAvailable", { count: counts[lang] })}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="editorial-kicker">{t("custom.activeLanguageLabel")}</p>
            <h2 className="mt-2 text-[24px] font-medium leading-[1.15] text-foreground">
              {langs[selectedLang]}
            </h2>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <div>
              <span className="editorial-kicker block">{t("custom.setCountLabel")}</span>
              <span className="mt-1 block text-[18px] font-medium text-foreground">
                {filteredSetIds.length}
              </span>
            </div>
            <div>
              <span className="editorial-kicker block">{t("custom.questionCountLabel")}</span>
              <span className="mt-1 block text-[18px] font-medium text-foreground">
                {totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {filteredSetIds.length === 0 ? (
          <Card>
            <CardContent className="space-y-4 py-12 text-center">
              <p className="editorial-kicker">{(selectedLang as string).toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">{t("custom.noSetsForLanguage")}</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("custom.importAction")}
                </Button>
                <Link to="/custom/new" preload={false}>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("custom.newSet")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSetIds.map((setId) => (
              <SetCard key={setId} rowId={setId} onDelete={() => handleDelete(setId)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
