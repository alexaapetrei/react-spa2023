import { useState, useEffect } from "react";
interface ServiceWorkerMessageEvent extends MessageEvent {
  data: {
    type: string;
  };
}

function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  useEffect(() => {
    function handleServiceWorkerMessage(event: ServiceWorkerMessageEvent) {
      console.log("Received a message from service worker:", event.data);

      if (event.data && event.data.type === "UPDATE_AVAILABLE") {
        setUpdateAvailable(true);
        console.log("UPDATE_AVAILABLE");

        // If serviceWorker.controller is defined, there is a service worker controlling the page
        if (navigator.serviceWorker.controller) {
          const sw = navigator.serviceWorker.controller;
          setWaitingWorker(sw);
          console.log("There is a service worker controller");
        }
      }
    }

    // Add an event listener for messages from service workers
    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage
    );
    console.log("Added service worker message listener");

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
      console.log("There's a waiting worker");

      // Send a message to the waiting service worker to skip the waiting phase
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      waitingWorker.addEventListener("statechange", (event: Event) => {
        if ((event.target as ServiceWorker).state === "activated") {
          console.log("Service worker activated");
          window.location.reload();
        }
      });
    }
  };

  return { updateAvailable, handleUpdateClick };
}

export default useServiceWorker;
