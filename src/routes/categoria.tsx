import { Link, useLocation, useParams } from "react-router-dom";
import catego from "../../public/data/catego";
import Chestionar from "../components/chestionar";
import type { localState } from "../components/chestionar";

type routeProps = {
  categoria: string;
  nr: string;
};
export default function Categoria() {
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
      <div className="border-base-300 bg-base-100 rounded-b-box rounded-tr-box flex min-h-[6rem] min-w-[18rem] flex-wrap items-center justify-center gap-2 overflow-x-hidden border bg-cover bg-top p-4 m-4">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              Ai terminat setul , acuma poti sa refaci ce ai gresit
            </h2>
            <p>Chair e super fain ca ai putut sa te concentrezi atat !</p>
            <div className="card-actions justify-end">
              <Link className="btn btn-primary" to={`/retake/${categoria}/0`}>
                incepe retestarea
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
          <div className="border-base-300 bg-base-100 rounded-b-box rounded-tr-box flex min-h-[6rem] min-w-[18rem] flex-wrap items-center justify-center gap-2 overflow-x-hidden border bg-cover bg-top p-4 m-4">
            <div className="card w-96 bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Bravo , dar inca mai ai cateva</h2>
                <p>Chair e super fain ca ai putut sa te concentrezi atat !</p>
                <div className="card-actions justify-end">
                  <Link
                    className="btn btn-primary"
                    to={`/retake/${categoria}/0`}
                  >
                    incepe retestarea
                  </Link>
                </div>
              </div>
              <figure>
                <img src="/bear2023.svg" alt="Bravo" />
              </figure>
            </div>
          </div>
        ) : (
          <div className="border-base-300 bg-base-100 rounded-b-box rounded-tr-box flex min-h-[6rem] min-w-[18rem] flex-wrap items-center justify-center gap-2 overflow-x-hidden border bg-cover bg-top p-4 m-4">
            <div className="card w-96 bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {" "}
                  Felicitari ai terminat absolut tot setul de intrebari, poti sa
                  incepi din nou :)
                </h2>
                <p>Repetitia e mama invataturii , bana inca o data</p>
                <div className="card-actions justify-end">
                  <Link
                    className="btn btn-block btn-warning"
                    to={"/"}
                    onClick={() => {
                      localStorage.removeItem("state");
                    }}
                  >
                    RESET
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
      <Chestionar
        next={next}
        chosen={chosen}
        categoria={categoria}
        isRetake={isRetake}
      />
    </div>
  );
}
