import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export default function ErrorPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-red-500">Oops!</h1>
        <p className="text-4xl font-semibold">Something went wrong!</p>
        <p className="text-2xl mt-2">{t("errorPage.title")}</p>
        <div className="mt-10">
          <Link to="/" className="btn btn-primary">
            {t("common.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
