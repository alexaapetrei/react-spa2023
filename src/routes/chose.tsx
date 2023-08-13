import catego from "../../public/data/catego";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
type localState = { corecte: string[]; gresite: string[] };

export function Chose() {
  const [state, setState] = useState<localState>({ corecte: [], gresite: [] });

  useEffect(() => {
    const localState = localStorage.getItem("state");
    if (localState) setState(JSON.parse(localState));
  }, []);
  return (
    <section className="bg-lime-500 p-11 rounded-lg my-10">
      <h1 className="text-stone-100 font-bold mb-10 text-2xl text-center">
        Chose your starter
      </h1>
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
              className="p-5 rounded-md bg-slate-50"
              to={`/categoria/${c}/${totalCount}`}
            >
              {c.toUpperCase()}
              <progress
                className="w-full"
                title={`Categoria ${c} - Corecte: ${corecteCount} Gresite : ${gresiteCount}`}
                value={totalCount}
                max={catego[c].length}
              >
                {`Categoria ${c} - Corecte: ${corecteCount} Gresite : ${gresiteCount}`}
              </progress>
            </Link>
          );
        })}

        <button
          className="p-5 rounded-md bg-slate-50"
          onClick={() => {
            localStorage.clear();
            setState({ corecte: [], gresite: [] });
          }}
        >
          RESET
        </button>
      </div>
    </section>
  );
}
