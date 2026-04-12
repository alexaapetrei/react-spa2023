export type Ans = {
  [key: string]: string;
};

export type Category = {
  id: string;
  q: string;
  ans: Ans;
  v: string;
  i?: number;
  imageUrl?: string;
  isCustom?: boolean;
};

export type LangKeys = "ro" | "en" | "de" | "hu";

export type Catego = {
  [key: string]: Category[];
};
