import { Link, useLocation, useParams } from "react-router-dom";
import useCatego, { LangKeys } from "../hooks/useCatego";
import Test from "../components/test";
import type { localState } from "../components/test";
import { useTranslation } from "react-i18next";

type routeProps = {
  categoria: string;
  nr: string;
};
export default function TestProvider() {
  const { t, i18n } = useTranslation();

  const catego = useCatego(i18n.language as LangKeys);

  const route = useLocation();
  const isRetake = route.pathname.split("/").filter(Boolean)[0] === "retake";
  const { categoria = "b", nr = "0" } = useParams<routeProps>();
  const numarul = Number(nr);

  let state: localState;

  const localState = localStorage.getItem("state");
  if (localState) state = JSON.parse(localState);

  const chosenCategory = isRetake
    ? catego[categoria].filter((q) => state.gresite.includes(q.id))
    : catego[categoria];
  const chosen = chosenCategory[numarul];
  const last = numarul >= chosenCategory.length;
  const next = last ? chosenCategory.length : numarul + 1;

  if (!isRetake && last)
    return (
      <div className="border-base-300 bg-base-100 rounded-b-box rounded-tr-box flex min-h-[6rem] min-w-[10rem] flex-wrap items-center justify-center gap-2 overflow-x-hidden border bg-cover bg-top p-4 m-4">
        <div className="card w-69 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{t("test.done")}</h2>
            <p>{t("test.congrats")}</p>
            <div className="card-actions justify-end">
              <Link className="btn btn-primary" to={`/retake/${categoria}/0`}>
                {t("test.startRetest")}
              </Link>
            </div>
          </div>
          <figure className="">
            <img src="/bear2023.svg" alt="Bravo" />
          </figure>
        </div>
      </div>
    );

  if (isRetake && last)
    return (
      <>
        {chosenCategory.length > 0 ? (
          <div className="border-base-300 bg-base-100 rounded-b-box rounded-tr-box flex min-h-[6rem] min-w-[10rem] flex-wrap items-center justify-center gap-2 overflow-x-hidden border bg-cover bg-top p-4 m-4">
            <div className="card w-69 bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{t("test.stillSomeLeft")}</h2>
                <p>{t("test.congrats")}</p>
                <div className="card-actions justify-end">
                  <Link
                    className="btn btn-primary"
                    to={`/retake/${categoria}/0`}
                  >
                    {t("test.startRetest")}
                  </Link>
                </div>
              </div>
              <figure>
                <img src="/bear2023.svg" alt="Bravo" />
              </figure>
            </div>
          </div>
        ) : (
          <div className="border-base-300 bg-base-100 rounded-b-box rounded-tr-box flex min-h-[6rem] min-w-[10rem] flex-wrap items-center justify-center gap-2 overflow-x-hidden border bg-cover bg-top p-4 m-4">
            <div className="card w-69 bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{t("test.finished")}</h2>
                <p> {t("test.tip")}</p>
                <div className="card-actions justify-end">
                  <Link
                    className="btn btn-block btn-warning"
                    to={"/"}
                    onClick={() => {
                      const catRemoved: localState = {
                        corecte: state.corecte.filter(
                          (q) => !q.includes(categoria)
                        ),

                        gresite: state.gresite.filter(
                          (q) => !q.includes(categoria)
                        ),
                      };

                      localStorage.setItem("state", JSON.stringify(catRemoved));
                    }}
                  >
                    {t("common.reset")} {t("common.category")}{" "}
                    {categoria.toLocaleLowerCase()}
                  </Link>
                </div>
              </div>
              <figure>
                <img src="/bear2023.svg" alt="Bravo" />
              </figure>
            </div>
          </div>
        )}
      </>
    );
  /// flex lg:flex-row sm:flex-col
  return (
    <div className=" m-1 lg:m-5">
      <Test
        next={next}
        chosen={chosen}
        categoria={categoria}
        isRetake={isRetake}
      />
    </div>
  );
}
