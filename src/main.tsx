if (import.meta.env.DEV) {
  console.log("Running in development mode. React Grab is enabled.");

  import("react-grab");
}

import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { ThemeProvider } from "./components/ui/theme-provider";
import { initCustomStore } from "./lib/customStore";
import { isLocalRuntime } from "./lib/isLocalhost";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (isLocalRuntime()) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        void Promise.all(registrations.map((registration) => registration.unregister()));
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

initCustomStore().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider
          defaultTheme="system"
          attribute="class"
          enableSystem
          disableTransitionOnChange
        >
          <RouterProvider router={router} />
        </ThemeProvider>
      </I18nextProvider>
    </React.StrictMode>,
  );
});
