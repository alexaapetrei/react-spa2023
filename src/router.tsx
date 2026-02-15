import { createRouter, createRootRoute, createRoute, Outlet, Link, useRouter, useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { langs } from "./i18n";
import { useState, useEffect } from "react";
import { Social } from "./components/social";
import { Moon, Sun, Menu, Home as HomeIcon } from "lucide-react";
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
import useLocalState from "./hooks/useLocalState";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card";
import { Progress } from "./components/ui/progress";
import { RotateCcw, ArrowRight } from "lucide-react";

import type { Catego, LangKeys } from "./hooks/useCatego";
import roData from "./data/catego.json";

const validLangs: LangKeys[] = ["ro", "en", "de", "hu"];

let currentLanguage: LangKeys = "ro";

const getCurrentLanguage = (): LangKeys => {
  if (typeof window === "undefined") return "ro";
  const stored = localStorage.getItem("i18nextLng");
  return validLangs.includes(stored as LangKeys) ? stored as LangKeys : "ro";
};

const loadQuestions = async (lang: string): Promise<Catego> => {
  const validLang = validLangs.includes(lang as LangKeys) ? lang as LangKeys : "ro";
  
  if (validLang === "ro") {
    return roData as Catego;
  }
  
  const module = await import(`./data/catego-${validLang}.json`);
  return module.default as Catego;
};

type LoaderData = {
  questions: Catego;
  language: LangKeys;
};

const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const routerState = useRouterState();
  const { theme, setTheme } = useTheme();
  const [offlineReady, setOfflineReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isDanRoute = routerState.location.pathname.includes("/categoria/dan/");
  const availableLangs = isDanRoute ? { ro: langs.ro } : langs;

  const handleLanguageChange = (lang: string) => {
    if (isDanRoute && lang !== "ro") return;
    currentLanguage = lang as LangKeys;
    i18n.changeLanguage(lang);
    router.invalidate();
  };

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
                    <p className="text-sm font-medium text-muted-foreground">{t("common.language")}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
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
                  
                  <Social />
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">{i18n.language}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {Object.keys(availableLangs).map((c) => (
                    <DropdownMenuItem 
                      key={c + "_lang"} 
                      onClick={() => handleLanguageChange(c)}
                    >
                      {availableLangs[c as keyof typeof availableLangs]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              
              <Button variant="ghost" size="icon" onClick={() => setSheetOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  loader: async () => {
    const lang = getCurrentLanguage();
    const questions = await loadQuestions(lang);
    return { questions, language: lang };
  },
  component: Index,
});

function Index() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { questions } = indexRoute.useLoaderData() as LoaderData;
  const catego = questions;
  const [state] = useLocalState();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{t("common.encourage")}</CardTitle>
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
            <Link key={c} to={`/categoria/${c}/${totalCount}`} preload={false}>
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
        <Button variant="outline" onClick={() => router.invalidate()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t("test.update")}
        </Button>
      </div>
    </div>
  );
}

const categoriaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categoria/$categoria/$nr",
  loader: async () => {
    const lang = getCurrentLanguage();
    const questions = await loadQuestions(lang);
    return { questions, language: lang };
  },
  component: Categoria,
});

function Categoria() {
  const { t } = useTranslation();
  const params = categoriaRoute.useParams();
  const { questions } = categoriaRoute.useLoaderData() as LoaderData;
  const catego = questions;
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
          <Link to={`/retake/${categoria}/0` as any} preload={false}>
            <Button>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("test.retake")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <TestView chosen={chosen} categoria={categoria} next={next} isRetake={false} />
  );
}

const retakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/retake/$categoria/$nr",
  loader: async () => {
    const lang = getCurrentLanguage();
    const questions = await loadQuestions(lang);
    return { questions, language: lang };
  },
  component: Retake,
});

