import catego from "../../public/data/catego";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
type localState = { corecte: string[]; gresite: string[] };

export function Chose() {
  const [state, setState] = useState<localState>({ corecte: [], gresite: [] });

  useEffect(() => {
    const localState = localStorage.getItem("state");
    const currentTheme = localStorage.getItem("currentTheme");
    if (currentTheme)
      document.documentElement.setAttribute("data-theme", currentTheme);
    if (!currentTheme) {
      document.documentElement.setAttribute("data-theme", "cookie");
      localStorage.setItem("currentTheme", "cookie");
    }
    if (localState) setState(JSON.parse(localState));
  }, []);

  return (
    <section className="bg-neutral p-11 rounded-lg m-5">
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
          RESET
        </button>
      </div>
    </section>
  );
}
