import catego from "../../public/data/catego";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
type localState = { corecte: string[]; gresite: string[] };

export function Chose() {
  const [state, setState] = useState<localState>({ corecte: [], gresite: [] });

  const changeTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const themes = ["dark", "light", "cupcake"];

    // Get the index of the current theme.
    const currentIndex = themes.indexOf(current!);

    // Calculate the index of the next theme. If current is not in the list, default to 0.
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % themes.length;

    document.documentElement.setAttribute("data-theme", themes[nextIndex]);
    localStorage.setItem("currentTheme", themes[nextIndex]);
  };

  useEffect(() => {
    const localState = localStorage.getItem("state");
    const currentTheme = localStorage.getItem("currentTheme");
    if (currentTheme)
      document.documentElement.setAttribute("data-theme", currentTheme);
    if (localState) setState(JSON.parse(localState));
  }, []);
  return (
    <section className="bg-lime-500 p-11 rounded-lg m-5">
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
            localStorage.clear();
            setState({ corecte: [], gresite: [] });
          }}
        >
          RESET
        </button>
      </div>
      <button
        onClick={changeTheme}
        className="btn btn-secondary btn-block my-5"
      >
        {" "}
        Change Theme{" "}
      </button>
    </section>
  );
}
