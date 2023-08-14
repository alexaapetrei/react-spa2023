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
    console.log(
      active.toString() === chosen.v ? "RIGHT ___ YAY" : "WRONG nooooo "
    );
  };

  const resetChestionar = () => {
    setChecked(false);
    setActive([]);
  };
  return (
    <>
      <section id="imageAndQuestins" className="pb-20">
        {chosen.i > 0 && (
          <img
            data-fresh-disable-lock
            className="max-w-md min-w-max"
            src={`/img/${categoria}/${chosen.i}.jpg`}
          />
        )}
        <p className="text-2xl text-gray-500 font-bold">{chosen.q}</p>
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
      <section
        id="verificator"
        className="fixed bottom-0 w-full left-0 right-0"
      >
        {checked ? (
          <Link
            className={`flex w-full p-5 m-5 rounded-md
                ${active.toString() == chosen.v ? "bg-green-300" : "bg-red-400"}
                `}
            onClick={resetChestionar}
            to={`/categoria/${categoria}/${next}`}
          >
            Next
          </Link>
        ) : active.length > 0 ? (
          <button
            className="flex w-full p-5 m-5 rounded-md bg-pink-500"
            onClick={verifica}
          >
            Verifica Raspunsurile
          </button>
        ) : null}
      </section>
    </>
  );
}
