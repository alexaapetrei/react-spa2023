import type { Category } from "../../public/data/catego";
import Ans from "../components/ans.tsx";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// import catego from "../../public/data/catego";

interface ChestionarProps {
  chosen: Category;
  categoria: string;
  next: number;
}

type localState = { corecte: string[]; gresite: string[] };

export default function Chestionar({
  chosen,
  categoria,
  next,
}: ChestionarProps) {
  const [state, setState] = useState<localState>({ corecte: [], gresite: [] });

  const [active, setActive] = React.useState<string[]>([]);
  const [checked, setChecked] = React.useState<boolean>(false);
  // THIS IS HOW TO GENERATE THE URL LIST FOR THE CACHING
  // const allTheKeys = Object.keys(catego);
  // const allTheQuestions = allTheKeys.map((k) =>
  //   catego[k].map((c, i) => `/categoria/${k}/${i}`)
  // ).flat();
  // const allTheImmages = allTheKeys.map((k) =>
  //   catego[k].map((c, i) => {
  //     if (c.i) return `/img/${k}/${c.i}.jpg`;
  //   })
  // ).flat().filter(Boolean);
  // console.log("CATEGO", allTheQuestions);
  // console.log("IMAGES", allTheImmages);
  useEffect(() => {
    const localState = localStorage.getItem("state");
    if (localState) setState(JSON.parse(localState));
  }, []);

  const verifica = () => {
    setChecked(true);
    const key = active.toString() === chosen.v ? "corecte" : "gresite";
    const newState = { ...state, [key]: [...state[key], chosen.id] };

    setState(newState);
    localStorage.setItem("state", JSON.stringify(newState));
  };

  const resetChestionar = () => {
    setChecked(false);
    setActive([]);
  };
  return (
    <>
      <div
        id="wrapper"
        className="flex w-full flex-col sm:felx-row md:flex-row lg:flex-row "
      >
        {chosen.i > 0 && (
          <>
            <section className="grid flex-grow items-center justify-center">
              <img
                data-fresh-disable-lock
                className=""
                src={`/img/${categoria}/${chosen.i}.jpg`}
              ></img>
            </section>
            <div className="divider md:divider-horizontal"></div>
          </>
        )}

        <section className="grid flex-grow pb-[10rem]">
          <p className="text-2xl text-gray-500 font-bold mb-5 first-letter:uppercase">
            {chosen.q}
          </p>

          {Object.keys(chosen.ans).map((answer) => (
            <div
              key={answer}
              onClick={() => {
                checked
                  ? null
                  : setActive(
                      (active.includes(answer)
                        ? active.filter((a) => a !== answer)
                        : [...active, answer]
                      ).sort()
                    );
              }}
            >
              <Ans
                text={chosen.ans[answer]}
                val={answer}
                checked={checked}
                correct={chosen.v}
                active={active}
              />
            </div>
          ))}
        </section>
      </div>
      {checked ? (
        <>
          <div className="btm-nav">
            <Link
              className={` text-white uppercase font-semibold btn btn-block
                ${active.toString() == chosen.v ? "btn-success" : "btn-error"}
                `}
              onClick={resetChestionar}
              to={`/categoria/${categoria}/${next}`}
            >
              <span className="btm-nav-label">NEXT</span>
            </Link>
          </div>
        </>
      ) : active.length > 0 ? (
        <div className="btm-nav">
          <button onClick={verifica} className="btn btn-block btn-info ">
            <span className="btm-nav-label">Verifica Raspunsurile</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
