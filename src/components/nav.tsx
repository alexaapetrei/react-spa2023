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
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

export function NavLayout() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const routerState = useRouterState();
  const { theme, setTheme } = useTheme();
  const [offlineReady, setOfflineReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);

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

  // Progress stats for the dialog — read live from localStorage
  const progressStats = (() => {
    if (!isQuizRoute || !quizCategoriaKey) return null;
    const raw = localStorage.getItem("state");
    const state = raw ? JSON.parse(raw) : { corecte: [], gresite: [] };
    const correct = (state.corecte as string[]).filter((q) =>
      q.startsWith(quizCategoriaKey),
    ).length;
    const wrong = (state.gresite as string[]).filter((q) => q.startsWith(quizCategoriaKey)).length;
    const answered = correct + wrong;
    const remaining = categoryTotal != null ? categoryTotal - answered : null;
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
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        {/*
          Three-column layout:
          [logo | shrink-0]  [quiz context | flex-1 center]  [controls | shrink-0]
        */}
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          {/* ── Left: logo ── */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/bear2023.svg" alt="logo" width="36" className="rounded-sm" />
            <span className="text-base leading-none">{offlineReady ? "🚀⚡" : "👩‍💻"}</span>
          </Link>

          {/* ── Center: quiz context pill — clickable progress button ── */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            {isQuizRoute && (
              <button
                onClick={() => setProgressOpen(true)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 hover:border-border hover:bg-accent/60 active:scale-95 transition-all duration-150 max-w-full"
              >
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide shrink-0">
                  {isRetake ? `↩ ${quizCategoria}` : quizCategoria}
                </span>
                <span className="text-sm font-medium text-foreground truncate">
                  {t("common.question")} {quizNr}
                </span>
                <BarChart2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* ── Right: controls ── */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile: hamburger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] flex flex-col pb-8">
                <SheetHeader>
                  <SheetTitle>{t("common.menu")}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-6 px-2 flex-1">
                  <Link
                    to="/"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 text-lg font-medium p-3 rounded-lg hover:bg-accent"
                  >
                    <HomeIcon className="h-5 w-5" />
                    {t("common.home")}
                  </Link>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("common.language")}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="w-full">
                        <Button variant="outline" className="w-full justify-start">
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
                  <Social />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop: inline controls */}
            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline" size="sm">
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
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setSheetOpen(true)}>
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
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200" />

          {/* Panel anchored just below the navbar, slides in from top */}
          <Dialog.Content className="fixed top-14 left-0 right-0 z-50 flex justify-center px-4 pt-3 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4 data-[state=open]:duration-250 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-4 data-[state=closed]:duration-200">
            <Card className="w-full max-w-sm shadow-2xl border-border/60">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-widest">
                    {isRetake ? `↩ ${quizCategoria}` : quizCategoria}
                  </span>
                  <Dialog.Title className="font-semibold text-sm">
                    {t("test.yourProgress")}
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full -mr-1">
                    <X className="h-4 w-4" />
                  </Button>
                </Dialog.Close>
              </div>

              <CardContent className="px-4 pt-4 pb-5 space-y-4">
                {progressStats && (
                  <>
                    {/* Stat tiles */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 flex flex-col items-center gap-1.5">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <p className="text-2xl font-bold text-green-500 leading-none">
                          {progressStats.correct}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("common.right")}</p>
                      </div>
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex flex-col items-center gap-1.5">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <p className="text-2xl font-bold text-red-500 leading-none">
                          {progressStats.wrong}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("common.wrong")}</p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-muted/40 p-3 flex flex-col items-center gap-1.5">
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
                        className="h-2.5 rounded-full"
                      />
                    </div>

                    {/* Footer note */}
                    <p className="text-xs text-muted-foreground text-center">
                      {t("common.question")} {quizNr}
                      {isRetake && (
                        <span className="ml-1.5 text-primary font-medium">· retake</span>
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
        className={`container mx-auto min-h-[60vh] ${isQuizRoute ? "px-0 md:px-4 py-0 md:py-4" : "px-4 py-8"}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
