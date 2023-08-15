import React from "react";
import ReactDOM from "react-dom/client";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import ErrorPage from "./errorPage";
import Root from "./routes/root";
import Categoria from "./routes/categoria";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/categoria/:categoria/:nr",
        element: <Categoria />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/retake/:categoria/:nr",
        element: <Categoria />,
        errorElement: <ErrorPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
