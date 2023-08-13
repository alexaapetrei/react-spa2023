import React from "react";
import ReactDOM from "react-dom/client";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import ErrorPage from "./errorPage";
import Root from "./routes/root";
import Categoria from "./routes/categoria";
import { Chose } from "./routes/chose";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/src/sw.js")
    .then((registration) => {
      console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch((err) => {
      console.error("Service Worker registration failed:", err);
    });
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/app",
        element: <App />,
      },
      {
        path: "/chose",
        element: <Chose />,
      },
    ],
  },
  {
    path: "/categoria/:categoria/:nr",
    element: <Categoria />,
    errorElement: <ErrorPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
