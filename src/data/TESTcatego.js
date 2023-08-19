import ro from "./catego.json" assert { type: "json" };
import en from "./catego-en.json" assert { type: "json" };
import de from "./catego-de.json" assert { type: "json" };
import hu from "./catego-hu.json" assert { type: "json" };

// Using a Map to store the options
const options = new Map([
  ["ro", ro],
  ["en", en],
  ["hu", hu],
  ["de", de],
]);

function conformsToSchema(obj) {
  return (
    typeof obj.id === "string" &&
    typeof obj.q === "string" &&
    obj.ans &&
    typeof obj.ans.a === "string" &&
    typeof obj.ans.b === "string" &&
    typeof obj.ans.c === "string" &&
    typeof obj.v === "string" &&
    typeof obj.i === "number"
  );
}

for (const [lang, catego] of options.entries()) {
  for (const key in catego) {
    const categories = catego[key];
    for (const category of categories) {
      if (!conformsToSchema(category)) {
        console.log(
          `Non-conforming object in language "${lang}" for key "${key}":`,
          category
        );
      }
    }
  }
}

function catego(lang) {
  return options.get(lang) || ro;
}

export default catego;
