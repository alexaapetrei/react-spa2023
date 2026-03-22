import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { RotateCcw, Trash2 } from "lucide-react";

export function HomeActions() {
  const { t } = useTranslation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const performReset = async () => {
    try {
      localStorage.clear();

      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (err) {
      console.warn("reset error:", err);
    } finally {
      location.reload();
    }
  };

  const handleUpdate = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update()));

        regs.forEach(r => {
          if (r.waiting) r.waiting.postMessage({ type: 'SKIP_WAITING' });
        });

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      if ("caches" in window) {
        await Promise.all([
          'pages-cache',
          'static-resources',
          'sqljs-cache',
        ].map(name => caches.delete(name)));
      }
    } catch (err) {
      console.warn('update error:', err);
    } finally {
      window.location.reload();
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* align actions with card widths: full width on mobile/sm, centered half width on lg */}
        <div className="w-full sm:w-full lg:w-1/2 mx-auto flex justify-center gap-2">
          <Button variant="outline" onClick={handleUpdate}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("test.update")}
          </Button>

          <Button variant="destructive" onClick={() => setShowResetConfirm(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("common.reset")}
          </Button>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowResetConfirm(false)} />
          <div className="z-50 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
            <Card>
              <CardHeader>
                <CardTitle>{t("common.resetConfirmTitle")}</CardTitle>
                <CardDescription>{t("common.resetConfirmText")}</CardDescription>
              </CardHeader>
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => setShowResetConfirm(false)}>{t("common.cancel")}</Button>
                <Button variant="destructive" onClick={async () => {
                  setShowResetConfirm(false);
                  await performReset();
                }}>
                  {t("common.reset")}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
