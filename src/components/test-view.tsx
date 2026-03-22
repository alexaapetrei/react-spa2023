import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import Image from "./ui/image";
import { ArrowRight } from "lucide-react";
import type { Category } from "../hooks/useCatego";

type TestViewProps = {
  chosen: Category;
  categoria: string;
  next: number;
  isRetake: boolean;
};

export function TestView({ chosen, categoria, next, isRetake }: TestViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const [active, setActive] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const hasImage = (chosen.i || 0) > 0;

  const handleCheck = () => {
    setChecked(true);
    const isCorrect = active.toString() === chosen.v;
    const key = isCorrect ? "corecte" : "gresite";
    const raw = localStorage.getItem("state");
    let state = raw ? JSON.parse(raw) : { corecte: [], gresite: [] };

    if (isRetake && isCorrect) {
      state = {
        ...state,
        gresite: state.gresite.filter((g: string) => g !== chosen.id),
        corecte: [...state.corecte, chosen.id],
      };
    } else {
      state = { ...state, [key]: [...state[key], chosen.id] };
    }
    localStorage.setItem("state", JSON.stringify(state));
  };

  const handleNext = () => {
    setChecked(false);
    setActive([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (isRetake) {
      navigate({
        to: "/retake/$categoria/$nr",
        params: { categoria, nr: String(next) },
        viewTransition: true,
      }).then(() => router.invalidate());
    } else {
      navigate({
        to: "/categoria/$categoria/$nr",
        params: { categoria, nr: String(next) },
        viewTransition: true,
      });
    }
  };

  // Shared answer buttons — rendered once regardless of image layout
  const Answers = (
    <div className="space-y-3">
      {Object.keys(chosen.ans).map((answer: string) => (
        <button
          key={answer}
          onClick={() =>
            !checked &&
            setActive((prev) =>
              prev.includes(answer)
                ? prev.filter((a) => a !== answer)
                : [...prev, answer]
            )
          }
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
  );

  const Footer = (
    <CardFooter className="flex gap-4">
      {!checked ? (
        <Button
          onClick={handleCheck}
          disabled={active.length === 0}
          className="flex-1"
        >
          {t("test.check")}
        </Button>
      ) : (
        <Button onClick={handleNext} className="flex-1">
          {t("test.next")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </CardFooter>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          {categoria.toUpperCase()}
        </span>
        <span className="px-3 py-1 rounded-full bg-secondary text-sm">
          {t("common.question")} {next - 1}
        </span>
      </div>

      <Card>
        {hasImage ? (
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-6 flex items-center justify-center bg-muted rounded-l-lg">
              <Image
                src={`/img/${categoria}/${chosen.i}.jpg`}
                alt="Question"
                className="max-h-80 object-contain"
              />
            </div>
            <div className="lg:w-1/2">
              <CardContent className="pt-6 space-y-4">
                <p className="text-xl font-semibold">{chosen.q}</p>
                {Answers}
              </CardContent>
              {Footer}
            </div>
          </div>
        ) : (
          <>
            <CardContent className="pt-6 space-y-4">
              <p className="text-xl font-semibold">{chosen.q}</p>
              {Answers}
            </CardContent>
            {Footer}
          </>
        )}
      </Card>
    </>
  );
}
