import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { HomeActions } from "./home-actions";
import { useTheme } from "./ui/use-theme";
import { Download, HardDrive, Loader2, Moon, Share, Sun } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

/** Appearance, offline status, and reset controls. */
export function SettingsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [offlineReady, setOfflineReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  // iOS has no beforeinstallprompt — fall back to a manual hint.
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setOfflineReady(true)).catch(() => {});
    }

    if (!import.meta.env.PROD) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  };

  const canInstall = !!installPrompt || isIos;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-[300px] flex-col gap-6 overflow-y-auto p-4 sm:w-[350px]"
      >
        <SheetHeader className="p-0">
          <SheetTitle>{t("nav.settings")}</SheetTitle>
          <SheetDescription className="sr-only">{t("nav.settingsDescription")}</SheetDescription>
        </SheetHeader>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground">{t("nav.theme")}</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" />
              {t("nav.light")}
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" />
              {t("nav.dark")}
            </Button>
          </div>
        </section>

        <Separator />

        <HomeActions onReset={() => onOpenChange(false)} />

        {import.meta.env.PROD && (
          <>
            <Separator />
            {!installed && !isStandalone && (
              <button
                onClick={handleInstall}
                disabled={!canInstall}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                  offlineReady
                    ? "border-green-500/30 bg-green-500/10 " +
                      (canInstall
                        ? "cursor-pointer hover:border-green-500/60 hover:bg-green-500/20 active:scale-[0.98]"
                        : "cursor-default")
                    : "border-border/50 bg-muted/30 cursor-default"
                }`}
              >
                <div className="relative shrink-0">
                  {offlineReady ? (
                    <>
                      <HardDrive className="h-5 w-5 text-green-500" />
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
                    </>
                  ) : (
                    <>
                      <HardDrive className="h-5 w-5 text-muted-foreground" />
                      <Loader2 className="absolute -top-1 -right-1 h-3 w-3 animate-spin text-primary" />
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium leading-tight ${offlineReady ? "text-green-600 dark:text-green-400" : ""}`}
                  >
                    {offlineReady ? t("root.offlineReady") : t("root.offlineCaching")}
                  </p>
                  <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                    {isIos && offlineReady
                      ? t("root.iosInstallHint")
                      : offlineReady
                        ? t("root.offlineCached")
                        : t("root.offlinePreparing")}
                  </p>
                </div>
                {offlineReady && canInstall && (
                  <span className="shrink-0 text-muted-foreground">
                    {isIos ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  </span>
                )}
              </button>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
