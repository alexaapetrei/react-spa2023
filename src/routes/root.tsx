import { Outlet, Link, useOutlet, useParams } from "react-router-dom";
import { Chose } from "./chose";
export default function Root() {
  const outlet = useOutlet();
  type routeProps = {
    categoria: string;
    nr: string;
  };
  const { categoria, nr } = useParams<routeProps>();
  return (
    <>
      <div className="navbar bg-neutral text-neutral-content">
        <div className="navbar-start">
          <Link className=" navbar-end" to={"/"}>
            <img
              className="avatar"
              src="/bear2023.svg"
              alt="alive and kicking"
              width="50px"
            />
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <h2>Stai focusat !</h2>
        </div>
        <div className="navbar-end gap-5">
          {categoria ? (
            <h2>{`Categoria ${categoria} - intrebarea ${nr}`}</h2>
          ) : (
            <h2>Hai Salut, Baga si invata !</h2>
          )}
        </div>
      </div>
      {outlet ? <Outlet /> : <Chose />}
    </>
  );
}
