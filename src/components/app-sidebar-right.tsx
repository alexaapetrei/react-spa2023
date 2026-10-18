import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Circle, RotateCcw, XCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  useSidebar,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { categoryStats, useProgress } from "@/lib/progress-store";
import { categoryLabel } from "@/lib/categories";
import { useCustomQuestions } from "@/lib/custom-questions-store";
import type { Catego } from "@/hooks/useCatego";

type QuizLoaderData = { questions: Catego; language: string };

type RouteParams = { categoria?: string; nr?: string };

/** Params of the deepest match — the shell renders outside the route components. */
const useLeafParams = (): RouteParams =>
  useRouterState({
    select: (state) => (state.matches[state.matches.length - 1]?.params ?? {}) as RouteParams,
  });

/**
 * Right rail: how you're doing, in the question you're actually looking at.
 *
 * Mounted only from question routes (the route tree marks them with
 * `staticData.questionContext`, which the shell reads), so "contextual" is
 * structural rather than a conditional inside a shared component.
 */
export function AppSidebarRight() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const progress = useProgress();
  const customQuestions = useCustomQuestions();
  const { setOpenMobile } = useSidebar();
  const [retakeInfoOpen, setRetakeInfoOpen] = useState(false);
  const { categoria = "", nr = "0" } = useLeafParams();

  // Total for this category, taken from whichever layout route already loaded it.
  const total = useRouterState({
    select: (state) => {
      const match = state.matches.find(
        (candidate) => (candidate.loaderData as QuizLoaderData | undefined)?.questions,
      );
      const questions = (match?.loaderData as QuizLoaderData | undefined)?.questions;
      if (!questions) return null;
      return (
        (questions[categoria]?.length ?? 0) +
        customQuestions.filter((question) => question.categoria === categoria).length
      );
    },
  });

  const stats = categoryStats(progress, categoria, total);
  const remaining = total != null ? Math.max(0, total - stats.answered) : null;

  return (
    <Sidebar side="right" collapsible="offcanvas">
      <SidebarHeader className="p-3">
        <p className="text-sm font-medium text-sidebar-foreground">
          {t("test.setQuestionPosition", {
            category: categoryLabel(categoria),
            question: Number(nr) + 1,
            total: total ?? "?",
          })}
        </p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="space-y-4">
            {/* Verdicts so far — the three numbers that answer "how am I doing?" */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle2 className="size-5 shrink-0 text-green-500" />
                <p className="text-xl font-bold leading-none text-green-500">{stats.correct}</p>
                <p className="ml-auto text-sm text-muted-foreground">{t("common.right")}</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <XCircle className="size-5 shrink-0 text-red-500" />
                <p className="text-xl font-bold leading-none text-red-500">{stats.wrong}</p>
                <p className="ml-auto text-sm text-muted-foreground">{t("common.wrong")}</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/40 p-3">
                <Circle className="size-5 shrink-0 text-muted-foreground" />
                <p className="text-xl font-bold leading-none text-muted-foreground">
                  {remaining ?? "?"}
                </p>
                <p className="ml-auto text-sm text-muted-foreground">{t("test.left")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {stats.answered}
                  {total != null && ` / ${total}`} {t("test.answered")}
                </span>
                <span className="font-semibold tabular-nums">{stats.coverage ?? 0}%</span>
              </div>
              <Progress value={stats.coverage ?? 0} className="h-2.5 rounded-full" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">{t("nav.accuracy")}</span>
              <span className="text-sm font-semibold tabular-nums">{stats.accuracy}%</span>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {stats.wrong > 0 && (
        <SidebarFooter className="p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              if (total == null || stats.answered < total) {
                setRetakeInfoOpen(true);
                return;
              }

              setOpenMobile(false);
              void navigate({
                to: "/retake/$categoria/$nr",
                params: { categoria, nr: "0" },
              });
            }}
          >
            <RotateCcw className="size-4" />
            {t("test.startRetest")}
          </Button>
        </SidebarFooter>
      )}

      <Dialog.Root open={retakeInfoOpen} onOpenChange={setRetakeInfoOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[51] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-3 rounded-lg border bg-background p-5 shadow-lg">
            <Dialog.Title className="font-semibold">{t("test.retakeNotReadyTitle")}</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {t("test.retakeNotReadyText")}
            </Dialog.Description>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setRetakeInfoOpen(false)}>
                {t("common.ok")}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Sidebar>
  );
}
