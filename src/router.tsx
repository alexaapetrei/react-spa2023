import { createRouter, createRootRoute, createRoute, Outlet, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "./components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/ui/card";
import { Progress } from "./components/ui/progress";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { Catego, LangKeys } from "./hooks/useCatego";
import roData from "./data/catego.json";
import { AppShell } from "./components/app-shell";
import { TestView } from "./components/test-view";
import { FinishedCard } from "./components/finished-card";
import { CustomQuestions } from "./pages/custom-questions";
import { categoryStats, useProgress } from "./lib/progress-store";
import { useCustomQuestions } from "./lib/custom-questions-store";
import { toQuizQuestion } from "./lib/custom-question-adapter";
import ErrorPage from "./errorPage";

const validLangs: LangKeys[] = ["ro", "en", "de", "hu"];

/** Reads the language saved by i18n.ts — key must match what i18n.ts writes. */
const getCurrentLanguage = (): LangKeys => {
  if (typeof window === "undefined") return "ro";
  const stored = localStorage.getItem("i18nLanguage");
  return validLangs.includes(stored as LangKeys) ? (stored as LangKeys) : "ro";
};

const loadQuestions = async (lang: string): Promise<Catego> => {
  const validLang = validLangs.includes(lang as LangKeys) ? (lang as LangKeys) : "ro";
  if (validLang === "ro") return roData as Catego;
  const module = await import(`./data/catego-${validLang}.json`);
  return module.default as Catego;
};

type LoaderData = { questions: Catego; language: LangKeys };

// ─── Root ─────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: AppShell, errorComponent: ErrorPage });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Welcome,
});

// ─── Sets ─────────────────────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sets",
  loader: async () => {
    const lang = getCurrentLanguage();
    return { questions: await loadQuestions(lang), language: lang };
  },
  // Cache so revisiting sets after answering questions doesn't re-fetch;
  // router.invalidate() (called on language change) bypasses this.
  staleTime: Infinity,
  component: Sets,
});

function Welcome() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("home.welcome")}</CardTitle>
          <CardDescription>{t("home.intro")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("common.encourage")}</p>
        </CardContent>
        <CardFooter>
          <Link to="/sets" preload={false}>
            <Button>
              {t("nav.sets")}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

