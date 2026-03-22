import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, Upload, Pencil, Download, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { CustomImport } from "../components/custom-import";
import { getSetsForLang, getQuestionsForSet, deleteSet } from "../lib/customStore";
import { exportSetAsZip } from "../lib/customZip";
import type { SetRow } from "../lib/customStore";

type SetItem = { id: string } & SetRow;

export function CustomPage() {
  const { t, i18n } = useTranslation();
  const [sets, setSets] = useState<SetItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const lang = i18n.language;
  const refresh = () => setSets(getSetsForLang(lang));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handleDelete = (setId: string) => {
    deleteSet(setId);
    setDeleteTarget(null);
    refresh();
  };

  if (showImport) {
    return (
      <CustomImport
        onDone={() => {
          setShowImport(false);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("custom.title")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Link to={"/custom/new" as any}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t("custom.newSet")}
            </Button>
          </Link>
        </div>
      </div>

      {sets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t("custom.noSets")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sets.map((set) => {
            const questionCount = getQuestionsForSet(set.id).length;
            return (
              <Card key={set.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{set.name}</CardTitle>
                    <div className="flex gap-1 shrink-0">
                      <span className="text-xs border rounded px-1.5 py-0.5 uppercase font-mono">
                        {set.lang}
                      </span>
                      <span className="text-xs border rounded px-1.5 py-0.5 font-mono">
                        {set.categoryKey}
                      </span>
                    </div>
                  </div>
                  <CardDescription>
                    {questionCount} {questionCount === 1 ? "question" : "questions"}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="gap-2">
                  <Link {...({ to: "/custom/$setId", params: { setId: set.id } } as any)}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => exportSetAsZip(set.id)}>
                    <Download className="h-4 w-4 mr-1" />
                    {t("custom.exportZip")}
                  </Button>

                  <Dialog.Root
                    open={deleteTarget === set.id}
                    onOpenChange={(open) => {
                      if (!open) setDeleteTarget(null);
                    }}
                  >
                    <Dialog.Trigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(set.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t("custom.deleteSet")}
                      </Button>
                    </Dialog.Trigger>

                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150" />
                      <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150">
                        <Card className="w-full max-w-sm">
                          <CardHeader>
                            <Dialog.Title className="font-semibold text-lg">
                              {t("custom.deleteConfirmTitle")}
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-muted-foreground">
                              {t("custom.deleteConfirmText")}
                            </Dialog.Description>
                          </CardHeader>
                          <CardFooter className="justify-end gap-2">
                            <Dialog.Close asChild>
                              <Button variant="outline">{t("common.cancel")}</Button>
                            </Dialog.Close>
                            <Button variant="destructive" onClick={() => handleDelete(set.id)}>
                              {t("custom.deleteSet")}
                            </Button>
                          </CardFooter>
                        </Card>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
