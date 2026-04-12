import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import {
  getSetsForLang,
  initCustomStore,
  getSetIdByUrlKey,
  ensureCanonicalLoaded,
  getAllQuestionsForLang,
} from "./lib/customStore";
import { CustomPage } from "./pages/custom";
import { CustomNewPage } from "./pages/custom-new";
import { CustomEditPage } from "./pages/custom-edit";
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
import { RotateCcw } from "lucide-react";
import type { Catego, LangKeys } from "./types/catego";
import { NavLayout } from "./components/nav";
import { TestView } from "./components/test-view";
import { FinishedCard } from "./components/finished-card";
import useLocalState from "./hooks/useLocalState";
import { isQuestionIdForCategory } from "./lib/categoryProgress";
import { DefaultErrorBoundary } from "./components/DefaultErrorBoundary";
import { NotFoundPage } from "./components/NotFoundPage";

const validLangs: LangKeys[] = ["ro", "en", "de", "hu"];

let storeInitialized = false;

/** Reads the language saved by i18n.ts — key must match what i18n.ts writes. */
const getCurrentLanguage = (): LangKeys => {
  if (typeof window === "undefined") return "ro";
  const stored = localStorage.getItem("i18nLanguage");
  return validLangs.includes(stored as LangKeys) ? (stored as LangKeys) : "ro";
};

const loadQuestions = async (lang: string): Promise<Catego> => {
  if (!storeInitialized) {
    await initCustomStore();
    storeInitialized = true;
  }
  const validLang = validLangs.includes(lang as LangKeys) ? (lang as LangKeys) : "ro";
  await ensureCanonicalLoaded(validLang);
  return getAllQuestionsForLang(validLang);
};

const loadCustomStore = async () => {
  await initCustomStore();
  return null;
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: NavLayout });

// ─── Index ────────────────────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  loader: async () => {
    const lang = getCurrentLanguage();
    return { questions: await loadQuestions(lang), language: lang };
  },
  // Cache so revisiting home after answering questions doesn't re-fetch;
  // router.invalidate() (called on language change) bypasses this.
  staleTime: Infinity,
  component: Index,
});

