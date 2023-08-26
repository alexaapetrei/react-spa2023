import useCatego, { LangKeys } from "../hooks/useCatego";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useLocalState from "../hooks/useLocalState";

export function Chose() {
  const { t, i18n } = useTranslation();
  const catego = useCatego(i18n.language as LangKeys);
  const [state, setState] = useLocalState();

  return (
    <section className="bg-neutral-content p-11 rounded-lg m-5">
      <h2 className="text-primary text-2xl">
        {t("common.encourage")} Hell yeah
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {Object.keys(catego).map((c) => {
          const corecteCount = state.corecte.filter((q) =>
            q.includes(c)
          ).length;
          const gresiteCount = state.gresite.filter((q) =>
            q.includes(c)
          ).length;
          const totalCount = corecteCount + gresiteCount;

          return (
            <Link
              key={c}
              className="p-5 rounded-md btn-accent"
              to={`/categoria/${c}/${totalCount}`}
            >
              {c.toUpperCase()}
              <progress
                className="progress progress-secondary w-full"
                title={`${t("common.category")} ${c} - ${t(
                  "common.right"
                )} ${corecteCount} ${t("common.wrong")} ${gresiteCount}`}
                value={totalCount}
                max={catego[c].length}
              >
                {`${t("common.category")} ${c} - ${t(
                  "common.right"
                )} ${corecteCount} ${t("common.wrong")} ${gresiteCount}`}
              </progress>
            </Link>
          );
        })}

        <button
          className="btn btn-block btn-info"
          onClick={() => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: "smooth",
            });
            window.location.reload();
          }}
        >
          {t("root.updateNow")}
        </button>

        <button
          className="btn btn-block btn-warning"
          onClick={() => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: "smooth",
            });
            localStorage.removeItem("state");
            setState({ corecte: [], gresite: [] });
          }}
        >
          {t("common.reset")}
        </button>
      </div>
    </section>
  );
}
