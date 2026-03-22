import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import confetti from "canvas-confetti";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Progress } from "./ui/progress";
import { RotateCcw } from "lucide-react";

type FinishedCardProps = { correct?: number; total?: number; categoria?: string };

export function FinishedCard({ correct, total, categoria }: FinishedCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const firedRef = useRef(false);
  const [resetOpen, setResetOpen] = useState(false);
  const showStats = correct !== undefined && total !== undefined && total > 0;
  const score = showStats ? Math.round((correct / total) * 100) : 100;

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const end = Date.now() + 2000;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  }, []);

  const handleResetCategory = () => {
    if (!categoria) return;
    const raw = localStorage.getItem("state");
    if (raw) {
      const state = JSON.parse(raw);
      state.corecte = state.corecte.filter((q: string) => !q.startsWith(categoria));
      state.gresite = state.gresite.filter((q: string) => !q.startsWith(categoria));
      localStorage.setItem("state", JSON.stringify(state));
    }
    navigate({ to: `/categoria/${categoria}/0` as any, viewTransition: true });
  };

  return (
    <div className="animate-in fade-in zoom-in duration-500">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t("test.finished")}</CardTitle>
          <CardDescription>{t("test.congrats")}</CardDescription>
        </CardHeader>
        {showStats && (
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-green-600">
                ✓ {correct} {t("common.right")}
              </span>
              <span className="text-muted-foreground">✗ 0 {t("common.wrong")}</span>
            </div>
            <Progress value={score} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {t("test.scoreOf", { score, answered: total, total })}
            </p>
          </CardContent>
        )}
        <CardFooter className="flex justify-center gap-2">
          <Link to="/" preload={false} viewTransition>
            <Button variant="outline">{t("common.home")}</Button>
          </Link>
          {categoria && (
            <Dialog.Root open={resetOpen} onOpenChange={setResetOpen}>
              <Dialog.Trigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  {t("common.resetCategory")}
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150" />
                <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150">
                  <Card className="w-full max-w-sm">
                    <CardHeader>
                      <Dialog.Title className="font-semibold text-lg">
                        {t("common.resetCategoryConfirmTitle")}
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-muted-foreground">
                        {t("common.resetCategoryConfirmText")}
                      </Dialog.Description>
                    </CardHeader>
                    <CardFooter className="justify-end gap-2">
                      <Dialog.Close asChild>
                        <Button variant="outline">{t("common.cancel")}</Button>
                      </Dialog.Close>
                      <Button variant="destructive" onClick={handleResetCategory}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t("common.resetCategory")}
                      </Button>
                    </CardFooter>
                  </Card>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