function CategoryCard({
  categoryKey,
  categoryName,
  totalCount,
  corecteCount,
  gresiteCount,
  percentage,
}: {
  categoryKey: string;
  categoryName: string;
  totalCount: number;
  corecteCount: number;
  gresiteCount: number;
  percentage: number;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() =>
        navigate({
          to: "/categoria/$categoria/$nr",
          params: { categoria: categoryKey, nr: String(totalCount) },
        })
      }
      className="text-left"
    >
      <Card className="cursor-pointer transition-colors hover:border-foreground hover:bg-accent dark:hover:border-white dark:hover:bg-white/5">
        <CardHeader className="border-b border-border pb-4">
          <p className="editorial-kicker text-center">{t("custom.category")}</p>
          <CardTitle className="text-center text-[24px] font-medium">
            {categoryName.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          <Progress value={percentage} />
          <div className="flex justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-green-600">{corecteCount} ✓</span>
            <span className="text-red-600">{gresiteCount} ✗</span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function Index() {
  const { t } = useTranslation();
  const { questions, language } = indexRoute.useLoaderData();
  const [state] = useLocalState();
  const customCategoryNames = new Map(
    getSetsForLang(language).map((set) => [set.categoryKey, set.name]),
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <section className="space-y-3 border-b border-border pb-6 text-center">
        <p className="editorial-kicker">Driving Theory</p>
        <h1 className="text-[26px] font-medium leading-[1.15] tracking-[0.01em] text-foreground">
          Editorial study cards for every category.
        </h1>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.keys(questions).map((c) => {
          // Match the category key plus delimiter so "b" doesn't match custom IDs like "bus-...".
          // Deduplicate so multiple retake attempts for the same question count once.
          const uniqueCorecte = new Set(state.corecte.filter((q) => isQuestionIdForCategory(q, c)));
          const uniqueGresite = new Set(state.gresite.filter((q) => isQuestionIdForCategory(q, c)));
          const corecteCount = uniqueCorecte.size;
          const gresiteCount = uniqueGresite.size;
          // Resume index = unique questions touched, capped at category length so we never
          // skip past the end and land immediately on the completion screen.
          const maxQuestions = questions[c].length;
          const totalCount = Math.min(
            new Set([...uniqueCorecte, ...uniqueGresite]).size,
            maxQuestions,
          );
          const percentage = maxQuestions > 0 ? (totalCount / maxQuestions) * 100 : 0;
          const categoryName = customCategoryNames.get(c) ?? c;

          return (
            <CategoryCard
              key={c}
              categoryKey={c}
              categoryName={categoryName}
              totalCount={totalCount}
              corecteCount={corecteCount}
              gresiteCount={gresiteCount}
              percentage={percentage}
            />
          );
        })}
      </div>

      <Card className="bg-black text-white dark:bg-[#101010]">
        <CardHeader className="text-center">
          <p className="editorial-kicker text-white/60">{t("common.editorsNote")}</p>
          <CardTitle className="text-lg sm:text-[26px] font-medium text-white">
            {t("common.encourage")}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

// ─── Categoria layout ─────────────────────────────────────────────────────────
//
// Loads questions ONCE when entering a category. Child route handles the
// question index ($nr). Navigating between questions only re-renders the
// child — the loader here never fires again unless the language changes
// (nav.tsx calls router.invalidate() on language change which resets the cache).

const categoriaLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categoria/$categoria",
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
  const { categoria, nr } = categoriaRoute.useParams({ strict: false });
  const categoriaKey = categoria ?? "b";
  const nrValue = nr ?? "0";
  // Data is from the parent layout loader
  const { questions } = categoriaLayoutRoute.useLoaderData();
  const numarul = Number(nrValue);

  const raw = localStorage.getItem("state");
  const state = raw ? JSON.parse(raw) : { corecte: [], gresite: [] };

  const chosenCategory = questions[categoriaKey];
  const chosen = chosenCategory?.[numarul];
  const last = !chosenCategory || numarul >= chosenCategory.length;
  const next = last ? chosenCategory?.length || 0 : numarul + 1;

  if (!chosen && !last) return <div>Loading…</div>;

  if (last) {
    // Deduplicate: a question answered multiple times should only count once
    const wrongForCategory = [
      ...new Set(
        (state.gresite as string[]).filter((q) => isQuestionIdForCategory(q, categoriaKey)),
      ),
    ];
    const correctForCategory = [
      ...new Set(
        (state.corecte as string[]).filter((q) => isQuestionIdForCategory(q, categoriaKey)),
      ),
    ];
    const totalAnswered = wrongForCategory.length + correctForCategory.length;
    const score =
      totalAnswered > 0 ? Math.round((correctForCategory.length / totalAnswered) * 100) : 0;

    if (wrongForCategory.length > 0) {
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
                  ✓ {correctForCategory.length} {t("common.right")}
                </span>
                <span className="text-red-500">
                  ✗ {wrongForCategory.length} {t("common.wrong")}
                </span>
              </div>
              <Progress value={score} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {t("test.scoreOf", {
                  score,
                  answered: totalAnswered,
                  total: chosenCategory?.length ?? totalAnswered,
                })}
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Link
                to="/retake/$categoria/$nr"
                params={{ categoria: categoriaKey, nr: "0" }}
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

    return (
      <FinishedCard
        correct={correctForCategory.length}
        total={totalAnswered}
        categoria={categoriaKey}
      />
    );
  }

  return <TestView chosen={chosen} categoria={categoriaKey} next={next} isRetake={false} />;
}

// ─── Retake layout ────────────────────────────────────────────────────────────
//
// Same pattern as categoriaLayoutRoute — questions load once per retake session.

const retakeLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/retake/$categoria",
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
  const { categoria, nr } = retakeRoute.useParams({ strict: false });
  const categoriaKey = categoria ?? "b";
  const nrValue = nr ?? "0";
  const { questions } = retakeLayoutRoute.useLoaderData();
  const numarul = Number(nrValue);

  const raw = localStorage.getItem("state");
  const savedState = raw ? JSON.parse(raw) : { corecte: [], gresite: [] };

  const chosenCategory = questions[categoriaKey];

  // Deduplicate: a question answered multiple times only counts once
  const categoryWrong = [
    ...new Set(
      (savedState.gresite as string[]).filter((q) => isQuestionIdForCategory(q, categoriaKey)),
    ),
  ];
  const categoryCorrect = [
    ...new Set(
      (savedState.corecte as string[]).filter((q) => isQuestionIdForCategory(q, categoriaKey)),
    ),
  ];

  const wrongIds = new Set(categoryWrong);
  // wrongQuestions: unique wrong questions that still exist in the category
  const wrongQuestions = chosenCategory?.filter((q) => wrongIds.has(q.id)) || [];

  const chosen = wrongQuestions[numarul];
  const next = numarul + 1;

  // Stats for completion screens
  const totalAnswered = categoryCorrect.length + categoryWrong.length;
  const retakeScore =
    totalAnswered > 0 ? Math.round((categoryCorrect.length / totalAnswered) * 100) : 100;

  // Finished this retake pass — check current state to decide which screen
  if (!chosen) {
    if (wrongQuestions.length > 0) {
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
                  ✓ {categoryCorrect.length} {t("common.right")}
                </span>
                <span className="text-red-500">
                  ✗ {wrongQuestions.length} {t("common.wrong")}
                </span>
              </div>
              <Progress value={retakeScore} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {t("test.scoreOf", {
                  score: retakeScore,
                  answered: totalAnswered,
                  total: chosenCategory?.length ?? totalAnswered,
                })}
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Link
                to="/retake/$categoria/$nr"
                params={{ categoria: categoriaKey, nr: "0" }}
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
    return (
      <FinishedCard
        correct={categoryCorrect.length}
        total={totalAnswered}
        categoria={categoriaKey}
      />
    );
  }

  return <TestView chosen={chosen} categoria={categoriaKey} next={next} isRetake={true} />;
}

// ─── Router ───────────────────────────────────────────────────────────────────

const customRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/custom",
  loader: loadCustomStore,
  component: CustomPage,
});

const customNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/custom/new",
  loader: loadCustomStore,
  component: CustomNewPage,
});

export const customEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/custom/$setKey",
  loader: async ({ params }) => {
    await initCustomStore();
    const setId = getSetIdByUrlKey(params.setKey);
    if (!setId) {
      throw notFound();
    }
    return { setId };
  },
  component: CustomEditPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  categoriaLayoutRoute.addChildren([categoriaRoute]),
  retakeLayoutRoute.addChildren([retakeRoute]),
  customRoute,
  customNewRoute,
  customEditRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: false,
  defaultViewTransition: true,
  defaultErrorComponent: DefaultErrorBoundary,
  defaultNotFoundComponent: NotFoundPage,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { router };
