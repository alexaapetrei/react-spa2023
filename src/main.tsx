import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import ErrorPage from "./errorPage";
import Root from "./routes/root";
import TestProvider from "./routes/test-provider";

// import { registerSW } from "virtual:pwa-register";

// const updateSW = registerSW({
//   onNeedRefresh() {
//     // Notify the user that a new version is available.
//     if (
//       window.confirm(
//         "A new version of the app is available. Refresh to update?"
//       )
//     ) {
//       // Here, you could use any method provided by updateSW to refresh the service worker.
//       // Assuming updateSW has a method called refreshSW() for this purpose:
//       updateSW.refreshSW();
//     }
//   },

//   onOfflineReady() {
//     // Notify the user that the app is ready for offline use.
//     alert("The app is now ready for offline use!");
//   },
// });

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
