import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n, { i18nReady } from "./i18n";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { ThemeProvider } from "./components/ui/theme-provider";
import "./index.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
} else if ("serviceWorker" in navigator && import.meta.env.DEV) {
  void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    const developmentWorkerUrl = new URL("/sw.js", window.location.href).href;
    const appRegistrations = registrations.filter((registration) =>
      [registration.active, registration.waiting, registration.installing].some(
        (worker) => worker?.scriptURL === developmentWorkerUrl,
      ),
    );
    if (appRegistrations.length === 0) return;

    await Promise.all(appRegistrations.map((registration) => registration.unregister()));

    const reloadKey = "dev-service-worker-removed";
    if (
      navigator.serviceWorker.controller?.scriptURL === developmentWorkerUrl &&
      !sessionStorage.getItem(reloadKey)
    ) {
      sessionStorage.setItem(reloadKey, "true");
      window.location.reload();
    }
  });
}

i18nReady.finally(() => {
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
