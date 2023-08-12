import a from "./a.ts";
import b from "./b.ts";
import c from "./c.ts";
import d from "./d.ts";
import e from "./e.ts";
import r from "./r.ts";
import t from "./t.ts";

export interface Ans {
  [key: string]: string;
}

export interface Category {
  id: string;
  q: string;
  ans: Ans;
  v: string;
  i: number;
}

export interface Catego {
  [key: string]: Category[];
}

const catego: Catego = { a, b, c, d, e, r, t };
export default catego;
