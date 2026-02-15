import { createRouter, createRootRoute, createRoute, Outlet, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { langs } from "./i18n";
import { useState, useEffect } from "react";
import { Social } from "./components/social";
import { Moon, Sun, Share2, Menu, Home as HomeIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "./components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { useTheme } from "./components/ui/use-theme";
import "./index.css";
import useCatego, { LangKeys } from "./hooks/useCatego";
import useLocalState from "./hooks/useLocalState";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card";
import { Progress } from "./components/ui/progress";
import { RefreshCw, RotateCcw } from "lucide-react";

const rootRoute = createRootRoute({
  component: () => {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [offlineReady, setOfflineReady] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);

    useEffect(() => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then(() => {
          setOfflineReady(true);
        }).catch(() => {});
      }
    }, []);

    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/bear2023.svg" alt="logo" width="40" className="rounded-sm" />
              {offlineReady ? <span>🚀⚡</span> : <span>👩‍💻</span>}
            </Link>
            
            <div className="flex items-center gap-2">
              {/* Mobile: Menu sheet from right */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle>{t("common.menu")}</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-6 mt-6 px-2">
                    <Link 
                      to="/" 
                      onClick={() => setSheetOpen(false)}
                      className="flex items-center gap-3 text-lg font-medium p-3 rounded-lg hover:bg-accent"
                    >
                      <HomeIcon className="h-5 w-5" />
                      {t("common.home")}
                    </Link>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{t("common.language")}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            {langs[i18n.language as keyof typeof langs]}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          {Object.keys(langs).map((c) => (
                            <DropdownMenuItem 
                              key={c + "_lang"} 
                              onClick={() => i18n.changeLanguage(c)}
                              className="py-3 text-base"
                            >
                              {langs[c]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    >
                      {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                      {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </Button>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{t("common.share")}</p>
                      <Social />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop: Language dropdown */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">{i18n.language}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.keys(langs).map((c) => (
                      <DropdownMenuItem key={c + "_lang"} onClick={() => i18n.changeLanguage(c)}>
                        {langs[c]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop: Theme toggle */}
              <Button variant="outline" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="hidden md:flex">
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              {/* Desktop: Share dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    <Share2 className="mr-2 h-4 w-4" />
                    {t("common.share")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Social />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    );
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function Index() {
    const { t, i18n } = useTranslation();
    const catego = useCatego(i18n.language as LangKeys);
    const [state, setState] = useLocalState();

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">{t("common.encourage")} Hell yeah</CardTitle>
            <CardDescription>{t("common.disourage")}</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.keys(catego).map((c) => {
            const corecteCount = state.corecte.filter((q) => q.includes(c)).length;
            const gresiteCount = state.gresite.filter((q) => q.includes(c)).length;
            const totalCount = corecteCount + gresiteCount;
            const maxQuestions = catego[c].length;
            const percentage = maxQuestions > 0 ? (totalCount / maxQuestions) * 100 : 0;

            return (
              <Link key={c} to={`/categoria/${c}/${totalCount}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center text-2xl font-black">{c.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Progress value={percentage} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="text-green-600">{corecteCount}</span>
                      <span className="text-red-600">{gresiteCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("root.updateNow")}
          </Button>
          <Button variant="destructive" onClick={() => { localStorage.removeItem("state"); setState({ corecte: [], gresite: [] }); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.reset")}
          </Button>
        </div>
      </div>
    );
  },
});

const categoriaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categoria/$categoria/$nr",
  component: function Categoria() {
    const { t, i18n } = useTranslation();
    const params = categoriaRoute.useParams();
    const catego = useCatego(i18n.language as LangKeys);
    const { categoria = "b", nr = "0" } = params;
    const numarul = Number(nr);

    const localState = localStorage.getItem("state");
    const state = localState ? JSON.parse(localState) : { corecte: [], gresite: [] };

    const chosenCategory = catego[categoria];
    const chosen = chosenCategory?.[numarul];
    const last = !chosen || numarul >= chosenCategory.length;
    const next = last ? chosenCategory.length : numarul + 1;

    if (!chosen) return <div>Loading...</div>;
    if (last) {
      return (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{t("test.done")}</CardTitle>
            <CardDescription>{t("test.congrats")}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to={`/retake/${categoria}/0`}>
              <Button>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("test.startRetest")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <TestView chosen={chosen} categoria={categoria} next={next} isRetake={false} />
      </div>
    );
  },
});

const retakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/retake/$categoria/$nr",
  component: function Retake() {
    const { t, i18n } = useTranslation();
    const params = retakeRoute.useParams();
    const catego = useCatego(i18n.language as LangKeys);
    const { categoria = "b", nr = "0" } = params;
    const numarul = Number(nr);

    const localState = localStorage.getItem("state");
    const state = localState ? JSON.parse(localState) : { corecte: [], gresite: [] };

    const wrongAnswers = catego[categoria]?.filter((q) => state.gresite.includes(q.id)) || [];
    const chosen = wrongAnswers[numarul];
    const last = !chosen || numarul >= wrongAnswers.length;
    const next = last ? 0 : numarul + 1;

    if (!chosen) return <div>Loading...</div>;
    if (last) {
      return (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{t("test.finished")}</CardTitle>
            <CardDescription>{t("test.tip")}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/">
              <Button>{t("common.home")}</Button>
            </Link>
          </CardFooter>
        </Card>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <TestView chosen={chosen} categoria={categoria} next={next} isRetake={true} />
      </div>
    );
  },
});

function TestView({ chosen, categoria, next, isRetake }: { chosen: any; categoria: string; next: number; isRetake: boolean }) {
  const { t } = useTranslation();
  const [active, setActive] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const hasImage = (chosen.i || 0) > 0;

  const handleCheck = () => {
    setChecked(true);
    const key = active.toString() === chosen.v ? "corecte" : "gresite";
    const localState = localStorage.getItem("state");
    let state = localState ? JSON.parse(localState) : { corecte: [], gresite: [] };
    
    if (isRetake && key === "corecte") {
      state = { ...state, gresite: state.gresite.filter((g: string) => g !== chosen.id), corecte: [...state.corecte, chosen.id] };
    } else {
      state = { ...state, [key]: [...state[key], chosen.id] };
    }
    localStorage.setItem("state", JSON.stringify(state));
  };

  const reset = () => {
    setChecked(false);
    setActive([]);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">{categoria.toUpperCase()}</span>
        <span className="px-3 py-1 rounded-full bg-secondary text-sm">{t("common.question")} {next - 1}</span>
      </div>

      <Card>
        {hasImage && (
          <CardContent className="pt-6">
            <img src={`/img/${categoria}/${chosen.i}.jpg`} alt="Question" className="rounded-lg max-h-80 mx-auto" />
          </CardContent>
        )}
        
        <CardContent className={`space-y-4 ${hasImage ? "" : "pt-4"}`}>
          <p className="text-xl font-semibold">{chosen.q}</p>
          
          <div className="space-y-3">
            {Object.keys(chosen.ans).map((answer: string) => (
              <button
                key={answer}
                onClick={() => !checked && setActive(active.includes(answer) ? active.filter(a => a !== answer) : [...active, answer])}
                disabled={checked}
                className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 transition-colors text-left ${
                  checked && chosen.v === answer 
                    ? "border-green-500 bg-green-500/20" 
                    : checked && active.includes(answer) 
                    ? "border-red-500 bg-red-500/20" 
                    : active.includes(answer) 
                    ? "border-primary bg-primary/10" 
                    : "border-input hover:bg-accent"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  checked && chosen.v === answer 
                    ? "bg-green-500 text-white" 
                    : checked && active.includes(answer) 
                    ? "bg-red-500 text-white" 
                    : active.includes(answer) 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}>
                  {checked ? (chosen.v === answer ? "✓" : active.includes(answer) ? "✗" : "") : answer.toUpperCase()}
                </div>
                <span>{chosen.ans[answer]}</span>
              </button>
            ))}
          </div>
        </CardContent>

        <CardFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="max-w-2xl mx-auto w-full">
            {checked ? (
              <Link
                to={`/${isRetake ? "retake" : "categoria"}/${categoria}/${next}`}
                onClick={reset}
                className={`block w-full py-4 text-center rounded-lg text-white font-semibold ${
                  active.toString() === chosen.v ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {t("common.next")} →
              </Link>
            ) : active.length > 0 ? (
              <Button onClick={handleCheck} className="w-full py-6 text-lg">{t("test.check")}</Button>
            ) : null}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}

const routeTree = rootRoute.addChildren([indexRoute, categoriaRoute, retakeRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
