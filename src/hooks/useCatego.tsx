import { useState, useEffect } from "react";
import ro from "../data/catego.json";

export type Ans = {
  [key: string]: string;
};

export type Category = {
  id: string;
  q: string;
  ans: Ans;
  v: string;
  i?: number;
};

export type LangKeys = "ro" | "en" | "de" | "hu";
export type Catego = {
  [key: string]: Category[];
};

const useCatego = (lang: string | undefined | null): Catego => {
  const [currentCatego, setCurrentCatego] = useState<Catego>(ro);

  useEffect(() => {
    const loadCatego = async () => {
      let categoData: Catego = ro;

      if (lang === "en") {
        categoData = (await import(`../data/catego-en.json`)).default;
      } else if (lang === "de") {
        categoData = (await import(`../data/catego-de.json`)).default;
      } else if (lang === "hu") {
        categoData = (await import(`../data/catego-hu.json`)).default;
      }

      setCurrentCatego(categoData);
    };

    if (lang && lang !== "ro") {
      loadCatego();
    } else {
      setCurrentCatego(ro);
    }
  }, [lang]);

  return currentCatego;
};

export default useCatego;
