import { Outlet, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { langs } from "../i18n";
import { useState, useEffect } from "react";
import { Social } from "./social";
import { Moon, Sun, Menu, Home as HomeIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTheme } from "./ui/use-theme";
import { HomeActions } from "./home-actions";

export function NavLayout() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const routerState = useRouterState();
  const { theme, setTheme } = useTheme();
  const [offlineReady, setOfflineReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // "dan" is a special category that only has Romanian questions
  const isDanRoute = routerState.location.pathname.includes("/categoria/dan/");
  const availableLangs = isDanRoute ? { ro: langs.ro } : langs;

  const handleLanguageChange = (lang: string) => {
    if (isDanRoute && lang !== "ro") return;
    i18n.changeLanguage(lang);
    router.invalidate();
  };

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(() => setOfflineReady(true))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/bear2023.svg" alt="logo" width="40" className="rounded-sm" />
            {offlineReady ? <span>🚀⚡</span> : <span>👩‍💻</span>}
          </Link>

          <div className="flex items-center gap-2">
            {/* ── Mobile: hamburger opens sheet ── */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[350px] flex flex-col pb-8"
              >
                <SheetHeader>
                  <SheetTitle>{t("common.menu")}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-6 px-2 flex-1">
                  <Link
                    to="/"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 text-lg font-medium p-3 rounded-lg hover:bg-accent"
                  >
                    <HomeIcon className="h-5 w-5" />
                    {t("common.home")}
                  </Link>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("common.language")}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="w-full">
                        <Button variant="outline" className="w-full justify-start">
                          {langs[i18n.language as keyof typeof langs]}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {Object.keys(availableLangs).map((c) => (
                          <DropdownMenuItem
                            key={c + "_lang"}
                            onClick={() => handleLanguageChange(c)}
                            className="justify-between"
                          >
                            {availableLangs[c as keyof typeof availableLangs]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex-1"
                    >
                      <Sun className="h-4 w-4 mr-1" />
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex-1"
                    >
                      <Moon className="h-4 w-4 mr-1" />
                    </Button>
                  </div>

                  <HomeActions />
                  <Social />
                </div>
              </SheetContent>
            </Sheet>

            {/* ── Desktop: inline controls + hamburger for sheet ── */}
            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline" size="sm">
                    {i18n.language}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {Object.keys(availableLangs).map((c) => (
                    <DropdownMenuItem
                      key={c + "_lang"}
                      onClick={() => handleLanguageChange(c)}
                    >
                      {availableLangs[c as keyof typeof availableLangs]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSheetOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 min-h-[60vh]">
        <Outlet />
      </main>
    </div>
  );
}
