import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./ui/button";
import { Card, CardHeader, CardFooter } from "./ui/card";
import { RotateCcw, Trash2 } from "lucide-react";

export function HomeActions() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

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
        await Promise.all(regs.map((r) => r.update()));

        regs.forEach((r) => {
          if (r.waiting) r.waiting.postMessage({ type: "SKIP_WAITING" });
        });

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
        }
      }

      if ("caches" in window) {
        await Promise.all(
          ["pages-cache", "static-resources", "sqljs-cache"].map((name) => caches.delete(name)),
        );
      }
    } catch (err) {
      console.warn("update error:", err);
    } finally {
      window.location.reload();
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" size="sm" className="w-full" onClick={handleUpdate}>
        <RotateCcw className="mr-2 h-4 w-4" />
        {t("test.update")}
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button variant="destructive" size="sm" className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            {t("common.reset")}
          </Button>
        </Dialog.Trigger>

        <Dialog.Portal>
          {/* Overlay — fades in/out */}
          <Dialog.Overlay className="editorial-dialog-overlay" />

          {/* Content — scales + fades in, scales + fades out */}
          <Dialog.Content className="editorial-dialog-content">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <p className="editorial-kicker">{t("common.maintenance")}</p>
                <Dialog.Title className="text-[24px] font-medium leading-[1.2]">
                  {t("common.resetConfirmTitle")}
                </Dialog.Title>
                <Dialog.Description className="text-[13px] text-muted-foreground">
                  {t("common.resetConfirmText")}
                </Dialog.Description>
              </CardHeader>
              <CardFooter className="justify-end gap-2">
                <Dialog.Close asChild>
                  <Button variant="outline">{t("common.cancel")}</Button>
                </Dialog.Close>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setOpen(false);
                    await performReset();
                  }}
                >
                  {t("common.reset")}
                </Button>
              </CardFooter>
            </Card>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
