import { useState, useEffect } from "react";
import { Workbox } from "workbox-window";

function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Instantiate Workbox instance
    const wb = new Workbox("/sw.js");

    wb.addEventListener("waiting", () => {
      console.log(
        "A new service worker has installed, but it can't activate until all tabs running the current version have fully unloaded."
      );
      setUpdateAvailable(true);
    });

    wb.addEventListener("activated", (event) => {
      if (!event.isUpdate) {
        console.log("Service worker has been activated for the first time!");
      } else {
        console.log("Service worker has been updated and activated!");
        window.location.reload();
      }
    });

    // This will start the service worker registration process
    wb.register();
  }, []);

  const handleUpdateClick = () => {
    if (updateAvailable) {
      // This will prompt the new service worker to take over immediately, which will trigger the "activated" event listener above
      console.log("There's a waiting worker. Letting it take over now.");
      // Inform the waiting service worker to take control immediately
      navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
    }
  };

  return { updateAvailable, handleUpdateClick };
}

export default useServiceWorker;
