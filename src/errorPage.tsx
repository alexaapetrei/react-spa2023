import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "./components/ui/button";

export default function ErrorPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-xl border border-white/10 bg-[#101010] p-8 text-center">
        <p className="editorial-kicker text-white/60">System Fault</p>
        <h1 className="mt-2 text-7xl font-medium text-primary">Oops!</h1>
        <p className="mt-4 text-[24px] font-medium">Something went wrong!</p>
        <p className="mt-2 text-sm text-white/70">{t("errorPage.title")}</p>
        <div className="mt-10">
          <Link to="/">
            <Button>{t("common.home")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
