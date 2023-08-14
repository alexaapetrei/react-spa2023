import { useParams } from "react-router-dom";
import catego from "../../public/data/catego";
import Chestionar from "../components/chestionar";

type routeProps = {
  categoria: string;
  nr: string;
};
export default function Categoria() {
  const { categoria = "b", nr = "0" } = useParams<routeProps>();

  const numarul = Number(nr);

  const chosen = catego[categoria][numarul];
  const last = numarul * 1 + 1 == catego[categoria].length;
  const next = last ? catego[categoria].length - 1 : numarul * 1 + 1;

  //   if (!categoria || !chosen) return <Chose />;
  return (
    <section className="flex flex-col m-10 basis-4/5">
      <Chestionar next={next} chosen={chosen} categoria={categoria} />
    </section>
  );
}
