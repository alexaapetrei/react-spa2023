import catego from "../../public/data/catego";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type localState = { corecte: string[]; gresite: string[] };

export function Chose() {
  const [state, setState] = useState<localState>({ corecte: [], gresite: [] });

  useEffect(() => {
    const localState = localStorage.getItem("state");
    if (localState) setState(JSON.parse(localState));
  }, []);
  return (
    <section className="bg-lime-500 p-11 rounded-lg m-5 flex basis-4/5">
      <Accordion type="single" collapsible className="flex-col w-full">
        {Object.keys(catego).map((c) => {
          const corecteCount = state.corecte.filter((q) =>
            q.includes(c)
          ).length;
          const gresiteCount = state.gresite.filter((q) =>
            q.includes(c)
          ).length;
          const totalCount = corecteCount + gresiteCount;

          return (
            <AccordionItem
              key={`catego-${c}`}
              value={`catego-${c}`}
              className="border-green-800"
            >
              <AccordionTrigger className="uppercase">
                Categoria - {c}
              </AccordionTrigger>
              <AccordionContent className="">
                <p>Cum stai pana acuma :</p>
                <Progress
                  value={(totalCount / catego[c].length) * 100}
                ></Progress>
                <p className="my-5">{`Din totalul de ${
                  catego[c].length
                } mai ai ${catego[c].length - totalCount}`}</p>
                <p>{`Corecte: ${corecteCount} Gresite : ${gresiteCount}`}</p>
                <Button asChild className="my-5 justify-self-end">
                  <Link
                    className="uppercase font-semibold justify-center "
                    to={`/categoria/${c}/${totalCount}`}
                  >
                    start categoria {c.toUpperCase()}
                  </Link>
                </Button>
              </AccordionContent>
            </AccordionItem>
          );
        })}

        <AccordionItem value="reset" className="border-green-800">
          <AccordionTrigger className="uppercase">reseteaza</AccordionTrigger>
          <AccordionContent className="">
            <p className="my-6">
              Boss , daca esti sigut ca vrei sa o iei de la capat, da aci un
              reset
            </p>
            <Button
              variant="destructive"
              className=" uppercase font-semibold justify-center"
              onClick={() => {
                localStorage.clear();
                setState({ corecte: [], gresite: [] });
              }}
            >
              reSeT
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
