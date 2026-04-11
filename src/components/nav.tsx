import { Outlet, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { langs } from "../i18n";
import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Social } from "./social";
import {
  Moon,
  Sun,
  Menu,
  Home as HomeIcon,
  BarChart2,
  CheckCircle2,
  XCircle,
  X,
  Circle,
  HardDrive,
  Loader2,
  Download,
  Share,
  BookPlus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTheme } from "./ui/use-theme";
import { HomeActions } from "./home-actions";
import { Progress } from "./ui/progress";
import { Card, CardContent } from "./ui/card";
import { isQuestionIdForCategory } from "../lib/categoryProgress";
import { redoCustomStoreChange, undoCustomStoreChange } from "../lib/customStore";

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

export function NavLayout() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const routerState = useRouterState();
  const { theme, setTheme } = useTheme();
  const [offlineReady, setOfflineReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<
    (Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }) | null
  >(null);
  const [installed, setInstalled] = useState(false);

  // iOS: no beforeinstallprompt — detect and show "Share → Add to Home Screen" hint
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  const pathname = routerState.location.pathname;

  // Detect quiz routes: /categoria/<cat>/<nr>  or  /retake/<cat>/<nr>
  const quizMatch = pathname.match(/^\/(categoria|retake)\/([^/]+)\/(\d+)/);
  const isQuizRoute = !!quizMatch;
  const quizCategoria = quizMatch?.[2]?.toUpperCase() ?? "";
  const quizCategoriaKey = quizMatch?.[2] ?? "";
  const quizNr = quizMatch ? Number(quizMatch[3]) : 0;
  const isRetake = quizMatch?.[1] === "retake";

  // "dan" is a special category with Romanian-only questions
  const isDanRoute = pathname.includes("/categoria/dan/");
  const availableLangs = isDanRoute ? { ro: langs.ro } : langs;

  // Total questions for this category — pulled from whichever layout route already loaded them
  const categoryTotal = (() => {
    if (!isQuizRoute || !quizCategoriaKey) return null;
    const match = routerState.matches.find((m) => (m.loaderData as any)?.questions != null);
    const questions = (match?.loaderData as any)?.questions;
    return questions?.[quizCategoriaKey]?.length ?? null;
  })();

  // Progress stats for the dialog — read live from localStorage.
  // Deduplicate so multiple retake attempts for the same question count once.
  const progressStats = (() => {
    if (!isQuizRoute || !quizCategoriaKey) return null;
    const raw = localStorage.getItem("state");
    const state = raw ? JSON.parse(raw) : { corecte: [], gresite: [] };
    const correct = new Set(
      (state.corecte as string[]).filter((q) => isQuestionIdForCategory(q, quizCategoriaKey)),
    ).size;
    const wrong = new Set(
      (state.gresite as string[]).filter((q) => isQuestionIdForCategory(q, quizCategoriaKey)),
    ).size;
    const answered = new Set([
      ...(state.corecte as string[]).filter((q) => isQuestionIdForCategory(q, quizCategoriaKey)),
      ...(state.gresite as string[]).filter((q) => isQuestionIdForCategory(q, quizCategoriaKey)),
    ]).size;
    const remaining = categoryTotal != null ? Math.max(0, categoryTotal - answered) : null;
    const score = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return { correct, wrong, answered, remaining, score };
  })();

  const handleLanguageChange = (lang: string) => {
    if (isDanRoute && lang !== "ro") return;
    i18n.changeLanguage(lang);
    router.invalidate();
  };

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setOfflineReady(true)).catch(() => {});
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as typeof installPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || isTextEditingTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const didHandleUndo = key === "z" && !event.shiftKey && undoCustomStoreChange();
      const didHandleRedo =
        ((key === "z" && event.shiftKey) || key === "y") && redoCustomStoreChange();

      if (didHandleUndo || didHandleRedo) {
        event.preventDefault();
        router.invalidate();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black text-white">
        {/*
          Three-column layout:
          [logo | shrink-0]  [quiz context | flex-1 center]  [controls | shrink-0]
        */}
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          {/* ── Left: logo ── */}
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img src="/bear2023.svg" alt="logo" width="36" className="invert" />
          </Link>

          {/* ── Center: quiz context pill — clickable progress button ── */}
          <div className="flex min-w-0 flex-1 items-center justify-center">
            {isQuizRoute && (
              <button
                onClick={() => setProgressOpen(true)}
                className="group flex max-w-full items-center gap-2 border border-white/20 bg-white/5 px-3 py-2 transition-colors duration-150 hover:border-white/40 hover:bg-white/10"
              >
                <span className="shrink-0 bg-primary px-2 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-primary-foreground">
                  {isRetake ? `↩ ${quizCategoria}` : quizCategoria}
                </span>
                <span className="truncate text-sm font-medium text-white">
                  {t("common.question")} {quizNr}
                </span>
                <BarChart2 className="h-3.5 w-3.5 shrink-0 text-white/55 opacity-50 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>

          {/* ── Right: controls ── */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Mobile: hamburger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                aria-describedby={undefined}
                side="right"
                className="flex w-[300px] flex-col border-l-white/10 bg-black pb-8 text-white sm:w-[350px]"
              >
                <SheetHeader>
                  <SheetTitle>{t("common.menu")}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-1 flex-col gap-6 px-2">
                  <Link
                    to="/"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 border border-transparent p-3 text-[13px] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:border-white/15 hover:bg-white/5"
                  >
                    <HomeIcon className="h-5 w-5" />
                    {t("common.home")}
                  </Link>

                  <div className="space-y-2">
                    <p className="editorial-label text-white/60">{t("common.language")}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start border-white bg-transparent text-white hover:border-white/70 hover:bg-white/10 hover:text-white"
                        >
                          {langs[i18n.language as keyof typeof langs]}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {Object.keys(availableLangs).map((c) => (
                          <DropdownMenuItem
                            key={c + "_lang"}
                            onClick={() => handleLanguageChange(c)}
                            className="justify-between"
                          >
                            {availableLangs[c as keyof typeof availableLangs]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex-1"
                    >
                      <Sun className="h-4 w-4 mr-1" />
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex-1"
                    >
                      <Moon className="h-4 w-4 mr-1" />
                    </Button>
                  </div>

                  <HomeActions />

                  <Link
                    to="/custom"
                    preload={false}
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 border border-transparent p-3 text-[13px] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:border-white/15 hover:bg-white/5"
                  >
                    <BookPlus className="h-5 w-5" />
                    {t("custom.title")}
                  </Link>

                  <Social />

                  {/* Offline / SW status — also an install-to-homescreen trigger */}
                  {!installed && !isStandalone && (
                    <button
                      onClick={handleInstall}
                      disabled={!installPrompt && !isIos}
                      className={`w-full flex items-center gap-3 border px-3 py-3 text-left transition-colors ${
                        offlineReady
                          ? "border-green-500/30 bg-green-500/10 " +
                            (installPrompt || isIos
                              ? "cursor-pointer hover:border-green-500/60 hover:bg-green-500/20"
                              : "cursor-default")
                          : "cursor-default border-white/15 bg-white/5"
                      }`}
                    >
                      <div className="relative shrink-0">
                        {offlineReady ? (
                          <>
                            <HardDrive className="h-5 w-5 text-green-500" />
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
                          </>
                        ) : (
                          <>
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            <Loader2 className="absolute -top-1 -right-1 h-3 w-3 animate-spin text-primary" />
                          </>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium leading-tight ${offlineReady ? "text-green-600 dark:text-green-400" : "text-white"}`}
                        >
                          {offlineReady ? t("root.offlineReady") : t("root.offlineCaching")}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-white/60">
                          {isIos && offlineReady
                            ? t("root.iosInstallHint")
                            : offlineReady
                              ? t("root.offlineCached")
                              : t("root.offlinePreparing")}
                        </p>
                      </div>
                      {/* Install affordance icon */}
                      {offlineReady && (installPrompt || isIos) && (
                        <span className="shrink-0 text-white/60">
                          {isIos ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop: inline controls */}
            <div className="hidden items-center gap-2 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white bg-transparent text-white hover:border-white/70 hover:bg-white/10 hover:text-white"
                  >
                    {i18n.language}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.keys(availableLangs).map((c) => (
                    <DropdownMenuItem key={c + "_lang"} onClick={() => handleLanguageChange(c)}>
                      {availableLangs[c as keyof typeof availableLangs]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSheetOpen(true)}
                className="border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress info dialog — slides down from navbar */}
      <Dialog.Root open={progressOpen} onOpenChange={setProgressOpen}>
        <Dialog.Portal>
          {/* Dim backdrop */}
          <Dialog.Overlay className="editorial-dialog-overlay" />

          {/* Panel anchored just below the navbar, slides in from top */}
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-0 right-0 top-16 z-50 flex justify-center px-4 pt-3 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4 data-[state=open]:duration-250 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-4 data-[state=closed]:duration-200"
          >
            <Card className="w-full max-w-sm border-border bg-card dark:bg-[#101010]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 pb-3 pt-4">
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-primary-foreground">
                    {isRetake ? `↩ ${quizCategoria}` : quizCategoria}
                  </span>
                  <Dialog.Title className="text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {t("test.yourProgress")}
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" className="-mr-1 h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </Dialog.Close>
              </div>

              <CardContent className="px-4 pt-4 pb-5 space-y-4">
                {progressStats && (
                  <>
                    {/* Stat tiles */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center gap-1.5 border border-green-500/30 bg-green-500/10 p-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <p className="text-2xl font-bold text-green-500 leading-none">
                          {progressStats.correct}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("common.right")}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 border border-red-500/30 bg-red-500/10 p-3">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <p className="text-2xl font-bold text-red-500 leading-none">
                          {progressStats.wrong}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("common.wrong")}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 border border-border bg-muted/40 p-3">
                        <Circle className="h-5 w-5 text-muted-foreground" />
                        <p className="text-2xl font-bold text-muted-foreground leading-none">
                          {progressStats.remaining ?? categoryTotal ?? "?"}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("test.left")}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">
                          {progressStats.answered}
                          {categoryTotal != null ? ` / ${categoryTotal}` : ""} {t("test.answered")}
                        </span>
                        <span className="font-semibold tabular-nums">{progressStats.score}%</span>
                      </div>
                      <Progress
                        value={
                          categoryTotal != null
                            ? Math.round((progressStats.answered / categoryTotal) * 100)
                            : progressStats.score
                        }
                        className="h-2.5"
                      />
                    </div>

                    {/* Footer note */}
                    <p className="text-xs text-muted-foreground text-center">
                      {t("common.question")} {quizNr}
                      {isRetake && (
                        <span className="ml-1.5 font-medium text-primary">· retake</span>
                      )}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Quiz routes: no horizontal padding on mobile (card goes edge-to-edge) */}
      <main
        className={`container mx-auto min-h-[60vh] ${isQuizRoute ? "px-0 py-0 md:px-4 md:py-4" : "px-4 py-8"}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
