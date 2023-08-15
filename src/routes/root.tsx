import { Outlet, Link, useOutlet, useParams } from "react-router-dom";
import { Chose } from "./chose";
import { Social } from "../components/social";
import { useRef, ElementRef } from "react";
export default function Root() {
  const outlet = useOutlet();
  type routeProps = {
    categoria: string;
    nr: string;
  };
  const { categoria, nr } = useParams<routeProps>();

  const menuRef = useRef<ElementRef<"label">>(null);

  const changeTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const themes = ["cyberpunk", "dracula", "lofi", "mutedDark", "cookie"];

    // Get the index of the current theme.
    const currentIndex = themes.indexOf(current!);

    // Calculate the index of the next theme. If current is not in the list, default to 0.
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % themes.length;

    document.documentElement.setAttribute("data-theme", themes[nextIndex]);
    localStorage.setItem("currentTheme", themes[nextIndex]);
  };

  const closeMenu = () => {
    if (menuRef.current) menuRef.current.click();
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };
  return (
    <>
      <div className="drawer">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Navbar */}
          <div className="w-full navbar bg-base-300">
            <div className="flex-none lg:hidden">
              <label htmlFor="my-drawer-3" className="btn btn-square btn-ghost">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-6 h-6 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </label>
            </div>
            <div className="flex-1 px-2 mx-2">
              <Link className=" navbar-end" to={"/"}>
                <img
                  className="avatar"
                  src="/bear2023.svg"
                  alt="alive and kicking"
                  width="50px"
                />
              </Link>
              <div className="gap-5">
                {categoria ? (
                  <h2>{`Categoria ${categoria} - intrebarea ${nr}`}</h2>
                ) : (
                  <h2>Hai Salut, Baga si invata !</h2>
                )}
              </div>
            </div>
            <div className="flex-none hidden lg:block">
              <section className="menu gap-3 menu-horizontal">
                <button>STATUS : {mySW.serviceWorkerStatus}</button>
                <Social />
              </section>
            </div>
            <div className="flex-none block">
              <ul className="menu menu-horizontal">
                <li>
                  <label className="swap swap-rotate">
                    {/* this hidden checkbox controls the state */}
                    <input onClick={changeTheme} type="checkbox" />

                    {/* sun icon */}
                    <svg
                      className="swap-on fill-current w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                    </svg>

                    {/* moon icon */}
                    <svg
                      className="swap-off fill-current w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                    </svg>
                  </label>
                </li>
              </ul>
            </div>
          </div>

          {outlet ? <Outlet /> : <Chose />}
        </div>
        <div className="drawer-side">
          <label
            ref={menuRef}
            htmlFor="my-drawer-3"
            className="drawer-overlay"
          ></label>
          <section className="menu p-4 gap-3 w-80 h-full bg-base-200 justify-between">
            {/* Sidebar content here */}
            <Link className="btn btn-primary" onClick={closeMenu} to="/">
              HOME
            </Link>
            <div className="flex flex-col gap-3">
              <p className="font-medium align-middle">
                Nu fi ghiertoi, zi si la alti !
              </p>
              <Social />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
