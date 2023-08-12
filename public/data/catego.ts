import a from "./a.js";
import b from "./b.js";
import c from "./c.js";
import d from "./d.js";
import e from "./e.js";
import r from "./r.js";
import t from "./t.js";

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
