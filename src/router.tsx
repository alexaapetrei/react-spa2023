import {
  createRouter,
  createRootRoute,
  createRoute,
  Link,
} from "@tanstack/react-router";
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
import type { Catego, LangKeys } from "./hooks/useCatego";
import roData from "./data/catego.json";
import { NavLayout } from "./components/nav";
import { TestView } from "./components/test-view";
import { FinishedCard } from "./components/finished-card";
import useLocalState from "./hooks/useLocalState";

const validLangs: LangKeys[] = ["ro", "en", "de", "hu"];

/** Reads the language saved by i18n.ts — key must match what i18n.ts writes. */
const getCurrentLanguage = (): LangKeys => {
  if (typeof window === "undefined") return "ro";
  const stored = localStorage.getItem("i18nLanguage"); // matches i18n.ts → "i18nLanguage"
  return validLangs.includes(stored as LangKeys) ? (stored as LangKeys) : "ro";
};

const loadQuestions = async (lang: string): Promise<Catego> => {
  const validLang = validLangs.includes(lang as LangKeys)
    ? (lang as LangKeys)
    : "ro";
  if (validLang === "ro") return roData as Catego;
  const module = await import(`./data/catego-${validLang}.json`);
  return module.default as Catego;
};

type LoaderData = { questions: Catego; language: LangKeys };

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
  component: Index,
});

function Index() {
  const { t } = useTranslation();
  const { questions } = indexRoute.useLoaderData() as LoaderData;
  const [state] = useLocalState();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            {t("common.encourage")}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-flow-col grid-rows-2 gap-2 lg:grid-rows-1 sm:grid-cols-2">
        {Object.keys(questions).map((c) => {
          const corecteCount = state.corecte.filter((q) => q.includes(c)).length;
          const gresiteCount = state.gresite.filter((q) => q.includes(c)).length;
          const totalCount = corecteCount + gresiteCount;
          const maxQuestions = questions[c].length;
          const percentage =
            maxQuestions > 0 ? (totalCount / maxQuestions) * 100 : 0;

          return (
            <Link
              key={c}
              to={`/categoria/${c}/${totalCount}` as any}
              preload={false}
            >
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-center text-2xl font-black">
                    {c.toUpperCase()}
                  </CardTitle>
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
    </div>
  );
}

// ─── Categoria ────────────────────────────────────────────────────────────────

const categoriaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categoria/$categoria/$nr",
  loader: async () => {
    const lang = getCurrentLanguage();
    return { questions: await loadQuestions(lang), language: lang };
  },
  component: Categoria,
});

function Categoria() {
  const { t } = useTranslation();
  const { categoria = "b", nr = "0" } = categoriaRoute.useParams();
  const { questions } = categoriaRoute.useLoaderData() as LoaderData;
  const numarul = Number(nr);

  const raw = localStorage.getItem("state");
  const state = raw ? JSON.parse(raw) : { corecte: [], gresite: [] };

  const chosenCategory = questions[categoria];
  const chosen = chosenCategory?.[numarul];
  const last = !chosenCategory || numarul >= chosenCategory.length;
  const next = last ? chosenCategory?.length || 0 : numarul + 1;

  if (!chosen && !last) return <div>Loading…</div>;

  if (last) {
    const wrongForCategory = (state.gresite as string[]).filter((q) =>
      q.startsWith(categoria)
    );

    if (wrongForCategory.length > 0) {
      return (
        <div className="animate-in fade-in zoom-in duration-300">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>{t("test.done")}</CardTitle>
              <CardDescription>{t("test.congrats")}</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Link
                to={`/retake/${categoria}/0` as any}
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

    return <FinishedCard />;
  }

  return (
    <TestView
      chosen={chosen}
      categoria={categoria}
      next={next}
      isRetake={false}
    />
  );
}

// ─── Retake ───────────────────────────────────────────────────────────────────

const retakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/retake/$categoria/$nr",
  loader: async () => {
    const lang = getCurrentLanguage();
    return { questions: await loadQuestions(lang), language: lang };
  },
  component: Retake,
});

function Retake() {
  const { t } = useTranslation();
  const { categoria = "b", nr = "0" } = retakeRoute.useParams();
  const { questions } = retakeRoute.useLoaderData() as LoaderData;
  const numarul = Number(nr);

  const raw = localStorage.getItem("state");
  const wrongAnswers: string[] = raw ? JSON.parse(raw).gresite : [];
  const categoryWrong = wrongAnswers.filter((q) => q.startsWith(categoria));

  const chosenCategory = questions[categoria];
  const wrongIds = new Set(categoryWrong);
  const wrongQuestions = chosenCategory?.filter((q) => wrongIds.has(q.id)) || [];

  const chosen = wrongQuestions[numarul];
  const last = !chosen || numarul >= wrongQuestions.length;
  const next = last ? wrongQuestions.length : numarul + 1;

  if (!chosen) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t("test.congrats")}</CardTitle>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link to="/" preload={false} viewTransition>
            <Button>{t("common.home")}</Button>
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
          <Link
            to={`/retake/${categoria}/0` as any}
            preload={false}
            viewTransition
          >
            <Button>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("test.startReteste")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <TestView
      chosen={chosen}
      categoria={categoria}
      next={next}
      isRetake={true}
    />
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  categoriaRoute,
  retakeRoute,
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
