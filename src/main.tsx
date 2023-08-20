import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import ErrorPage from "./errorPage";
import Root from "./routes/root";
import TestProvider from "./routes/test-provider";

import { Workbox } from "workbox-window";

if ("serviceWorker" in navigator) {
  const wb = new Workbox("/sw.js");

  wb.addEventListener("installed", (event) => {
    if (!event.isUpdate) {
      console.log("Service worker installed for the first time!");
    } else {
      console.log("Service worker updated!");
      window.location.reload(); // Reload the page to use the updated assets
    }
  });

  wb.register();
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/categoria/:categoria/:nr",
        element: <TestProvider />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/retake/:categoria/:nr",
        element: <TestProvider />,
        errorElement: <ErrorPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>
  </React.StrictMode>
);
