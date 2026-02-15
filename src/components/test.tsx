import type { Category } from "../hooks/useCatego";
import Ans from "./test-choice";
import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import Image from "./ui/image";
import { cn } from "@/lib/utils";

type ChestionarProps = {
  chosen: Category;
  categoria: string;
  next: number;
  isRetake: boolean;
};

export type localState = { corecte: string[]; gresite: string[] };

export default function Test({
  chosen,
  categoria,
  next,
  isRetake = false,
}: ChestionarProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<localState>({ corecte: [], gresite: [] });
  const [active, setActive] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean>(false);
  
  if (chosen.i == undefined) chosen.i = 0;
  const hasImage = chosen.i > 0;
  
  useEffect(() => {
    const localState = localStorage.getItem("state");
    if (localState) setState(JSON.parse(localState));
  }, []);

  const verifica = () => {
    setChecked(true);
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
    const key = active.toString() === chosen.v ? "corecte" : "gresite";
    let newState = { ...state, [key]: [...state[key], chosen.id] };
    if (isRetake && key === "corecte") {
      newState = {
        ...state,
        gresite: state.gresite.filter((g) => g !== chosen.id),
        corecte: [...state.corecte, chosen.id],
      };
    }
    if (isRetake && key === "gresite") {
      newState = { ...state, corecte: [...new Set(state.corecte)] };
    }

    setState(newState);
    localStorage.setItem("state", JSON.stringify(newState));
  };

  const resetChestionar = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    setChecked(false);
    setActive([]);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-3 justify-end mb-6">
        <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          {t("common.category")}: {categoria.toUpperCase()}
        </span>
        <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
          {t("common.question")} {next - 1}
        </span>
      </div>

      <div className={cn(
        hasImage ? "flex flex-col lg:flex-row gap-6" : ""
      )}>
        {hasImage && (
          <div className="lg:w-1/2 flex items-center justify-center bg-muted rounded-lg p-4">
            <Image
              src={`/img/${categoria}/${chosen.i}.jpg`}
              alt="Question"
              className="max-h-80"
            />
          </div>
        )}

        <div className={cn(hasImage ? "lg:w-1/2" : "")}>
          <p className="text-xl font-bold mb-6 first-letter:uppercase wrap-balance leading-relaxed pt-5">
            {chosen.q}
          </p>

          <div className="space-y-3">
            {Object.keys(chosen.ans).map((answer) => (
              <div
                key={answer}
                onClick={() => {
                  if (!checked) {
                    setActive(
                      active.includes(answer)
                        ? active.filter((a) => a !== answer)
                        : [...active, answer]
                    );
                  }
                }}
              >
                <Ans
                  text={chosen.ans[answer]}
                  val={answer}
                  checked={checked}
                  correct={chosen.v}
                  active={active}
                />
              </div>
            ))}
          </div>

          {checked && (
            <div className={cn(
              "mt-6 p-4 rounded-lg text-center font-bold text-lg",
              active.toString() === chosen.v 
                ? "bg-green-500/20 text-green-700 dark:text-green-400" 
                : "bg-red-500/20 text-red-700 dark:text-red-400"
            )}>
              {active.toString() === chosen.v ? t("test.right") : t("test.wrong")}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
        <div className="max-w-3xl mx-auto">
          {checked ? (
            <Link
              to={`/${isRetake ? "retake" : "categoria"}/${categoria}/${next}`}
              onClick={resetChestionar}
              className={cn(
                "block w-full py-4 px-6 rounded-lg text-white text-center font-semibold text-lg",
                active.toString() === chosen.v 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {t("common.next")} →
            </Link>
          ) : active.length > 0 ? (
            <Button 
              onClick={verifica} 
              className="w-full py-6 text-lg"
            >
              {t("test.check")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
