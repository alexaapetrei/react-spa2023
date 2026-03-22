import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "./ui/card";

export function FinishedCard() {
  const { t } = useTranslation();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const end = Date.now() + 2000;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  }, []);

  return (
    <div className="animate-in fade-in zoom-in duration-500">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t("test.finished")}</CardTitle>
          <CardDescription>{t("test.congrats")}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link to="/" preload={false} viewTransition>
            <Button>{t("common.home")}</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
