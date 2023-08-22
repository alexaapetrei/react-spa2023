import { useRegisterSW } from "virtual:pwa-register/react";

function useServiceWorker() {
  const intervalMS = 30 * 60 * 1000;
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered:", r);
      if (r?.active?.state === "activated") setOfflineReady(true);
      console.log("We set the offfline to true");
      r &&
        setInterval(() => {
          console.log("checking for updates ... every, ", intervalMS);
          r.update();
        }, intervalMS);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
    setOfflineReady(true);
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return {
    offlineReady,
    needRefresh,
    handleUpdate,
    close,
  };
}

export default useServiceWorker;
