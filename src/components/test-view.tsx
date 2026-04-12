import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import Image from "./ui/image";
import { ArrowRight, Check, X, Circle } from "lucide-react";
import type { Category } from "../types/catego";

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
  const hasImage = !!chosen.imageUrl || (chosen.i !== undefined && chosen.i !== 0);

  const handleCheck = () => {
    setChecked(true);
    // Sort both sides before comparing so click order doesn't affect correctness,
    // and joining without separator matches how chosen.v is stored ("ab" not "a,b").
    const isCorrect = [...active].sort().join("") === [...chosen.v].sort().join("");
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
      {Object.keys(chosen.ans).map((answer: string) => {
        const isCorrect = chosen.v.includes(answer);
        const isSelected = active.includes(answer);

        // Four post-check states:
        // hit    = correct + selected  → green filled
        // missed = correct + not selected → green border, no fill
        // wrong  = incorrect + selected  → red filled
        // irrelevant = incorrect + not selected → dimmed
        const stateClass = checked
          ? isCorrect && isSelected
            ? "border-green-500 bg-green-500/10"
            : isCorrect && !isSelected
              ? "border-green-500 opacity-75"
              : isSelected
                ? "border-red-500 bg-red-500/10"
                : "border-input opacity-40"
          : isSelected
            ? "border-primary bg-primary/10"
            : "border-input hover:border-foreground hover:bg-accent dark:hover:border-white/60 dark:hover:bg-white/5";

        return (
          <button
            key={answer}
            onClick={() =>
              !checked &&
              setActive((prev) =>
                prev.includes(answer) ? prev.filter((a) => a !== answer) : [...prev, answer],
              )
            }
            disabled={checked}
            className={`relative flex w-full items-center gap-4 border px-4 py-4 text-left transition-colors ${stateClass}`}
          >
            {/* icon badge — absolute over the top-left corner of the letter box, 2px inset */}
            {checked && (isCorrect || isSelected) && (
              <span className="absolute top-0.5 left-0.5">
                {isCorrect && isSelected && <Check className="h-3.5 w-3.5 text-green-600" />}
                {isCorrect && !isSelected && <Circle className="h-3.5 w-3.5 text-green-600" />}
                {!isCorrect && isSelected && <X className="h-3.5 w-3.5 text-red-600" />}
              </span>
            )}
            <span className="w-8 shrink-0 text-center text-lg font-medium uppercase tracking-[0.12em]">
              {answer.toUpperCase()}.
            </span>
            <span className="flex-1 text-[15px] leading-6">{chosen.ans[answer]}</span>
          </button>
        );
      })}
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
        {/* rounded-none on mobile lets the card bleed to the screen edges. */}
        <Card className="mb-0 overflow-hidden rounded-none border-x-0 md:mb-4 md:border-x">
          {hasImage ? (
            <div className="flex flex-col lg:flex-row">
              <div className="flex items-center justify-center bg-black p-6 lg:w-1/2">
                <Image
                  src={chosen.imageUrl ?? `/img/${categoria}/${chosen.i}.jpg`}
                  alt="Question"
                  className="max-h-72 object-contain"
                />
              </div>
              <div className="lg:w-1/2">
                <CardContent className="space-y-5 p-5 md:p-6">
                  <p className="editorial-kicker">{t("common.question")}</p>
                  <p className="text-[24px] font-medium leading-[1.25] text-foreground">
                    {chosen.q}
                  </p>
                  {Answers}
                </CardContent>
              </div>
            </div>
          ) : (
            <CardContent className="space-y-5 p-5 md:p-6">
              <p className="editorial-kicker">{t("common.question")}</p>
              <p className="text-[24px] font-medium leading-[1.25] text-foreground">{chosen.q}</p>
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
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-3 pt-3 md:px-6"
        style={{
          viewTransitionName: "action-bar",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto max-w-2xl">
          {!checked ? (
            <Button
              onClick={handleCheck}
              disabled={active.length === 0}
              className="h-12 w-full text-base"
            >
              {t("test.check")}
            </Button>
          ) : (
            <Button onClick={handleNext} className="h-12 w-full text-base">
              {t("test.next")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
