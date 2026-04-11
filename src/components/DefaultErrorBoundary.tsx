import { ErrorComponent, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

interface DefaultErrorBoundaryProps {
  error: Error;
}

export function DefaultErrorBoundary({ error }: DefaultErrorBoundaryProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="editorial-kicker text-destructive/60">System Fault</p>
        <h1 className="mt-2 text-7xl font-medium text-destructive">Oops!</h1>
        <p className="mt-4 text-[24px] font-medium">Something went wrong!</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("errorPage.title")}</p>
        <div className="mt-6">
          <ErrorComponent error={error} />
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => router.invalidate()}>Try Again</Button>
        </div>
      </div>
    </div>
  );
}
