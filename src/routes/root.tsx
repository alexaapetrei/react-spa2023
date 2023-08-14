import { Outlet, Link, useOutlet, useParams } from "react-router-dom";
import { Chose } from "./chose";
import { Button } from "@/components/ui/button";
type routeProps = {
  categoria?: string;
  nr?: string;
};
export default function Root() {
  const outlet = useOutlet();
  const { categoria, nr } = useParams<routeProps>();
  return (
    <>
      <section className="flex w-screen">
        <div className="flex flex-row w-full justify-center items-center  bg-black text-white gap-10">
          <Link to={"/"}>
            <img
              src="/bear2023.svg"
              alt="alive and kicking"
              width="50px"
              className="m-2"
            />
          </Link>
          <h2>Salutare , ia si invata !</h2>
          {categoria && (
            <>
              <h3>Esti in Categoria {categoria.toUpperCase()}</h3>
              <h4>intrebarea {nr}</h4>
            </>
          )}
          {outlet && (
            <Button asChild>
              <Link to={"/"}>Back Home</Link>
            </Button>
          )}
        </div>
      </section>
      {outlet ? <Outlet /> : <Chose />}
    </>
  );
}
