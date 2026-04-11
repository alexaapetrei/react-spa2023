import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import confetti from "canvas-confetti";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Progress } from "./ui/progress";
import { RotateCcw } from "lucide-react";
import { isQuestionIdForCategory } from "../lib/categoryProgress";

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
        colors: ["#da291c", "#b01e0a", "#fff200", "#f6e500", "#303030"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#da291c", "#b01e0a", "#fff200", "#f6e500", "#303030"],
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
      state.corecte = state.corecte.filter((q: string) => !isQuestionIdForCategory(q, categoria));
      state.gresite = state.gresite.filter((q: string) => !isQuestionIdForCategory(q, categoria));
      localStorage.setItem("state", JSON.stringify(state));
    }
    navigate({ to: `/categoria/${categoria}/0` as any, viewTransition: true });
  };

  return (
    <div className="animate-in fade-in zoom-in duration-500">
      <Card className="mx-auto max-w-md overflow-hidden">
        <CardHeader className="border-b border-white/10 bg-black text-white">
          <p className="editorial-kicker text-white/60">{t("common.sessionComplete")}</p>
          <CardTitle className="text-white">{t("test.finished")}</CardTitle>
          <CardDescription className="text-white/70">{t("test.congrats")}</CardDescription>
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
            <p className="text-center text-xs text-muted-foreground">
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
                <Dialog.Overlay className="editorial-dialog-overlay" />
                <Dialog.Content className="editorial-dialog-content px-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <p className="editorial-kicker">{t("common.categoryReset")}</p>
                      <Dialog.Title className="text-[24px] font-medium leading-[1.2]">
                        {t("common.resetCategoryConfirmTitle")}
                      </Dialog.Title>
                      <Dialog.Description className="text-[13px] text-muted-foreground">
                        {t("common.resetCategoryConfirmText")}
                      </Dialog.Description>
                    </CardHeader>
                    <CardFooter className="flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-end">
                      <Dialog.Close asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                          {t("common.cancel")}
                        </Button>
                      </Dialog.Close>
                      <Button
                        variant="destructive"
                        className="w-full sm:w-auto"
                        onClick={handleResetCategory}
                      >
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
