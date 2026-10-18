import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import Image from "./ui/image";
import { ArrowRight, Check, X, Circle } from "lucide-react";
import type { Category, QuizContent } from "../hooks/useCatego";
import { recordAnswer } from "../lib/progress-store";

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
  const questionContent = contentParts(chosen.q);
  const hasImage = !!questionContent.image || (chosen.i || 0) > 0;
  const correctKeys = chosen.v.replaceAll(",", "").split("");
  const actionButtonClass =
    "h-12 w-full text-base dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:disabled:bg-neutral-800/60 dark:disabled:text-neutral-300";

  const handleCheck = () => {
    setChecked(true);
    // `chosen.v` is a *set* of correct keys ("ab", "abc"), and the order the
    // user picks them in is arbitrary — compare as sets, not strings.
    // (Comparing `active.toString()` yielded "a,b" and could never equal "ab",
    // which silently made every multi-answer question unanswerable.)
    const isCorrect =
      active.length === correctKeys.length && active.every((key) => correctKeys.includes(key));
    recordAnswer(chosen.id, isCorrect);
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
        const isCorrect = correctKeys.includes(answer);
        const answerContent = contentParts(chosen.ans[answer]);
        const isSelected = active.includes(answer);

        // Four post-check states:
        // hit    = correct + selected  → green filled
        // missed = correct + not selected → green border, no fill
        // wrong  = incorrect + selected  → red filled
        // irrelevant = incorrect + not selected → dimmed
        const stateClass = checked
          ? isCorrect && isSelected
            ? "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/30"
            : isCorrect && !isSelected
              ? "border-green-500 opacity-75 dark:border-green-400"
              : isSelected
                ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/30"
                : "border-input opacity-40"
          : isSelected
            ? "border-primary bg-primary/10 dark:border-sky-400 dark:bg-sky-400/10 dark:ring-1 dark:ring-sky-400/50"
            : "border-input hover:border-primary/50 hover:bg-accent/30 dark:hover:border-neutral-500";

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
            aria-pressed={isSelected}
            className={`relative w-full px-4 py-4 rounded-xl border-2 flex items-center gap-4 transition-colors text-left ${stateClass}`}
          >
            {/* icon badge — absolute over the top-left corner of the letter box, 2px inset */}
            {checked && (isCorrect || isSelected) && (
              <span className="absolute top-0.5 left-0.5">
                {isCorrect && isSelected && <Check className="h-3.5 w-3.5 text-green-600" />}
                {isCorrect && !isSelected && <Circle className="h-3.5 w-3.5 text-green-600" />}
                {!isCorrect && isSelected && <X className="h-3.5 w-3.5 text-red-600" />}
              </span>
            )}
            <span className="text-xl font-bold w-8 shrink-0 text-center">
              {answer.toUpperCase()}
            </span>
            <span className="flex-1 leading-snug">
              {answerContent.text}
              {answerContent.image && (
                <img
                  src={answerContent.image}
                  alt=""
                  className="mt-2 max-h-48 max-w-full rounded-lg object-contain"
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col md:min-h-[calc(100svh-4.5rem)]">
      {/*
        question-card: named view transition — slides left when advancing.
        Category + question number are now in the navbar, so this wrapper
        is purely the content card.
      */}
      <div className="flex flex-1 flex-col" style={{ viewTransitionName: "question-card" }}>
        {/* rounded-none on mobile so the card bleeds to the screen edges,
            rounded-xl on md+ where the container has side padding */}
        <Card className="mb-0 md:mb-4 overflow-hidden rounded-none md:rounded-xl border-x-0 md:border-x">
          {hasImage ? (
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-1/2 p-6 flex items-center justify-center bg-muted lg:rounded-l-xl">
                <Image
                  src={questionContent.image || `/img/${categoria}/${chosen.i}.jpg`}
                  alt="Question"
                  className="max-h-72 object-contain"
                />
              </div>
              <div className="lg:w-1/2">
                <CardContent className="p-4 space-y-4">
                  <p className="text-lg font-semibold leading-relaxed">{questionContent.text}</p>
                  {Answers}
                </CardContent>
              </div>
            </div>
          ) : (
            <CardContent className="p-4 space-y-4">
              <p className="text-lg font-semibold leading-relaxed">{questionContent.text}</p>
              {Answers}
            </CardContent>
          )}
        </Card>

        {/* Fill short pages; leave a small scroll buffer on long ones. */}
        <div className="min-h-24 flex-1" />
      </div>

      {/*
        action-bar: named view transition with animation:none in CSS.
        Stays locked in position while the card slides — no flicker.
        Sticky positioning keeps the bar constrained to the question column,
        which naturally excludes both desktop sidebars and remains full-width
        on mobile where the sidebars become overlays.
        Safe-area padding clears the iPhone home indicator.
      */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-3 pt-3 backdrop-blur-sm md:sticky md:inset-x-auto md:-mx-4 md:px-6"
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
              className={actionButtonClass}
            >
              {t("test.check")}
            </Button>
          ) : (
            <Button onClick={handleNext} className={actionButtonClass}>
              {t("test.next")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function contentParts(content: QuizContent): { text: string; image?: string } {
  if (typeof content === "string") return { text: content };
  return { text: Object.values(content.text)[0] ?? "", image: content.image };
}
