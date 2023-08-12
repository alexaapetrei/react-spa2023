const t = [
  {
    id: "2498",
    cat: "Redobandire - 13 din 15",
    q: "in care dintre situatii se suspenda exercitarea dreptului de a conduce autovehicule?",
    a: "in cazul depasirii in mod repetat, cu mai mult de 20 km/h, a vitezei maxime legale",
    b: "in cazul neopririi la semnalul agentului de cale ferata",
    c: "in cazul neprezentarii in termen de 24 de ore la unitatea de politie competenta pe raza careia s-a produs un accident cu avarierea vehiculului",
    i: 0,
    v: "c",
  },
  {
    id: "2499",
    cat: "Redobandire - 13 din 15",
    q: "vehicule pot fi depasite, prin exceptie, pe un pod?",
    a: "vehiculele cu tractiune animala, motociclete fara atas si biciclete",
    b: "tractoarele si alte autovehicule lente",
    c: "niciun vehicul",
    i: 0,
    v: "a",
  },
  {
    id: "2500",
    cat: "Redobandire - 13 din 15",
    q: "in care dintre situatiile de mai jos se anuleaza permisul de conducere?",
    a: "pentru conducerea unui autovehicul sub influenta bauturilor alcoolice",
    b: "pentru infractiunile care s-au soldat cu moartea sau vatamarea grava a unei persoane, savarsite ca urmare a nerespectarii regulilor de circulatie",
    c: "pentru nerespectarea semnalelor politistilor la trecerea coloanelor oficiale",
    i: 0,
    v: "b",
  },
];

const transf = t.map((x) => {
  return {
    id: `t-${x.id}`,
    q: x.q,
    ans: { a: x.a, b: x.b, c: x.c },
    v: x.v,
    i: x.i,
  };
});

export default transf;