function Sets() {
  const { questions } = indexRoute.useLoaderData() as LoaderData;
  const progress = useProgress();
  const customQuestions = useCustomQuestions();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.keys(questions).map((c) => {
          const { correct, wrong, answered } = categoryStats(progress, c);
          const maxQuestions =
            questions[c].length +
            customQuestions.filter((question) => question.categoria === c).length;
          const percentage = maxQuestions > 0 ? (answered / maxQuestions) * 100 : 0;

          return (
            <Link
              key={c}
              to="/categoria/$categoria/$nr"
              params={{ categoria: c, nr: String(answered) }}
              preload={false}
            >
              <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl font-black">
                    {c.toUpperCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress value={percentage} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-green-600">{correct}</span>
                    <span className="text-red-600">{wrong}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Categoria ────────────────────────────────────────────────────────────────
//
// Loads questions ONCE when entering a category. Child route handles the
// question index ($nr). Navigating between questions only re-renders the
// child — the loader here never fires again unless the language changes
// (SettingsPanel calls router.invalidate() on language change, resetting this).

const categoriaLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categoria/$categoria",
  staticData: { questionContext: true },
  loader: async () => {
    const lang = getCurrentLanguage();
    return { questions: await loadQuestions(lang), language: lang };
  },
  staleTime: Infinity,
  component: () => <Outlet />, // transparent — just passes through to child
});

const categoriaRoute = createRoute({
  getParentRoute: () => categoriaLayoutRoute,
  path: "/$nr",
  component: Categoria,
});

function Categoria() {
  const { t } = useTranslation();
  // Params come from both parent + child routes
  const { categoria = "b", nr = "0" } = categoriaRoute.useParams();
  // Data is from the parent layout loader
  const { questions, language } = categoriaLayoutRoute.useLoaderData() as LoaderData;
  const customQuestions = useCustomQuestions();
  const progress = useProgress();
  const numarul = Number(nr);

  const chosenCategory = [
    ...(questions[categoria] ?? []),
    ...customQuestions
      .filter((question) => question.categoria === categoria)
      .map((question) => toQuizQuestion(question, language)),
  ];
  const chosen = chosenCategory?.[numarul];
  const last = !chosenCategory || numarul >= chosenCategory.length;
  const next = last ? chosenCategory?.length || 0 : numarul + 1;

  if (!chosen && !last) return <div>Loading…</div>;

  if (last) {
    const { correct, wrong, answered, accuracy } = categoryStats(progress, categoria);

    if (wrong > 0) {
      return (
        <div className="animate-in fade-in zoom-in duration-300">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>{t("test.done")}</CardTitle>
              <CardDescription>{t("test.congrats")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-green-600">
                  ✓ {correct} {t("common.right")}
                </span>
                <span className="text-red-500">
                  ✗ {wrong} {t("common.wrong")}
                </span>
              </div>
              <Progress value={accuracy} className="h-2" />
              <p className="text-center text-xs text-muted-foreground">
                {t("test.scoreOf", {
                  score: accuracy,
                  answered,
                  total: chosenCategory?.length ?? answered,
                })}
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Link
                to="/retake/$categoria/$nr"
                params={{ categoria, nr: "0" }}
                preload={false}
                viewTransition
              >
                <Button>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t("test.startRetest")}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return <FinishedCard correct={correct} total={answered} categoria={categoria} />;
  }

  return <TestView chosen={chosen} categoria={categoria} next={next} isRetake={false} />;
}

// ─── Retake ───────────────────────────────────────────────────────────────────
//
// Same pattern as categoriaLayoutRoute — questions load once per retake session.

const retakeLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/retake/$categoria",
  staticData: { questionContext: true },
  loader: async () => {
    const lang = getCurrentLanguage();
    return { questions: await loadQuestions(lang), language: lang };
  },
  staleTime: Infinity,
  component: () => <Outlet />,
});

const retakeRoute = createRoute({
  getParentRoute: () => retakeLayoutRoute,
  path: "/$nr",
  component: Retake,
});

function Retake() {
  const { t } = useTranslation();
  const { categoria = "b", nr = "0" } = retakeRoute.useParams();
  const { questions, language } = retakeLayoutRoute.useLoaderData() as LoaderData;
  const customQuestions = useCustomQuestions();
  const progress = useProgress();
  const numarul = Number(nr);

  const chosenCategory = [
    ...(questions[categoria] ?? []),
    ...customQuestions
      .filter((question) => question.categoria === categoria)
      .map((question) => toQuizQuestion(question, language)),
  ];
  const wrongIds = new Set(progress.gresite);
  const wrongQuestions = chosenCategory?.filter((q) => wrongIds.has(q.id)) || [];

  const chosen = wrongQuestions[numarul];
  const next = numarul + 1;

  // Stats for the completion screens
  const { correct, wrong, answered, accuracy } = categoryStats(progress, categoria);

  // Finished this retake pass — check current state to decide which screen
  if (!chosen) {
    if (wrong > 0) {
      // Still wrong answers remaining → offer another retake pass
      return (
        <div className="animate-in fade-in zoom-in duration-300">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>{t("test.done")}</CardTitle>
              <CardDescription>{t("test.congrats")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-green-600">
                  ✓ {correct} {t("common.right")}
                </span>
                <span className="text-red-500">
                  ✗ {wrong} {t("common.wrong")}
                </span>
              </div>
              <Progress value={accuracy} className="h-2" />
              <p className="text-center text-xs text-muted-foreground">
                {t("test.scoreOf", {
                  score: accuracy,
                  answered,
                  total: chosenCategory?.length ?? answered,
                })}
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Link
                to="/retake/$categoria/$nr"
                params={{ categoria, nr: "0" }}
                preload={false}
                viewTransition
              >
                <Button>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t("test.startRetest")}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // All wrong answers cleared → confetti!
    return <FinishedCard correct={correct} total={answered} categoria={categoria} />;
  }

  return <TestView chosen={chosen} categoria={categoria} next={next} isRetake={true} />;
}

// ─── Custom questions ─────────────────────────────────────────────────────────

const customQuestionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/intrebari",
  component: CustomQuestions,
});

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  homeRoute,
  indexRoute,
  categoriaLayoutRoute.addChildren([categoriaRoute]),
  retakeLayoutRoute.addChildren([retakeRoute]),
  customQuestionsRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: false,
  defaultViewTransition: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { router };
