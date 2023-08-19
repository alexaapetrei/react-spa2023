import { useState, useEffect } from 'react';
import ro from "./catego.json";
import en from "./catego-en.json";
import de from "./catego-de.json";
import hu from "./catego-hu.json";
import { useTranslation } from "react-i18next";


export type Ans = {
  [key: string]: string;
};

export type Category = {
  id: string;
  q: string;
  ans: Ans;
  v: string;
  i: number;
}

export type Catego = {
  [key: string]: Category[];
}

// Using a Map to store the options
const options = new Map<string, Catego>([
  ["ro", ro],
  ["en", en],
  ["hu", hu],
  ["de", de]
]);

const availableLangs = [...options.keys()] as const;
export type LangKeys = typeof availableLangs[number];

const useCatego = (): Catego => {
  const { i18n } = useTranslation();
  const [currentCatego, setCurrentCatego] = useState<Catego>(options.get(i18n.language) || ro);

  useEffect(() => {
    setCurrentCatego(options.get(i18n.language) || ro);
  }, [i18n.language]);

  return currentCatego;
}

export default useCatego;