function Retake() {
  const { t } = useTranslation();
  const params = retakeRoute.useParams();
  const { questions } = retakeRoute.useLoaderData() as LoaderData;
  const catego = questions;
  const { categoria = "b", nr = "0" } = params;
  const numarul = Number(nr);

  const localState = localStorage.getItem("state");
  const wrongAnswers = localState ? JSON.parse(localState).gresite : [];
  const categoryWrong = wrongAnswers.filter((q: string) => q.startsWith(categoria));
  
  const chosenCategory = catego[categoria];
  const wrongIds = new Set(categoryWrong);
  const wrongQuestions = chosenCategory?.filter((q) => wrongIds.has(q.id)) || [];
  
  const chosen = wrongQuestions[numarul];
  const last = !chosen || numarul >= wrongQuestions.length;
  const next = last ? wrongQuestions.length : numarul + 1;

  if (!chosen) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t("test.nones")}</CardTitle>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link to="/" preload={false}>
            <Button>{t("test.home")}</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
  if (last) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t("test.done")}</CardTitle>
          <CardDescription>{t("test.congrats")}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link to={`/retake/${categoria}/0` as any} preload={false}>
            <Button>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("test.retake")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <TestView chosen={chosen} categoria={categoria} next={next} isRetake={true} />
  );
}

function TestView({ chosen, categoria, next, isRetake }: { chosen: any; categoria: string; next: number; isRetake: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
        {hasImage ? (
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-6 flex items-center justify-center bg-muted rounded-l-lg">
              <img 
                src={`/img/${categoria}/${chosen.i}.jpg`} 
                alt="Question" 
                className="rounded-lg max-h-80 max-w-full object-contain"
              />
            </div>
            <div className="lg:w-1/2">
              <CardContent className="pt-6 space-y-4">
                <p className="text-xl font-semibold">{chosen.q}</p>
                
                <div className="space-y-3">
                  {Object.keys(chosen.ans).map((answer: string) => (
                    <button
                      key={answer}
                      onClick={() => !checked && setActive(active.includes(answer) ? active.filter(a => a !== answer) : [...active, answer])}
                      disabled={checked}
                      className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 transition-colors text-left ${
                        checked
                          ? chosen.v.includes(answer)
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : active.includes(answer)
                              ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                              : "border-input"
                          : active.includes(answer)
                            ? "border-primary bg-primary/10"
                            : "border-input hover:border-primary/50"
                      }`}
                    >
                      <span className="text-2xl font-bold">{answer.toUpperCase()}.</span>
                      <span className="flex-1">{chosen.ans[answer]}</span>
                    </button>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex gap-4">
                {!checked ? (
                  <Button onClick={handleCheck} disabled={active.length === 0} className="flex-1">
                    {t("test.check")}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      reset();
                      if (isRetake) {
                        navigate({ to: "/retake/$categoria/$nr", params: { categoria, nr: String(next) } });
                      } else {
                        navigate({ to: "/categoria/$categoria/$nr", params: { categoria, nr: String(next) } });
                      }
                    }} 
                    className="flex-1"
                  >
                    {t("test.next")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </div>
          </div>
        ) : (
          <>
            <CardContent className="pt-6 space-y-4">
              <p className="text-xl font-semibold">{chosen.q}</p>
              
              <div className="space-y-3">
                {Object.keys(chosen.ans).map((answer: string) => (
                  <button
                    key={answer}
                    onClick={() => !checked && setActive(active.includes(answer) ? active.filter(a => a !== answer) : [...active, answer])}
                    disabled={checked}
                    className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 transition-colors text-left ${
                      checked
                        ? chosen.v.includes(answer)
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : active.includes(answer)
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-input"
                        : active.includes(answer)
                          ? "border-primary bg-primary/10"
                          : "border-input hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl font-bold">{answer.toUpperCase()}.</span>
                    <span className="flex-1">{chosen.ans[answer]}</span>
                  </button>
                ))}
              </div>
            </CardContent>

            <CardFooter className="flex gap-4">
              {!checked ? (
                <Button onClick={handleCheck} disabled={active.length === 0} className="flex-1">
                  {t("test.check")}
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    reset();
                    if (isRetake) {
                      navigate({ to: "/retake/$categoria/$nr", params: { categoria, nr: String(next) } });
                    } else {
                      navigate({ to: "/categoria/$categoria/$nr", params: { categoria, nr: String(next) } });
                    }
                  }} 
                  className="flex-1"
                >
                  {t("test.next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </>
        )}
      </Card>
    </>
  );
}

const routeTree = rootRoute.addChildren([indexRoute, categoriaRoute, retakeRoute]);

const router = createRouter({
  routeTree,
  defaultPreload: false,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { router };
