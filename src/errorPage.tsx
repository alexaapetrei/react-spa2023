import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "./components/ui/button";

/** Router-level error boundary — shown when a route throws. */
export default function ErrorPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-7xl font-bold text-destructive">Oops!</p>
      <h1 className="text-2xl font-semibold">{t("errorPage.heading")}</h1>
      <p className="text-base text-muted-foreground">{t("errorPage.title")}</p>
      <Button asChild className="mt-4">
        <Link to="/">{t("common.home")}</Link>
      </Button>
    </div>
  );
}
