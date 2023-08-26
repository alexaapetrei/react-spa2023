import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

function useServiceWorker() {
  const [msg, setMsg] = useState<string>("");

  const intervalMS = 30 * 60 * 1000;

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered: handleServiceWorkerRegistration,
    onRegisterError: handleServiceWorkerRegistrationError,
  });

  function handleServiceWorkerRegistration(r?: ServiceWorkerRegistration) {
    if (r?.active?.state === "activating") setMsg("installing");
    if (r?.waiting) setMsg("waiting");
    if (r?.active?.state === "activated") {
      setOfflineReady(true);
      setMsg("ready");
    }
    console.log("WAT -- r -- ", r);
  }

  function handleServiceWorkerRegistrationError(error: unknown) {
    console.error("SW registration error", error);
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      updateServiceWorker(true);
    }, intervalMS);

    return () => clearInterval(intervalId);
  }, [updateServiceWorker, intervalMS]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setOfflineReady(true);
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return {
    msg,
    offlineReady,
    needRefresh,
    handleUpdate,
    close,
  };
}

export default useServiceWorker;
