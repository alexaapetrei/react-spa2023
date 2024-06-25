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

const useCatego = (lang: LangKeys = "ro"): Catego => {
  const [currentCatego, setCurrentCatego] = useState<Catego>(ro);

  useEffect(() => {
    const loadCatego = async () => {
      let categoData: Catego;

      switch (lang) {
        case "en":
          categoData = (await import(`../data/catego-en.json`)).default;
          break;
        case "de":
          categoData = (await import(`../data/catego-de.json`)).default;
          break;
        case "hu":
          categoData = (await import(`../data/catego-hu.json`)).default;
          break;
        default:
          categoData = ro; // default 'ro' data
      }

      setCurrentCatego(categoData);
    };

    loadCatego();
  }, [lang]);

  return currentCatego;
};

export default useCatego;
