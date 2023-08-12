if ("serviceWorker" in navigator) {
  const registration = await navigator.serviceWorker.register(
    "/sw.js",
  );
  console.info(
    `Service worker registered with scope: ${registration.scope}`,
  );
}
