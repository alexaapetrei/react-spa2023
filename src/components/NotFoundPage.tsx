import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-xl border border-border bg-card p-8 text-center dark:bg-[#101010]">
        <p className="editorial-kicker text-muted-foreground">404</p>
        <h1 className="mt-2 text-5xl font-medium">Page Not Found</h1>
        <p className="mt-4 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="mt-8">
          <Link to="/">
            <Button>{t("common.home")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
