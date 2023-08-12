import { useParams } from "react-router-dom";
import catego from "../../public/data/catego";
import Chestionar from "../components/chestionar";
import { Link } from "react-router-dom";

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
    <div className="flex sm:flex-row flex-col p-5 bg-orange-300 gap-5">
      <div className="basis-1/4">
        <Link className=" p-5 rounded-md bg-slate-300 flex" to={`/chose`}>
          &lt; BACK
        </Link>
      </div>

      <div className="basis-3/4">
        <Chestionar next={next} chosen={chosen} categoria={categoria} />
      </div>
    </div>
  );
}
