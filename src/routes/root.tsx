import { Outlet, Link } from "react-router-dom";
export default function Root() {
  return (
    <>
      <div className="flex justify-center  bg-black text-white font-mono text-2xl gap-6 py-5">
        <img
          src="/bear2023.svg"
          alt="alive and kicking"
          width="60px"
          height="60px"
        />
        <h2>Hello ther go here -&gt;</h2>
        <Link to={"/chose"}>CHOSE SOMETHING</Link>
      </div>

      <Outlet />
    </>
  );
}
