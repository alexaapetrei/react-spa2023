import { Outlet, Link, useOutlet } from "react-router-dom";
import { Chose } from "./chose";
import { Social } from "../components/social";
import { useRef, ElementRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { langs } from "../i18n";

export default function Root() {
  const { t, i18n } = useTranslation();
  const outlet = useOutlet();

  interface ServiceWorkerMessageEvent extends MessageEvent {
    data: {
      type: string;
    };
  }

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

  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  function handleServiceWorkerMessage(event: ServiceWorkerMessageEvent) {
    console.log("WAT - Received a message from service worker:", event.data);

    if (event.data && event.data.type === "UPDATE_AVAILABLE") {
      setUpdateAvailable(true);
      console.log("WAT - UPDATE_AVAILABLE -- whatever that means");
      // If serviceWorker.controller is defined, there is a service worker controlling the page
      if (navigator.serviceWorker.controller) {
        const sw = navigator.serviceWorker.controller;
        setWaitingWorker(sw);
        console.log("WAT - is there a service worker controller ?");
      }
    }
  }
  useEffect(() => {
    //check for theme
    const currentTheme = localStorage.getItem("currentTheme") || "cookie";
    document.documentElement.setAttribute("data-theme", currentTheme);

    // Add an event listener for messages from service workers
    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage
    );
    console.log(
      "WAT- this useEffect that registeres the listener works ... right  "
    );

    // Clean up the event listener on component unmount
    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerMessage
      );
    };
  }, []);

  const handleUpdateClick = () => {
    if (waitingWorker) {
      console.log("WAT- is a waitingWorker ? ? ");

      // Send a message to the waiting service worker to skip the waiting phase
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      waitingWorker.addEventListener("statechange", (event: Event) => {
        if ((event.target as ServiceWorker).state === "activated") {
          console.log("WAT- is this even getting into the statechahged ? ");
          window.location.reload();
        }
      });
    }
  };

  return (
    <>
      <div className="drawer">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Navbar */}
          <div className="w-full navbar bg-base-300">
            <div className="flex-none md:hidden">
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
              <Link
                className=" navbar-end"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "smooth",
                  })
                }
                to={"/"}
              >
                <img
                  className="avatar"
                  src="/bear2023.svg"
                  alt="alive and kicking"
                  width="50px"
                />
              </Link>
              <div className="gap-5">
                {updateAvailable && (
                  <div>
                    <p>{t("root.updateAvailable")}</p>
                    <button onClick={handleUpdateClick}>
                      {t("root.updateNow")}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-none hidden md:block">
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn m-1">
                  {t("common.share")}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <Social />
                </ul>
              </div>
            </div>
            <div className="flex">
              <div key={i18n.language} className="dropdown dropdown-end">
                <label tabIndex={0} className="btn m-1">
                  {i18n.language}
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  {Object.keys(langs).map((c) => (
                    <li key={c + "_lang"}>
                      <button onClick={() => i18n.changeLanguage(c)}>
                        {`${langs[c]}`}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
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
              {t("common.home")}
            </Link>
            <div className="flex flex-col gap-3">
              <p className="font-medium align-middle">
                {t("common.disourage")}
              </p>
              <Social />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
