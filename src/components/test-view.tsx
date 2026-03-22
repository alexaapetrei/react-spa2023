import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
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
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "instant" });
    if (isRetake) {
      navigate({
        to: "/retake/$categoria/$nr",
        params: { categoria, nr: String(next) },
        viewTransition: true,
      }).then(scrollToTop);
    } else {
      navigate({
        to: "/categoria/$categoria/$nr",
        params: { categoria, nr: String(next) },
        viewTransition: true,
      }).then(scrollToTop);
    }
  };

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
          className={`w-full px-4 py-4 rounded-xl border-2 flex items-center gap-4 transition-colors text-left ${
            checked
              ? chosen.v.includes(answer)
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : active.includes(answer)
                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-input opacity-50"
              : active.includes(answer)
              ? "border-primary bg-primary/10"
              : "border-input hover:border-primary/50 hover:bg-accent/30"
          }`}
        >
          <span className="text-xl font-bold w-8 shrink-0 text-center">
            {answer.toUpperCase()}.
          </span>
          <span className="flex-1 leading-snug">{chosen.ans[answer]}</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/*
        question-card: named view transition — slides left when advancing.
        Category + question number are now in the navbar, so this wrapper
        is purely the content card.
      */}
      <div style={{ viewTransitionName: "question-card" }}>
        {/* rounded-none on mobile so the card bleeds to the screen edges,
            rounded-xl on md+ where the container has side padding */}
        <Card className="mb-0 md:mb-4 overflow-hidden rounded-none md:rounded-xl border-x-0 md:border-x">
          {hasImage ? (
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 p-6 flex items-center justify-center bg-muted lg:rounded-l-xl">
                <Image
                  src={`/img/${categoria}/${chosen.i}.jpg`}
                  alt="Question"
                  className="max-h-72 object-contain"
                />
              </div>
              <div className="lg:w-1/2">
                <CardContent className="p-4 space-y-4">
                  <p className="text-lg font-semibold leading-relaxed">{chosen.q}</p>
                  {Answers}
                </CardContent>
              </div>
            </div>
          ) : (
            <CardContent className="p-4 space-y-4">
              <p className="text-lg font-semibold leading-relaxed">{chosen.q}</p>
              {Answers}
            </CardContent>
          )}
        </Card>

        {/* Spacer so the last answer clears the fixed action bar */}
        <div className="h-24" />
      </div>

      {/*
        action-bar: named view transition with animation:none in CSS.
        Stays locked in position while the card slides — no flicker.
        Safe-area padding clears the iPhone home indicator.
      */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm px-3 md:px-6 pt-3"
        style={{
          viewTransitionName: "action-bar",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="max-w-2xl mx-auto">
          {!checked ? (
            <Button
              onClick={handleCheck}
              disabled={active.length === 0}
              className="w-full h-12 text-base"
            >
              {t("test.check")}
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full h-12 text-base">
              {t("test.next")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
